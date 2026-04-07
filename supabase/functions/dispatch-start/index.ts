import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

const OFFER_TTL_MINUTES = 3;
const MAX_PROVIDERS_PER_ROUND = 2;
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
    const solicitacaoId =
      payload.solicitacao_id || payload.record?.id || payload.id;
    const conversationId = payload.conversation_id || null;

    if (!solicitacaoId) {
      return jsonResponse({ error: "solicitacao_id obrigatório" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(
      `[DISPATCH] Iniciando para solicitação ${solicitacaoId}, conv=${conversationId || "n/a"}`
    );

    // ── Load solicitação ──
    const { data: sol, error: solErr } = await supabase
      .from("solicitacoes")
      .select("*")
      .eq("id", solicitacaoId)
      .maybeSingle();

    const contactPhone = normalizePhone(
      payload.contact_phone ||
        sol?.cliente_whatsapp ||
        sol?.cliente_telefone ||
        null
    );

    if (solErr || !sol) {
      console.error("[DISPATCH] Solicitação não encontrada:", solErr);
      await notifyClient(supabase, contactPhone, conversationId,
        "⚠️ Erro ao localizar sua solicitação. Nossa equipe foi notificada.");
      return jsonResponse({ error: "Solicitação não encontrada" }, 404);
    }

    // ── 1) Expire overdue pending offers ──
    const expiredCount = await expireOverdueOffers(supabase, sol.id);

    // ── 2) Load ALL existing offers (any status) ──
    const { data: allOffers } = await supabase
      .from("dispatch_offers")
      .select("id, round, prestador_id, status")
      .eq("solicitacao_id", sol.id);

    const offers = allOffers || [];

    // Already accepted? Nothing to do.
    const accepted = offers.find((o: any) => o.status === "accepted");
    if (accepted) {
      console.log(`[DISPATCH] Já aceita: ${accepted.id}`);
      await syncConvData(supabase, conversationId, {
        _dispatch_sent: true,
        _dispatch_accepted_offer_id: accepted.id,
      });
      return jsonResponse({ status: "already_accepted", offer_id: accepted.id });
    }

    // Still pending (not expired)?
    const pending = offers.filter((o: any) => o.status === "pending");
    if (pending.length) {
      const currentRound = Math.max(
        ...pending.map((o: any) => Number(o.round) || 1)
      );
      console.log(
        `[DISPATCH] ${pending.length} oferta(s) pendente(s) para ${sol.id}`
      );
      await syncConvData(supabase, conversationId, {
        _dispatch_sent: true,
        _dispatch_count: pending.length,
        _dispatch_round: currentRound,
      });
      return jsonResponse({
        status: "already_pending",
        ofertas: pending.length,
        round: currentRound,
      });
    }

    // ── 3) Build provider ranking ──
    const { data: prestadoresRaw, error: prestErr } = await supabase
      .from("prestadores")
      .select("*");

    if (prestErr) {
      console.error("[DISPATCH] Erro ao buscar prestadores:", prestErr);
      await notifyClient(supabase, contactPhone, conversationId,
        "⚠️ Não conseguimos consultar a base de prestadores. Nossa equipe vai continuar manualmente.");
      return jsonResponse({ error: "Erro ao consultar prestadores" }, 500);
    }

    const origem = await loadOriginCoordinates(supabase, conversationId, sol);
    const ranked = rankPrestadores(prestadoresRaw || [], origem).filter(
      (p) => !!p.phone
    );

    if (!ranked.length) {
      console.warn("[DISPATCH] Nenhum prestador elegível");
      await syncConvData(supabase, conversationId, {
        _dispatch_sent: false,
        _dispatch_manual_required: true,
      });
      await notifyClient(supabase, contactPhone, conversationId,
        "⚠️ No momento não encontramos prestadores disponíveis. Nossa equipe vai buscar manualmente.");
      return jsonResponse({ status: "no_active_providers", ofertas: 0 });
    }

    // ── 4) Exclude already-offered providers ──
    const alreadyOffered = new Set(
      offers.map((o: any) => String(o.prestador_id)).filter(Boolean)
    );
    const candidates = ranked.filter((p) => !alreadyOffered.has(p.id));

    const round =
      Math.max(0, ...offers.map((o: any) => Number(o.round) || 0)) + 1;

    if (!candidates.length) {
      console.warn(
        `[DISPATCH] Todos os prestadores já foram acionados para ${sol.id}`
      );
      await syncConvData(supabase, conversationId, {
        _dispatch_sent: false,
        _dispatch_manual_required: true,
        _dispatch_round: round,
      });
      await notifyClient(supabase, contactPhone, conversationId,
        "⚠️ Já acionamos todos os prestadores automáticos disponíveis. Nossa central vai seguir com o despacho manual.");
      return jsonResponse({ status: "manual_required", ofertas: 0, round });
    }

    // ── 5) Create offers for top N ──
    const atendimentoId =
      payload.atendimento_id || sol.atendimento_id || null;
    const now = new Date();
    const sentAt = now.toISOString();
    const expiresAt = new Date(
      now.getTime() + OFFER_TTL_MINUTES * 60 * 1000
    ).toISOString();
    const topN = candidates.slice(0, MAX_PROVIDERS_PER_ROUND);

    const created: Array<{ id: string; name: string; phone: string }> = [];
    const queueItems: Array<Record<string, unknown>> = [];

    for (const prest of topN) {
      const { data: oferta, error: ofertaErr } =
        await insertWithSchemaFallback(supabase, "dispatch_offers", {
          solicitacao_id: sol.id,
          atendimento_id: atendimentoId,
          prestador_id: prest.id,
          round,
          status: "pending",
          estimated_distance_km: prest.distanceKm,
          estimated_time_min: prest.etaMin,
          service_value: getSolicitacaoValor(sol),
          sent_at: sentAt,
          expires_at: expiresAt,
        }, "id");

      if (ofertaErr || !oferta?.id) {
        console.error(
          `[DISPATCH] Erro ao criar oferta para ${prest.name}:`,
          ofertaErr
        );
        continue;
      }

      const linkOferta = `https://opgrid.lovable.app/prestador/oferta/${oferta.id}`;
      // Store link in DB too
      await supabase
        .from("dispatch_offers")
        .update({ offer_link: linkOferta })
        .eq("id", oferta.id);

      const msg = buildProviderMessage(sol, prest, linkOferta);

      queueItems.push({
        conversation_id: null,
        automation_id: null,
        recipient_phone: prest.phone,
        channel: "whatsapp",
        template_key: null,
        payload_json: {
          message: msg,
          origem: getOrigemLabel(sol),
          destino: getDestinoLabel(sol),
          veiculo: getVehicleLabel(sol),
          valor: getSolicitacaoValor(sol).toFixed(2),
          distancia: prest.distanceKm?.toFixed(1) || "N/I",
          link_oferta: linkOferta,
          protocolo: getProtocolo(sol),
          prestador_nome: prest.name,
          solicitacao_id: sol.id,
          offer_id: oferta.id,
        },
        status: "pending",
        scheduled_at: sentAt,
      });

      created.push({ id: oferta.id, name: prest.name, phone: prest.phone });
      console.log(`[DISPATCH] Oferta ${oferta.id} criada para ${prest.name}`);
    }

    if (!created.length) {
      await syncConvData(supabase, conversationId, {
        _dispatch_sent: false,
        _dispatch_manual_required: true,
      });
      await notifyClient(supabase, contactPhone, conversationId,
        "⚠️ Não conseguimos acionar prestadores no momento. Nossa equipe vai buscar manualmente.");
      return jsonResponse({ status: "no_offers_created", ofertas: 0, round });
    }

    // ── 6) Enqueue messages — fallback to direct send ──
    const { data: queuedRows, error: queueErr } = await supabase
      .from("message_queue")
      .insert(queueItems)
      .select("id, recipient_phone, payload_json, status");

    let directFallbackUsed = false;
    if (queueErr) {
      console.error("[DISPATCH] Fila falhou, enviando direto:", queueErr);
      await sendQueuedDirectly(queueItems);
      directFallbackUsed = true;
    }

    // ── 7) Update solicitação ──
    await supabase
      .from("solicitacoes")
      .update({
        status: "Despachada",
        ...(atendimentoId ? { atendimento_id: atendimentoId } : {}),
      })
      .eq("id", sol.id);

    // ── 8) Sync conversation data ──
    await syncConvData(supabase, conversationId, {
      _dispatch_sent: true,
      _dispatch_count: created.length,
      _dispatch_round: round,
      _dispatch_at: sentAt,
      _dispatch_offer_ids: created.map((o) => o.id),
      _dispatch_provider_names: created.map((o) => o.name),
      _dispatch_manual_required: false,
      _notified_solicitado: true,
      _last_expired_count: expiredCount,
    });

    // ── 9) Notify client ──
    await notifyClient(supabase, contactPhone, conversationId,
      `🔔 *${created.length} prestador(es) acionado(s)!*\n\nAguarde a confirmação. Você será notificado assim que um aceitar o serviço.`);

    // ── 10) Trigger queue processing ──
    const queueTriggered = queueErr ? false : await triggerProcessQueue();

    if (!queueErr && !queueTriggered && queuedRows?.length) {
      const queuedIds = queuedRows
        .map((row: any) => row.id)
        .filter(Boolean);

      if (queuedIds.length) {
        const { data: unsentRows } = await supabase
          .from("message_queue")
          .select("id, recipient_phone, payload_json")
          .in("id", queuedIds)
          .in("status", ["pending", "scheduled", "sending"]);

        if (unsentRows?.length) {
          console.warn(
            "[DISPATCH] process-queue indisponível, usando fallback direto para ofertas pendentes"
          );
          await sendQueuedDirectly(
            unsentRows as Array<Record<string, unknown>>
          );
          await supabase
            .from("message_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              error_message:
                "fallback_direct_send_after_process_queue_failure",
            })
            .in(
              "id",
              unsentRows.map((row: any) => row.id)
            );
          directFallbackUsed = true;
        }
      }
    }

    return jsonResponse({
      status: queueErr
        ? "offers_created_queue_failed"
        : directFallbackUsed
          ? "offers_created_direct_fallback"
          : "queued",
      ofertas: created.length,
      round,
      prestadores: created.map((o) => o.name),
    });
  } catch (err) {
    console.error("[DISPATCH] Erro geral:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

// ══════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function normalizePhone(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

function getProtocolo(sol: any): string {
  return pickFirstString(
    [sol?.protocolo, typeof sol?.id === "string" ? sol.id.slice(0, 8) : ""],
    "N/D"
  );
}

function getVehicleLabel(sol: any): string {
  const tipo = pickFirstString(
    [sol?.tipo_veiculo, sol?.veiculo_modelo, sol?.veiculo],
    "Veículo"
  );
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
  const v = Number(sol?.valor ?? sol?.valor_estimado ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function pickFirstString(values: unknown[], fallback = ""): string {
  for (const v of values) {
    const t = String(v || "").trim();
    if (t) return t;
  }
  return fallback;
}

function pickNumber(values: unknown[]): number | null {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function isPrestadorAtivo(status: unknown): boolean {
  const s = String(status || "").trim().toLowerCase();
  return ["ativo", "disponivel", "disponível", "online"].includes(s);
}

// ── Ranking ──

function rankPrestadores(
  raw: any[],
  origem: Coordinates | null,
  destino: Coordinates | null = null
): RankedPrestador[] {
  const FATOR_CORRECAO_RODOVIARIO = 1.3;

  return (raw
    .map((r) => {
      if (!r?.id || !isPrestadorAtivo(r?.status)) return null;
      const phone = normalizePhone(
        r?.whatsapp || r?.telefone || r?.celular || r?.phone || ""
      );
      const lat = pickNumber([r?.latitude, r?.lat]);
      const lng = pickNumber([r?.longitude, r?.lng, r?.lon]);

      // Distance from provider to origin (for ranking/ETA)
      const distToOrigin =
        origem && lat !== null && lng !== null
          ? haversineKm(origem.lat, origem.lng, lat, lng)
          : null;

      // Full trip: prestador→origem + origem→destino + destino→retorno(prestador base)
      let fullTripKm: number | null = null;
      if (distToOrigin !== null && lat !== null && lng !== null) {
        const origDestKm = (origem && destino)
          ? haversineKm(origem.lat, origem.lng, destino.lat, destino.lng)
          : 0;
        const retornoKm = destino
          ? haversineKm(destino.lat, destino.lng, lat, lng)
          : distToOrigin; // if no dest, assume return = same as outbound
        fullTripKm = round2((distToOrigin + origDestKm + retornoKm) * FATOR_CORRECAO_RODOVIARIO);
      }

      const eta = distToOrigin !== null ? Math.max(5, Math.round(distToOrigin * 1.5 * FATOR_CORRECAO_RODOVIARIO)) : null;
      return {
        id: String(r.id),
        name: pickFirstString(
          [r?.nome_fantasia, r?.nomeFantasia, r?.nome, r?.razao_social],
          "Prestador"
        ),
        phone,
        latitude: lat,
        longitude: lng,
        distanceKm: fullTripKm,
        etaMin: eta,
        raw: r,
      } as RankedPrestador;
    })
    .filter(Boolean) as RankedPrestador[]
  ).sort((a, b) => {
    const dA = a.distanceKm ?? Infinity;
    const dB = b.distanceKm ?? Infinity;
    return dA - dB;
  });
}

// ── Coordinates ──

async function loadOriginCoordinates(
  supabase: any,
  conversationId: string | null,
  sol: any
): Promise<Coordinates | null> {
  if (conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("data")
      .eq("id", conversationId)
      .maybeSingle();
    const c = conv?.data?.coordenadas;
    const lat = pickNumber([c?.lat, c?.latitude]);
    const lng = pickNumber([c?.lng, c?.longitude, c?.lon]);
    if (lat !== null && lng !== null) return { lat, lng };
  }
  const lat = pickNumber([
    sol?.origem_lat, sol?.origem_latitude, sol?.latitude, sol?.lat,
    sol?.origem_coord?.lat, sol?.origem_coord?.latitude,
  ]);
  const lng = pickNumber([
    sol?.origem_lng, sol?.origem_longitude, sol?.longitude, sol?.lng,
    sol?.origem_coord?.lng, sol?.origem_coord?.longitude, sol?.origem_coord?.lon,
  ]);
  return lat !== null && lng !== null ? { lat, lng } : null;
}

// ── Messages ──

function buildProviderMessage(
  sol: any,
  prest: RankedPrestador,
  link: string
): string {
  const dist =
    prest.distanceKm !== null
      ? `📏 Distância até cliente: ~${prest.distanceKm.toFixed(1)} km\n`
      : "";
  return (
    `🚛 *Nova Oferta de Guincho!*\n\n` +
    `📋 Protocolo: *${getProtocolo(sol)}*\n` +
    `👤 Cliente: ${pickFirstString([sol?.cliente_nome], "N/I")}\n` +
    `🚗 Veículo: ${getVehicleLabel(sol)}\n` +
    `🔧 Motivo: ${pickFirstString([sol?.motivo], "Não informado")}\n` +
    `📍 Origem: ${getOrigemLabel(sol)}\n` +
    `🏁 Destino: ${getDestinoLabel(sol)}\n` +
    dist +
    `💰 Valor: R$ ${getSolicitacaoValor(sol).toFixed(2)}\n\n` +
    `🔗 *Aceitar oferta:* ${link}\n` +
    `⏱ Expira em ${OFFER_TTL_MINUTES} minutos!`
  );
}

// ── Conversation data sync ──

async function syncConvData(
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
      data: { ...(conv?.data || {}), ...patch },
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

// ── Expire overdue offers ──

async function expireOverdueOffers(
  supabase: any,
  solicitacaoId: string
): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("dispatch_offers")
    .update({ status: "expired", responded_at: now })
    .eq("solicitacao_id", solicitacaoId)
    .eq("status", "pending")
    .lt("expires_at", now)
    .select("id");
  if (error) {
    console.warn("[DISPATCH] Falha ao expirar ofertas vencidas:", error);
    return 0;
  }
  if (data?.length) {
    console.log(
      `[DISPATCH] ${data.length} oferta(s) expirada(s) para ${solicitacaoId}`
    );
  }
  return data?.length || 0;
}

// ── Direct send fallback ──

async function sendQueuedDirectly(items: Array<Record<string, unknown>>) {
  for (const item of items) {
    const phone = normalizePhone(item.recipient_phone);
    const pj =
      item.payload_json && typeof item.payload_json === "object"
        ? (item.payload_json as Record<string, unknown>)
        : {};
    const msg = String(pj.message || "").trim();
    if (!phone || !msg) continue;
    await sendWhatsApp(phone, msg);
  }
}

// ── Process queue trigger ──

async function triggerProcessQueue(): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return false;
  try {
    const res = await fetchWithTimeout(
      `${url}/functions/v1/process-queue`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "dispatch-start" }),
      },
      PROCESS_QUEUE_TRIGGER_TIMEOUT_MS
    );
    await res.text();
    if (!res.ok) {
      console.warn(`[DISPATCH] process-queue retornou ${res.status}`);
      return false;
    }
    console.log(`[DISPATCH] process-queue disparado (${res.status})`);
    return true;
  } catch (err) {
    console.warn("[DISPATCH] process-queue falhou (não-bloqueante):", err);
    return false;
  }
}

// ── Math ──

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort("timeout"), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── WhatsApp send helpers ──

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
      console.error(`[DISPATCH-WA] Erro W-API ${phone}:`, err);
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
    console.error(`[DISPATCH-WA] Fallback falhou ${phone}:`, err);
  }
}

async function notifyClient(
  supabase: any,
  phone: string | null,
  conversationId: string | null,
  message: string
) {
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

// ── Schema-resilient insert ──

async function insertWithSchemaFallback(
  supabase: any,
  table: string,
  fields: Record<string, unknown>,
  selectClause = "*"
) {
  let payload = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  let lastError: any = null;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select(selectClause)
      .maybeSingle();
    if (!error) return { data, error: null };
    lastError = error;
    const col = extractUnknownColumn(error, table);
    if (!col || !(col in payload)) break;
    const { [col]: _, ...next } = payload;
    console.warn(`[DB] Removendo ${table}.${col}, retry ${i + 1}`);
    if (!Object.keys(next).length) break;
    payload = next;
  }
  return { data: null, error: lastError };
}

function extractUnknownColumn(error: any, table: string) {
  const msg = String(error?.message || "");
  const m1 = msg.match(
    new RegExp(`Could not find the '([^']+)' column of '${table}'`, "i")
  );
  if (m1?.[1]) return m1[1];
  const m2 = msg.match(
    new RegExp(
      `column[\\s\"']+([^\"'\\s]+)[\\s\"']+of relation[\\s\"']+${table}[\\s\"']+does not exist`,
      "i"
    )
  );
  return m2?.[1] || null;
}
