import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    // Suporta chamada direta (solicitacao_id), webhook (record.id), ou campo id direto
    const solicitacaoId = payload.solicitacao_id || payload.record?.id || payload.id;

    if (!solicitacaoId) {
      return new Response(JSON.stringify({ error: "solicitacao_id ou record.id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[DISPATCH] Iniciando para solicitação ${novaSolicitacao.id}`);

    // 1. Busca dados completos da solicitação
    const { data: sol, error: solErr } = await supabase
      .from("solicitacoes")
      .select("*")
      .eq("id", novaSolicitacao.id)
      .maybeSingle();

    if (solErr || !sol) {
      console.error("[DISPATCH] Solicitação não encontrada:", solErr);
      return new Response(JSON.stringify({ error: "Solicitação não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Busca prestador ativo (maybeSingle evita crash se não houver)
    const { data: prestador, error: prestadorErr } = await supabase
      .from("prestadores")
      .select("id, nome, telefone, status")
      .eq("status", "Ativo")
      .limit(1)
      .maybeSingle();

    if (prestadorErr || !prestador) {
      console.warn("[DISPATCH] Nenhum prestador ativo encontrado");
      return new Response(JSON.stringify({ error: "Nenhum prestador ativo disponível" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Cria a oferta (dispatch_offers)
    const { data: oferta, error: ofertaErr } = await supabase
      .from("dispatch_offers")
      .insert({
        solicitacao_id: sol.id,
        prestador_id: prestador.id,
        status: "pending",
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (ofertaErr || !oferta) {
      console.error("[DISPATCH] Erro ao criar oferta:", ofertaErr);
      return new Response(JSON.stringify({ error: "Erro ao criar oferta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Monta e envia mensagem WhatsApp ao prestador
    const link = `https://opgrid.lovable.app/prestador/oferta/${oferta.id}`;
    const protocolo = sol.protocolo || sol.id?.slice(0, 8) || "N/D";

    const mensagem =
      `🚛 *Nova Oferta de Guincho!*\n\n` +
      `📋 Protocolo: *${protocolo}*\n` +
      `👤 Cliente: ${sol.cliente_nome || "N/I"}\n` +
      `🚗 Veículo: ${sol.tipo_veiculo || "N/I"} • ${sol.placa || "N/I"}\n` +
      `🔧 Motivo: ${sol.motivo || "Não informado"}\n` +
      `📍 Origem: ${sol.origem_endereco || "N/I"}\n` +
      `🏁 Destino: ${sol.destino_endereco || "N/I"}\n` +
      `💰 Valor: R$ ${Number(sol.valor || sol.valor_estimado || 0).toFixed(2)}\n\n` +
      `🔗 *Aceitar oferta:* ${link}\n` +
      `⏱ Expira em 2 minutos!`;

    const phone = prestador.telefone?.replace(/\D/g, "");
    if (!phone) {
      console.warn("[DISPATCH] Prestador sem telefone válido");
      return new Response(JSON.stringify({ status: "ok", warning: "prestador sem telefone" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const INSTANCE_ID = Deno.env.get("WAPI_INSTANCE_ID") || "";
    const TOKEN = Deno.env.get("WAPI_TOKEN") || "";

    if (INSTANCE_ID && TOKEN) {
      const res = await fetch(
        `https://api.w-api.app/v1/message/send-text?instanceId=${INSTANCE_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone, message: mensagem }),
        }
      );
      const resText = await res.text();
      console.log(`[DISPATCH] W-API envio para ${phone}: ${res.status}`, resText.slice(0, 200));
    } else {
      // Fallback: whatsapp-send
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: phone, text: { body: mensagem } }),
      });
      console.log("[DISPATCH] Enviado via fallback whatsapp-send");
    }

    console.log(`[DISPATCH] Oferta ${oferta.id} criada e enviada ao prestador ${prestador.nome}`);

    return new Response(
      JSON.stringify({
        status: "ok",
        oferta_id: oferta.id,
        prestador: prestador.nome,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[DISPATCH] Erro geral:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
