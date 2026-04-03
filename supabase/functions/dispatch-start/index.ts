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
    const solicitacaoId = payload.solicitacao_id || payload.record?.id || payload.id;
    const conversationId = payload.conversation_id || null;
    const contactPhone = payload.contact_phone || null;

    if (!solicitacaoId) {
      return new Response(JSON.stringify({ error: "solicitacao_id obrigatório" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[DISPATCH] Iniciando para solicitação ${solicitacaoId}, conv=${conversationId}`);

    // 1. Busca dados da solicitação
    const { data: sol, error: solErr } = await supabase
      .from("solicitacoes")
      .select("*")
      .eq("id", solicitacaoId)
      .maybeSingle();

    if (solErr || !sol) {
      console.error("[DISPATCH] Solicitação não encontrada:", solErr);
      await notifyClient(supabase, contactPhone, conversationId, "⚠️ Erro ao localizar sua solicitação. Nossa equipe foi notificada.");
      return new Response(JSON.stringify({ error: "Solicitação não encontrada" }), {
        status: 404, headers: corsHeaders,
      });
    }

    // 2. Busca TODOS os prestadores ativos para ranquear por proximidade
    const { data: prestadores, error: prestErr } = await supabase
      .from("prestadores")
      .select("id, nome, telefone, status, latitude, longitude")
      .or("status.eq.Ativo,status.eq.ativo,status.ilike.ativo");

    if (prestErr || !prestadores?.length) {
      console.warn("[DISPATCH] Nenhum prestador ativo encontrado");
      await notifyClient(supabase, contactPhone, conversationId,
        "⚠️ No momento não encontramos prestadores disponíveis. Nossa equipe vai entrar em contato em breve.");
      return new Response(JSON.stringify({ error: "Nenhum prestador ativo" }), {
        status: 404, headers: corsHeaders,
      });
    }

    // 3. Ranquear por proximidade se coordenadas da origem estiverem disponíveis
    let ranked = prestadores.filter((p: any) => p.telefone);

    // Tenta extrair coordenadas da origem da solicitação
    let origemLat: number | null = null;
    let origemLng: number | null = null;

    // Busca coordenadas da conversa (data.coordenadas)
    if (conversationId) {
      const { data: conv } = await supabase
        .from("conversations")
        .select("data")
        .eq("id", conversationId)
        .maybeSingle();
      if (conv?.data?.coordenadas) {
        origemLat = conv.data.coordenadas.lat;
        origemLng = conv.data.coordenadas.lng;
      }
    }

    if (origemLat && origemLng) {
      // Ordena por distância (prestadores com coordenadas primeiro)
      ranked = ranked.map((p: any) => {
        if (p.latitude && p.longitude) {
          const dist = haversineKm(origemLat!, origemLng!, p.latitude, p.longitude);
          return { ...p, _dist: dist };
        }
        return { ...p, _dist: 9999 };
      }).sort((a: any, b: any) => a._dist - b._dist);

      console.log(`[DISPATCH] Ranqueamento por proximidade:`, ranked.slice(0, 5).map((p: any) => `${p.nome}: ${p._dist?.toFixed(1)}km`));
    }

    // Pega os top 2 mais próximos
    const topPrestadores = ranked.slice(0, 2);

    console.log(`[DISPATCH] Enviando oferta para ${topPrestadores.length} prestador(es)`);

    const ofertasCriadas: string[] = [];

    for (const prestador of topPrestadores) {
      // 4. Cria oferta no dispatch_offers
      const { data: oferta, error: ofertaErr } = await supabase
        .from("dispatch_offers")
        .insert({
          solicitacao_id: sol.id,
          prestador_id: prestador.id,
          status: "pending",
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 minutos
        })
        .select("id")
        .single();

      if (ofertaErr || !oferta) {
        console.error(`[DISPATCH] Erro ao criar oferta para ${prestador.nome}:`, ofertaErr);
        continue;
      }

      // 5. Envia mensagem WhatsApp ao prestador
      const link = `https://opgrid.lovable.app/prestador/oferta/${oferta.id}`;
      const protocolo = sol.protocolo || sol.id?.slice(0, 8) || "N/D";
      const distInfo = (prestador as any)._dist < 9999
        ? `📏 Distância até cliente: ~${Math.round((prestador as any)._dist)} km\n`
        : "";

      const mensagem =
        `🚛 *Nova Oferta de Guincho!*\n\n` +
        `📋 Protocolo: *${protocolo}*\n` +
        `👤 Cliente: ${sol.cliente_nome || "N/I"}\n` +
        `🚗 Veículo: ${sol.tipo_veiculo || "N/I"} • ${sol.placa || "N/I"}\n` +
        `🔧 Motivo: ${sol.motivo || "Não informado"}\n` +
        `📍 Origem: ${sol.origem_endereco || "N/I"}\n` +
        `🏁 Destino: ${sol.destino_endereco || "N/I"}\n` +
        distInfo +
        `💰 Valor: R$ ${Number(sol.valor || sol.valor_estimado || 0).toFixed(2)}\n\n` +
        `🔗 *Aceitar oferta:* ${link}\n` +
        `⏱ Expira em 3 minutos!`;

      const phone = prestador.telefone?.replace(/\D/g, "");
      if (!phone) continue;

      await sendWhatsApp(phone, mensagem);
      ofertasCriadas.push(oferta.id);
      console.log(`[DISPATCH] Oferta ${oferta.id} enviada para ${prestador.nome} (${phone})`);
    }

    // 6. Notifica o cliente que prestadores foram acionados
    if (ofertasCriadas.length > 0 && contactPhone) {
      await notifyClient(supabase, contactPhone, conversationId,
        `🔔 *${ofertasCriadas.length} prestador(es) acionado(s)!*\n\nAguarde a confirmação. Você será notificado assim que um aceitar o serviço.`);

      // Atualiza dados da conversa com info do despacho
      if (conversationId) {
        await supabase.from("conversations").update({
          data: {
            _dispatch_sent: true,
            _dispatch_count: ofertasCriadas.length,
            _dispatch_at: new Date().toISOString(),
            _notified_solicitado: true, // evitar loop de notificação
          },
          updated_at: new Date().toISOString(),
        }).eq("id", conversationId);
      }
    } else if (contactPhone) {
      await notifyClient(supabase, contactPhone, conversationId,
        "⚠️ Não conseguimos acionar prestadores no momento. Nossa equipe vai buscar manualmente.");
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        ofertas: ofertasCriadas.length,
        prestadores: topPrestadores.map((p: any) => p.nome),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("[DISPATCH] Erro geral:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    });
  }
});

// ── Helpers ──

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function sendWhatsApp(phone: string, message: string) {
  const INSTANCE_ID = Deno.env.get("WAPI_INSTANCE_ID") || "";
  const TOKEN = Deno.env.get("WAPI_TOKEN") || "";

  if (INSTANCE_ID && TOKEN) {
    try {
      const res = await fetch(
        `https://api.w-api.app/v1/message/send-text?instanceId=${INSTANCE_ID}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ phone, message }),
        }
      );
      console.log(`[DISPATCH-WA] Enviado para ${phone}: ${res.status}`);
    } catch (err) {
      console.error(`[DISPATCH-WA] Erro ao enviar para ${phone}:`, err);
    }
  } else {
    // Fallback: whatsapp-send
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, text: { body: message } }),
    });
  }
}

async function notifyClient(supabase: any, phone: string | null, conversationId: string | null, message: string) {
  if (!phone) return;

  await sendWhatsApp(phone, message);

  // Store outbound message
  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      message_type: "text",
      content: message,
      status: "sent",
    });
  }
}
