import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

const OFFER_TTL_MINUTES = 3;
const PROCESS_QUEUE_TRIGGER_TIMEOUT_MS = 3500;
const WHATSAPP_REQUEST_TIMEOUT_MS = 8000;

type Coordinates = { lat: number; lng: number };
type RankedPrestador = {
  id: string;
  name: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  etaMin: number | null;
  raw: Record<string, unknown>;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = await req.json();
    const solicitacaoId = payload.solicitacao_id || payload.record?.id || payload.id;
    const conversationId = payload.conversation_id || null;

    if (!solicitacaoId) {
      return jsonResponse({ error: "solicitacao_id obrigatório" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[DISPATCH] Iniciando para solicitação ${solicitacaoId}, conv=${conversationId || "n/a"}`);

    const { data: sol, error: solErr } = await supabase
      .from("solicitacoes")
      .select("*")
      .eq("id", solicitacaoId)
      .maybeSingle();

    const contactPhone = normalizePhone(
      payload.contact_phone || sol?.cliente_whatsapp || sol?.cliente_telefone || null
    );

    if (solErr || !sol) {
      console.error("[DISPATCH] Solicitação não encontrada:", solErr);
      await notifyClient(
        supabase,
        contactPhone,
        conversationId,
        "⚠️ Erro ao localizar sua solicitação. Nossa equipe foi notificada."
      );
      return jsonResponse({ error: "Solicitação não encontrada" }, 404);
    }

    const { data: pendingOffers, error: pendingErr } = await supabase
      .from("dispatch_offers")
      .select("id, round, prestador_id")
      .eq("solicitacao_id", sol.id)
      .eq("status", "pending");

    if (pendingErr) {
      console.warn("[DISPATCH] Falha ao checar ofertas pendentes:", pendingErr);
    }

    if (pendingOffers?.length) {
      const currentRound = Math.max(...pendingOffers.map((offer: any) => Number(offer.round) || 1));
      console.log(`[DISPATCH] ${pendingOffers.length} oferta(s) pendente(s) já existem para ${sol.id}`);
      await syncConversationDispatchData(supabase, conversationId, {
        _dispatch_sent: true,
        _dispatch_count: pendingOffers.length,
        _dispatch_round: currentRound,
        _dispatch_pending_offer_ids: pendingOffers.map((offer: any) => offer.id),
      });
      return jsonResponse({
        status: "already_pending",
        ofertas: pendingOffers.length,
        round: currentRound,
      });
    }

    const { data: prestadoresRaw, error: prestErr } = await supabase
      .from("prestadores")
      .select("*");

    if (prestErr) {
      console.error("[DISPATCH] Erro ao buscar prestadores:", prestErr);
      await notifyClient(
        supabase,
        contactPhone,
        conversationId,
        "⚠️ Não conseguimos consultar a base de prestadores agora. Nossa equipe vai continuar o atendimento manualmente."
      );
      return jsonResponse({ error: "Erro ao consultar prestadores" }, 500);
    }

    const origem = await loadOriginCoordinates(supabase, conversationId, sol);
    const prestadores = rankPrestadores(prestadoresRaw || [], origem).filter((prestador) => !!prestador.phone);

    if (!prestadores.length) {
      console.warn("[DISPATCH] Nenhum prestador elegível encontrado");
      await syncConversationDispatchData(supabase, conversationId, {
        _dispatch_sent: false,
        _dispatch_count: 0,
        _dispatch_failed_at: new Date().toISOString(),
      });
      await notifyClient(
        supabase,
        contactPhone,
        conversationId,
        "⚠️ No momento não encontramos prestadores disponíveis. Nossa equipe vai buscar manualmente."
      );
      return jsonResponse({ status: "no_active_providers", ofertas: 0 });
    }

    const { data: previousOffers } = await supabase
      .from("dispatch_offers")
      .select("round")
      .eq("solicitacao_id", sol.id)
      .order("round", { ascending: false })
      .limit(1);

    const round = (Number(previousOffers?.[0]?.round) || 0) + 1;
    const atendimentoId = payload.atendimento_id || sol.atendimento_id || null;
    const now = new Date();
    const sentAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + OFFER_TTL_MINUTES * 60 * 1000).toISOString();
    const topPrestadores = prestadores.slice(0, 2);

    const ofertasCriadas: Array<{ id: string; name: string; phone: string }> = [];
    const queueItems: Array<Record<string, unknown>> = [];

    for (const prestador of topPrestadores) {
      const { data: oferta, error: ofertaErr } = await insertWithSchemaFallback(
        supabase,
        "dispatch_offers",
        {
          solicitacao_id: sol.id,
          atendimento_id: atendimentoId,
          prestador_id: prestador.id,
          round,
          status: "pending",
          estimated_distance_km: prestador.distanceKm,
          estimated_time_min: prestador.etaMin,
          service_value: getSolicitacaoValor(sol),
          sent_at: sentAt,
          expires_at: expiresAt,
        },
        "id"
      );

      if (ofertaErr || !oferta?.id) {
        console.error(`[DISPATCH] Erro ao criar oferta para ${prestador.name}:`, ofertaErr);
        continue;
      }

      const linkOferta = `https://opgrid.lovable.app/prestador/oferta/${oferta.id}`;
      const mensagemPrestador = buildProviderMessage(sol, prestador, linkOferta);

      queueItems.push({
        conversation_id: null,
        automation_id: null,
        recipient_phone: prestador.phone,
        channel: "whatsapp",
        template_key: null,
        payload_json: {
          message: mensagemPrestador,
          origem: getOrigemLabel(sol),
          destino: getDestinoLabel(sol),
          veiculo: getVehicleLabel(sol),
          valor: getSolicitacaoValor(sol).toFixed(2),
          distancia: prestador.distanceKm?.toFixed(1) || "N/I",
          link_oferta: linkOferta,
          protocolo: getProtocolo(sol),
          prestador_nome: prestador.name,
          solicitacao_id: sol.id,
          offer_id: oferta.id,
        },
        status: "pending",
        scheduled_at: sentAt,
      });

      ofertasCriadas.push({ id: oferta.id, name: prestador.name, phone: prestador.phone });
      console.log(`[DISPATCH] Oferta ${oferta.id} criada para ${prestador.name}`);
    }

    if (!ofertasCriadas.length) {
      await syncConversationDispatchData(supabase, conversationId, {
        _dispatch_sent: false,
        _dispatch_count: 0,
        _dispatch_failed_at: sentAt,
      });
      await notifyClient(
        supabase,
        contactPhone,
        conversationId,
        "⚠️ Não conseguimos acionar prestadores no momento. Nossa equipe vai buscar manualmente."
      );
      return jsonResponse({ status: "no_offers_created", ofertas: 0, round });
    }

    const { error: queueErr } = await supabase.from("message_queue").insert(queueItems);
    if (queueErr) {
      console.error("[DISPATCH] Erro ao enfileirar mensagens aos prestadores:", queueErr);
    }

    await supabase
      .from("solicitacoes")
      .update({
        status: "Despachada",
        ...(atendimentoId ? { atendimento_id: atendimentoId } : {}),
      })
      .eq("id", sol.id);

    await syncConversationDispatchData(supabase, conversationId, {
      _dispatch_sent: true,
      _dispatch_count: ofertasCriadas.length,
      _dispatch_round: round,
      _dispatch_at: sentAt,
      _dispatch_offer_ids: ofertasCriadas.map((oferta) => oferta.id),
      _dispatch_provider_names: ofertasCriadas.map((oferta) => oferta.name),
      _notified_solicitado: true,
    });

    await notifyClient(
      supabase,
      contactPhone,
      conversationId,
      `🔔 *${ofertasCriadas.length} prestador(es) acionado(s)!*\n\nAguarde a confirmação. Você será notificado assim que um aceitar o serviço.`
    );

    await triggerProcessQueue();

    return jsonResponse({
      status: queueErr ? "offers_created_queue_failed" : "queued",
      ofertas: ofertasCriadas.length,
      round,
      prestadores: ofertasCriadas.map((oferta) => oferta.name),
    });
  } catch (err) {
    console.error("[DISPATCH] Erro geral:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

function getProtocolo(sol: any): string {
  return pickFirstString([sol?.protocolo, typeof sol?.id === "string" ? sol.id.slice(0, 8) : ""], "N/D");
}

function getVehicleLabel(sol: any): string {
  const tipo = pickFirstString([sol?.tipo_veiculo, sol?.veiculo_modelo, sol?.veiculo], "Veículo");
  const placa = pickFirstString([sol?.placa], "");
  return [tipo, placa].filter(Boolean).join(" • ");
}

function getOrigemLabel(sol: any): string {
  return pickFirstString([sol?.origem_endereco, sol?.origem], "N/I");
}

function getDestinoLabel(sol: any): string {
  return pickFirstString([sol?.destino_endereco, sol?.destino], "N/I");
}

function getSolicitacaoValor(sol: any): number {
  const value = Number(sol?.valor ?? sol?.valor_estimado ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function pickFirstString(values: unknown[], fallback = ""): string {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return fallback;
}

function pickNumber(values: unknown[]): number | null {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function isPrestadorAtivo(status: unknown): boolean {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "ativo" || normalized === "disponivel" || normalized === "disponível" || normalized === "online";
}

function rankPrestadores(prestadoresRaw: any[], origem: Coordinates | null): RankedPrestador[] {
  return prestadoresRaw
    .map((raw) => {
      if (!raw?.id || !isPrestadorAtivo(raw?.status)) return null;

      const phone = normalizePhone(raw?.telefone || raw?.whatsapp || raw?.celular || raw?.phone || "");
      const latitude = pickNumber([raw?.latitude, raw?.lat]);
      const longitude = pickNumber([raw?.longitude, raw?.lng, raw?.lon]);
      const distanceKm = origem && latitude !== null && longitude !== null
        ? round2(haversineKm(origem.lat, origem.lng, latitude, longitude))
        : null;
      const etaMin = distanceKm !== null ? Math.max(5, Math.round(distanceKm * 1.5)) : null;

      return {
        id: String(raw.id),
        name: pickFirstString([raw?.nome_fantasia, raw?.nomeFantasia, raw?.nome, raw?.razao_social, raw?.razaoSocial], "Prestador"),
        phone,
        latitude,
        longitude,
        distanceKm,
        etaMin,
        raw,
      } as RankedPrestador;
    })
    .filter(Boolean)
    .sort((a: RankedPrestador | null, b: RankedPrestador | null) => {
      const distA = a?.distanceKm ?? Number.POSITIVE_INFINITY;
      const distB = b?.distanceKm ?? Number.POSITIVE_INFINITY;
      return distA - distB;
    }) as RankedPrestador[];
}

async function loadOriginCoordinates(supabase: any, conversationId: string | null, sol: any): Promise<Coordinates | null> {
  if (conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("data")
      .eq("id", conversationId)
      .maybeSingle();

    const convCoords = conv?.data?.coordenadas;
    const lat = pickNumber([convCoords?.lat, convCoords?.latitude]);
    const lng = pickNumber([convCoords?.lng, convCoords?.longitude, convCoords?.lon]);
    if (lat !== null && lng !== null) return { lat, lng };
  }

  const lat = pickNumber([
    sol?.origem_lat,
    sol?.origem_latitude,
    sol?.latitude,
    sol?.lat,
    sol?.origem_coord?.lat,
    sol?.origem_coord?.latitude,
  ]);
  const lng = pickNumber([
    sol?.origem_lng,
    sol?.origem_longitude,
    sol?.longitude,
    sol?.lng,
    sol?.origem_coord?.lng,
    sol?.origem_coord?.longitude,
    sol?.origem_coord?.lon,
  ]);

  return lat !== null && lng !== null ? { lat, lng } : null;
}

function buildProviderMessage(sol: any, prestador: RankedPrestador, linkOferta: string): string {
  const distInfo = prestador.distanceKm !== null
    ? `📏 Distância até cliente: ~${prestador.distanceKm.toFixed(1)} km\n`
    : "";

  return (
    `🚛 *Nova Oferta de Guincho!*\n\n` +
    `📋 Protocolo: *${getProtocolo(sol)}*\n` +
    `👤 Cliente: ${pickFirstString([sol?.cliente_nome], "N/I")}\n` +
    `🚗 Veículo: ${getVehicleLabel(sol)}\n` +
    `🔧 Motivo: ${pickFirstString([sol?.motivo], "Não informado")}\n` +
    `📍 Origem: ${getOrigemLabel(sol)}\n` +
    `🏁 Destino: ${getDestinoLabel(sol)}\n` +
    distInfo +
    `💰 Valor: R$ ${getSolicitacaoValor(sol).toFixed(2)}\n\n` +
    `🔗 *Aceitar oferta:* ${linkOferta}\n` +
    `⏱ Expira em ${OFFER_TTL_MINUTES} minutos!`
  );
}

async function syncConversationDispatchData(
  supabase: any,
  conversationId: string | null,
  patch: Record<string, unknown>
) {
  if (!conversationId) return;

  const { data: conv } = await supabase
    .from("conversations")
    .select("data")
    .eq("id", conversationId)
    .maybeSingle();

  await supabase
    .from("conversations")
    .update({
      data: {
        ...(conv?.data || {}),
        ...patch,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

async function triggerProcessQueue() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) return;

  try {
    const res = await fetchWithTimeout(
      `${supabaseUrl}/functions/v1/process-queue`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "dispatch-start" }),
      },
      PROCESS_QUEUE_TRIGGER_TIMEOUT_MS
    );

    await res.text();
    console.log(`[DISPATCH] process-queue disparado (${res.status})`);
  } catch (err) {
    console.warn("[DISPATCH] Falha não bloqueante ao disparar process-queue:", err);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function sendWhatsApp(phone: string, message: string) {
  const INSTANCE_ID = Deno.env.get("WAPI_INSTANCE_ID") || "";
  const TOKEN = Deno.env.get("WAPI_TOKEN") || "";

  if (INSTANCE_ID && TOKEN) {
    try {
      const res = await fetchWithTimeout(
        `https://api.w-api.app/v1/message/send-text?instanceId=${INSTANCE_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone, message }),
        },
        WHATSAPP_REQUEST_TIMEOUT_MS
      );
      await res.text();
      console.log(`[DISPATCH-WA] Enviado para ${phone}: ${res.status}`);
      return;
    } catch (err) {
      console.error(`[DISPATCH-WA] Erro ao enviar para ${phone}:`, err);
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const res = await fetchWithTimeout(
      `${supabaseUrl}/functions/v1/whatsapp-send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: phone, text: { body: message } }),
      },
      WHATSAPP_REQUEST_TIMEOUT_MS
    );
    await res.text();
  } catch (err) {
    console.error(`[DISPATCH-WA] Fallback whatsapp-send falhou para ${phone}:`, err);
  }
}

async function notifyClient(supabase: any, phone: string | null, conversationId: string | null, message: string) {
  if (!phone) return;

  await sendWhatsApp(phone, message);

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

async function insertWithSchemaFallback(
  supabase: any,
  table: string,
  fields: Record<string, unknown>,
  selectClause = "*"
) {
  let payload = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  let lastError: any = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await supabase.from(table).insert(payload).select(selectClause).maybeSingle();
    if (!error) return { data, error: null };
    lastError = error;
    const col = extractUnknownColumn(error, table);
    if (!col || !(col in payload)) break;
    const { [col]: _removed, ...nextPayload } = payload;
    console.warn(`[DB] Removendo ${table}.${col} e tentando novamente (${attempt + 1})`);
    if (!Object.keys(nextPayload).length) break;
    payload = nextPayload;
  }

  return { data: null, error: lastError };
}

function extractUnknownColumn(error: any, table: string) {
  const message = String(error?.message || "");
  const match1 = message.match(new RegExp(`Could not find the '([^']+)' column of '${table}'`, "i"));
  if (match1?.[1]) return match1[1];
  const match2 = message.match(new RegExp(`column[\\s\"']+([^\"'\\s]+)[\\s\"']+of relation[\\s\"']+${table}[\\s\"']+does not exist`, "i"));
  return match2?.[1] || null;
}
