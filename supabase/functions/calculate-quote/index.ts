import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { origem, destino, tipo_veiculo, possui_patins, eh_noturno } = await req.json();

    if (!origem || !destino) {
      return new Response(JSON.stringify({ erro: "Origem e destino são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Busca Configurações de Preço
    const { data: configs } = await supabase.from('pricing_config').select('chave, valor, porcentagem').eq('ativo', true);
    const getPrice = (key: string) => configs?.find((c: any) => c.chave === key);

    // 2. Chamada Google Routes (Pedágios)
    const googleKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleKey) {
      return new Response(JSON.stringify({ erro: "GOOGLE_MAPS_API_KEY não configurada." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const routeResponse = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo'
      },
      body: JSON.stringify({
        origin: { address: origem },
        destination: { address: destino },
        travelMode: 'DRIVE',
        extraComputations: ['TOLLS'],
        routeModifiers: { vehicleInfo: { emissionType: 'GASOLINE' } }
      })
    });

    const routeData = await routeResponse.json();
    const route = routeData.routes?.[0];

    if (!route) {
      console.error("Google Routes API error:", JSON.stringify(routeData));
      throw new Error("Não foi possível calcular a rota entre os endereços.");
    }

    // 3. Extração de Dados e Fatores
    const distanciaKm = (route.distanceMeters / 1000) * (getPrice('fator_correcao_rodoviario')?.valor || 1.3);
    const pedagioBaseGoogle = Number(route.travelAdvisory?.tollInfo?.estimatedPrice?.[0]?.units || 0);
    const fatorIdaVolta = getPrice('fator_ida_volta')?.valor || 2;

    // 🚛 LÓGICA DE EIXOS
    let multiplicadorEixo = 1;
    if (tipo_veiculo === 'pesado') {
      multiplicadorEixo = getPrice('multiplicador_eixo_caminhao')?.valor || 2;
    }

    // 4. Lógica de Precificação por Tipo
    let custoKmBase = getPrice('custo_km_padrao')?.valor || 4.5;
    let adicionalTipo = 0;

    if (tipo_veiculo === 'utilitario') {
      custoKmBase = getPrice('custo_km_utilitario')?.valor || 5.5;
      adicionalTipo = getPrice('adicional_utilitario')?.valor || 300;
    } else if (tipo_veiculo === 'pesado') {
      custoKmBase = getPrice('custo_km_pesado')?.valor || 7.0;
      adicionalTipo = getPrice('adicional_pesado')?.valor || 600;
    }

    // 5. Cálculos Finais
    const valorBase = getPrice('taxa_base')?.valor || 180;
    const custoDistancia = distanciaKm * custoKmBase * fatorIdaVolta;
    const adicionalPatins = possui_patins ? (getPrice('adicional_patins')?.valor || 300) : 0;

    // 💰 CÁLCULO DO PEDÁGIO: (Google * Eixos) * IdaVolta
    const repassePedagioAtivo = (getPrice('repasse_pedagio_ativo')?.valor || 1) === 1;
    const custoPedagios = repassePedagioAtivo ? (pedagioBaseGoogle * multiplicadorEixo) * fatorIdaVolta : 0;

    let total = valorBase + custoDistancia + adicionalTipo + adicionalPatins + custoPedagios;

    // Adicional Noturno
    let valorNoturno = 0;
    if (eh_noturno) {
      const percNoturno = getPrice('adicional_noturno')?.porcentagem || 0.40;
      valorNoturno = total * percNoturno;
      total += valorNoturno;
    }

    // Valor Mínimo
    const valorMinimo = getPrice('valor_minimo')?.valor || 180;
    if (total < valorMinimo) total = valorMinimo;

    return new Response(JSON.stringify({
      sucesso: true,
      orcamento: {
        total: Number(total.toFixed(2)),
        distancia_km: Number(distanciaKm.toFixed(1)),
        pedagios: custoPedagios,
        taxa_base: valorBase,
        custo_km: custoDistancia,
        adicional_tipo: adicionalTipo,
        adicional_patins: adicionalPatins,
        adicional_noturno: valorNoturno,
        previsao_chegada: route.duration
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("calculate-quote error:", e);
    return new Response(JSON.stringify({ erro: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
