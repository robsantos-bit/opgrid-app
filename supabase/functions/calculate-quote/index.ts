import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeia cidade/UF para região da tabela comercial
function detectRegiao(cidade: string, uf: string): string {
  const c = (cidade || "").toLowerCase().trim();
  const u = (uf || "").toUpperCase().trim();

  if (u === "SP") {
    if (c === "são paulo" || c === "sao paulo") return "São Paulo Capital";
    const abcd = ["santo andré", "são bernardo do campo", "são caetano do sul", "diadema",
      "mauá", "ribeirão pires", "rio grande da serra", "guarulhos", "osasco", "barueri",
      "carapicuíba", "cotia", "taboão da serra", "embu das artes", "itapecerica da serra"];
    if (abcd.some(x => c.includes(x))) return "Grande São Paulo (ABCD)";
    if (c.includes("campinas") || c.includes("jundiaí") || c.includes("piracicaba") || c.includes("limeira")) return "Interior SP - Campinas";
    if (c.includes("ribeirão preto") || c.includes("franca") || c.includes("araraquara")) return "Interior SP - Ribeirão Preto";
    if (c.includes("sorocaba") || c.includes("itu") || c.includes("votorantim")) return "Interior SP - Sorocaba";
    if (c.includes("são josé dos campos") || c.includes("taubaté") || c.includes("jacareí")) return "Interior SP - São José dos Campos";
    if (c.includes("santos") || c.includes("guarujá") || c.includes("praia grande") || c.includes("são vicente")) return "Litoral SP";
  }
  if (u === "RJ") {
    if (c === "rio de janeiro") return "Rio de Janeiro Capital";
    if (c.includes("niterói") || c.includes("duque de caxias") || c.includes("nova iguaçu") || c.includes("são gonçalo")) return "Grande Rio (Niterói/Baixada)";
  }
  if (c.includes("belo horizonte") && u === "MG") return "Belo Horizonte";
  if (c.includes("curitiba") && u === "PR") return "Curitiba";

  return "Nacional (Padrão)";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { origem, destino, tipo_veiculo, possui_patins, eh_noturno, origem_cidade, origem_uf } = await req.json();

    if (!origem || !destino) {
      return new Response(JSON.stringify({ erro: "Origem e destino são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Detectar região pela origem
    const regiao = detectRegiao(origem_cidade || "", origem_uf || "");
    console.log(`Região detectada: ${regiao} (cidade: ${origem_cidade}, uf: ${origem_uf})`);

    // 2. Buscar tabela comercial vigente para a região (maior prioridade)
    const hoje = new Date().toISOString().split("T")[0];
    const { data: tabelas } = await supabase
      .from("tabelas_comerciais")
      .select("id, nome, prioridade, regioes")
      .eq("status", "Vigente")
      .lte("vigencia_inicio", hoje)
      .gte("vigencia_fim", hoje)
      .order("prioridade", { ascending: false });

    // Filtrar tabelas que contêm a região detectada ou "Nacional (Padrão)"
    let tabelaSelecionada = tabelas?.find((t: any) => t.regioes?.includes(regiao));
    if (!tabelaSelecionada) {
      tabelaSelecionada = tabelas?.find((t: any) => t.regioes?.includes("Nacional (Padrão)"));
    }

    // 3. Buscar itens da tabela selecionada
    let tabelaItens: Record<string, any> = {};
    if (tabelaSelecionada) {
      const { data: itens } = await supabase
        .from("tabelas_comerciais_itens")
        .select("tarifa_nome, valor, franquia, valor_excedente, minimo")
        .eq("tabela_id", tabelaSelecionada.id);

      if (itens) {
        for (const item of itens) {
          tabelaItens[item.tarifa_nome] = item;
        }
      }
    }

    const getTabItem = (nome: string) => tabelaItens[nome] || null;

    // 4. Fallback: pricing_config para valores não definidos na tabela comercial
    const { data: configs } = await supabase.from('pricing_config').select('chave, valor, porcentagem').eq('ativo', true);
    const getPrice = (key: string) => configs?.find((c: any) => c.chave === key);

    // 5. Google Routes API
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

    // 6. Extração de Dados
    const fatorCorrecao = getPrice('fator_correcao_rodoviario')?.valor || 1.3;
    const distanciaKm = (route.distanceMeters / 1000) * fatorCorrecao;
    const pedagioBaseGoogle = Number(route.travelAdvisory?.tollInfo?.estimatedPrice?.[0]?.units || 0);
    const fatorIdaVolta = getPrice('fator_ida_volta')?.valor || 2;

    // Eixos
    let multiplicadorEixo = 1;
    if (tipo_veiculo === 'pesado') {
      multiplicadorEixo = getPrice('multiplicador_eixo_caminhao')?.valor || 2;
    }

    // 7. Precificação: prioriza tabela comercial, fallback para pricing_config
    const itemSaida = getTabItem('Saída');
    const itemKm = getTabItem('Km Excedente');
    const itemNoturno = getTabItem('Adicional Noturno');
    const itemPatins = getTabItem('Patins');
    const itemGuinchoPesado = getTabItem('Guincho Pesado');

    // Taxa base (Saída)
    const valorBase = itemSaida?.valor || getPrice('taxa_base')?.valor || 180;

    // Custo por km (com franquia da tabela comercial)
    let custoKmBase = getPrice('custo_km_padrao')?.valor || 4.5;
    let adicionalTipo = 0;

    if (tipo_veiculo === 'utilitario') {
      custoKmBase = getPrice('custo_km_utilitario')?.valor || 5.5;
      adicionalTipo = getPrice('adicional_utilitario')?.valor || 300;
    } else if (tipo_veiculo === 'pesado') {
      custoKmBase = getPrice('custo_km_pesado')?.valor || 7.0;
      adicionalTipo = itemGuinchoPesado?.valor || getPrice('adicional_pesado')?.valor || 600;
    }

    // Se tabela comercial tem Km Excedente, usa valor e franquia dela
    if (itemKm) {
      custoKmBase = itemKm.valor;
    }
    const franquiaKm = itemKm?.franquia || 0;
    const kmCobravel = Math.max(0, distanciaKm - franquiaKm);
    const custoDistancia = kmCobravel * custoKmBase * fatorIdaVolta;

    // Km excedente (se acima da franquia e há valor excedente definido)
    let custoExcedente = 0;
    if (itemKm?.valor_excedente && kmCobravel > 0) {
      // Usa valor_excedente em vez de valor base para km acima da franquia
      custoExcedente = kmCobravel * (itemKm.valor_excedente - itemKm.valor) * fatorIdaVolta;
      if (custoExcedente < 0) custoExcedente = 0;
    }

    // Patins
    const adicionalPatins = possui_patins ? (itemPatins?.valor || getPrice('adicional_patins')?.valor || 300) : 0;

    // Pedágio
    const repassePedagioAtivo = (getPrice('repasse_pedagio_ativo')?.valor || 1) === 1;
    const custoPedagios = repassePedagioAtivo ? (pedagioBaseGoogle * multiplicadorEixo) * fatorIdaVolta : 0;

    let total = valorBase + custoDistancia + custoExcedente + adicionalTipo + adicionalPatins + custoPedagios;

    // Adicional Noturno
    let valorNoturno = 0;
    if (eh_noturno) {
      if (itemNoturno && itemNoturno.valor > 0) {
        // Tabela comercial define valor fixo para noturno
        valorNoturno = itemNoturno.valor;
      } else {
        // Fallback: porcentagem do pricing_config
        const percNoturno = getPrice('adicional_noturno')?.porcentagem || 0.40;
        valorNoturno = total * percNoturno;
      }
      total += valorNoturno;
    }

    // Valor Mínimo (da tabela ou pricing_config)
    const valorMinimo = itemSaida?.minimo || getPrice('valor_minimo')?.valor || 180;
    if (total < valorMinimo) total = valorMinimo;

    return new Response(JSON.stringify({
      sucesso: true,
      orcamento: {
        total: Number(total.toFixed(2)),
        distancia_km: Number(distanciaKm.toFixed(1)),
        franquia_km: franquiaKm,
        pedagios: custoPedagios,
        taxa_base: valorBase,
        custo_km: custoDistancia + custoExcedente,
        adicional_tipo: adicionalTipo,
        adicional_patins: adicionalPatins,
        adicional_noturno: valorNoturno,
        previsao_chegada: route.duration,
        tabela_aplicada: tabelaSelecionada?.nome || 'pricing_config (fallback)',
        regiao_detectada: regiao,
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
