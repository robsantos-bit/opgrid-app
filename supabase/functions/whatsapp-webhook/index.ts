import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "";
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = getSupabase();

  try {
    const body = await req.json();
    console.log("[WEBHOOK] Payload:", JSON.stringify(body).slice(0, 800));

    const provider = detectProvider(body);
    console.log("[WEBHOOK] Provider:", provider);

    const normalized = provider === "wapi" ? normalizeWapi(body) : normalizeMeta(body);

    if (!normalized.length) {
      console.log("[WEBHOOK] No messages to process");
      return jsonOk({ status: "no_messages", provider });
    }

    for (const nm of normalized) {
      if (nm.isStatus) {
        console.log(`[WEBHOOK] Status update: ${nm.id} → ${nm.statusValue}`);
        await supabase.from("messages").update({ status: nm.statusValue }).eq("wa_message_id", nm.id);
        await supabase.from("message_logs").insert({
          provider_message_id: nm.id, direction: "outbound",
          status: nm.statusValue, response_json: nm.raw,
        });
        continue;
      }

      const contactPhone = nm.from.replace(/\D/g, "");
      console.log(`[WEBHOOK] Inbound from ${contactPhone}: "${nm.content.slice(0, 100)}" (type: ${nm.type})`);

      if (!contactPhone || contactPhone.length < 8) {
        console.warn("[WEBHOOK] Invalid phone, skipping");
        continue;
      }

      // ── DEDUP ──
      if (nm.id && !nm.id.startsWith("wapi_")) {
        const { data: existing } = await supabase
          .from("messages").select("id").eq("wa_message_id", nm.id).maybeSingle();
        if (existing) { console.log(`[WEBHOOK] Duplicate ${nm.id}, skip`); continue; }
      }

      // ── Find or create conversation ──
      let conversa: any = null;
      const { data: allConvs } = await supabase
        .from("conversations").select("*")
        .eq("contact_phone", contactPhone)
        .order("updated_at", { ascending: false }).limit(5);

      if (allConvs?.length) {
        const terminalStates = ["cancelado", "finalizado", "concluido"];
        conversa = allConvs.find((c: any) => !terminalStates.includes(c.state)) || null;
      }

      if (!conversa) {
        const now = new Date();
        const { data: nova, error: insertErr } = await supabase
          .from("conversations").insert({
            contact_phone: contactPhone, wa_contact_id: contactPhone,
            contact_name: nm.contactName, state: "novo_contato", data: {},
            window_opened_at: now.toISOString(),
            window_expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
          }).select().single();

        if (insertErr || !nova) {
          console.error("[WEBHOOK] Insert error:", insertErr);
          return jsonOk({ status: "error", error: insertErr?.message });
        }
        conversa = nova;
      } else {
        const now = new Date();
        await supabase.from("conversations").update({
          window_opened_at: now.toISOString(),
          window_expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", conversa.id);
      }

      // ── Store inbound ──
      await supabase.from("messages").insert({
        conversation_id: conversa.id, direction: "inbound",
        wa_message_id: nm.id, message_type: nm.type,
        content: nm.content, metadata: nm.raw, status: "received",
      });

      // ── Re-read fresh state ──
      const { data: freshConv } = await supabase
        .from("conversations").select("*").eq("id", conversa.id).single();
      if (freshConv) conversa = freshConv;

      // ── Process state machine ──
      await processState(supabase, conversa, nm, provider);

      await supabase.from("message_logs").insert({
        conversation_id: conversa.id, direction: "inbound",
        provider_message_id: nm.id, status: "received", response_json: nm.raw,
      });
    }

    return jsonOk({ status: "ok", provider, processed: normalized.length });
  } catch (err) {
    console.error("[WEBHOOK] Error:", err);
    return jsonOk({ error: String(err) });
  }
});

// ══════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════

interface NormalizedMessage {
  id: string;
  from: string;
  contactName: string;
  type: string;
  content: string;
  raw: any;
  isStatus?: boolean;
  statusValue?: string;
  interactive?: any;
  location?: { latitude: number; longitude: number; address?: string };
}

type Provider = "meta" | "wapi";

// ══════════════════════════════════════════════════════
// Provider detection & normalization
// ══════════════════════════════════════════════════════

function detectProvider(body: any): Provider {
  if (body.event || body.instanceId || body.data?.key || body.sender?.id) return "wapi";
  if (body.object === "whatsapp_business_account" || body.entry) return "meta";
  if (body.data?.message) return "wapi";
  return "meta";
}

function normalizeWapi(body: any): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];
  const event = body.event || "";

  if (body.isGroup) return messages;
  if (body.fromMe === true) return messages;

  if (event === "onMessageStatus" || event === "message_status") {
    const data = body.data || body;
    const key = data.key || data;
    const status = data.status || data.ack;
    const statusMap: Record<number, string> = { 0: "pending", 1: "sent", 2: "delivered", 3: "read" };
    const statusStr = typeof status === "number" ? (statusMap[status] || "unknown") : String(status);
    messages.push({
      id: key.id || data.id || "", from: (key.remoteJid || "").replace(/@s\.whatsapp\.net|@c\.us/g, ""),
      contactName: "", type: "status", content: "", raw: body, isStatus: true, statusValue: statusStr,
    });
    return messages;
  }

  if (event === "onMessage" || event === "messages.upsert" || event === "webhookReceived" || !event) {
    const data = body.data || body;
    const key = data.key || {};
    if (key.fromMe === true || data.fromMe === true) return messages;

    let phone = "";
    if (body.sender?.id) phone = body.sender.id.replace(/@s\.whatsapp\.net|@c\.us/g, "");
    else phone = (key.remoteJid || data.from || "").replace(/@s\.whatsapp\.net|@c\.us/g, "");
    if (!phone) return messages;

    const msgId = key.id || data.id || body.messageId || `wapi_${Date.now()}`;
    const pushName = data.pushName || data.senderName || body.sender?.name || "";
    const msg = body.msgContent || data.message || {};
    let type = "text";
    let content = "";
    let interactive: any = undefined;
    let location: any = undefined;

    if (msg.conversation) content = msg.conversation;
    else if (msg.extendedTextMessage?.text) content = msg.extendedTextMessage.text;
    else if (msg.imageMessage) { type = "image"; content = msg.imageMessage.caption || "[Imagem]"; }
    else if (msg.videoMessage) { type = "video"; content = msg.videoMessage.caption || "[Vídeo]"; }
    else if (msg.audioMessage) { type = "audio"; content = "[Áudio]"; }
    else if (msg.documentMessage) { type = "document"; content = msg.documentMessage.fileName || "[Documento]"; }
    else if (msg.locationMessage) {
      type = "location";
      location = { latitude: msg.locationMessage.degreesLatitude, longitude: msg.locationMessage.degreesLongitude, address: msg.locationMessage.address };
      content = `${location.latitude},${location.longitude}`;
    }
    else if (msg.buttonsResponseMessage) {
      type = "interactive";
      interactive = { button_reply: { id: msg.buttonsResponseMessage.selectedButtonId, title: msg.buttonsResponseMessage.selectedDisplayText } };
      content = msg.buttonsResponseMessage.selectedDisplayText || "";
    }
    else if (msg.listResponseMessage) {
      type = "interactive";
      interactive = { list_reply: { title: msg.listResponseMessage.title } };
      content = msg.listResponseMessage.title || "";
    }
    else if (data.body || data.text) content = data.body || data.text || "";

    if (!content && type === "text") return messages;
    messages.push({ id: msgId, from: phone, contactName: pushName || phone, type, content, raw: body, interactive, location });
  }
  return messages;
}

function normalizeMeta(body: any): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];
  const changes = body.entry?.[0]?.changes?.[0]?.value;
  if (!changes) return messages;

  if (changes.messages?.length) {
    for (const msg of changes.messages) {
      const contact = changes.contacts?.find((c: any) => c.wa_id === msg.from);
      let content = "";
      if (msg.type === "text") content = msg.text?.body || "";
      else if (msg.type === "interactive") content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "";
      else if (msg.type === "button") content = msg.button?.text || "";
      else if (msg.type === "location") content = `${msg.location?.latitude},${msg.location?.longitude}`;
      messages.push({
        id: msg.id, from: msg.from, contactName: contact?.profile?.name || msg.from,
        type: msg.type, content, raw: msg, interactive: msg.interactive, location: msg.location,
      });
    }
  }

  if (changes.statuses?.length) {
    for (const s of changes.statuses) {
      messages.push({
        id: s.id, from: s.recipient_id || "", contactName: "",
        type: "status", content: "", raw: s, isStatus: true, statusValue: s.status,
      });
    }
  }
  return messages;
}

// ══════════════════════════════════════════════════════
// STATE MACHINE — Fluxo completo ponta a ponta
// ══════════════════════════════════════════════════════

async function processState(supabase: any, conversa: any, nm: NormalizedMessage, provider: Provider) {
  const text = nm.content.trim();
  const textLower = text.toLowerCase();
  const phone = nm.from.replace(/\D/g, "");
  const contactName = nm.contactName;
  const conversationId = conversa.id;
  const currentState = conversa.state;
  let data = conversa.data || {};

  console.log(`[STATE] conv=${conversationId} current="${currentState}" input="${text.slice(0, 50)}"`);

  // ── Cancel from any non-terminal state ──
  if (textLower.includes("cancelar") && !["novo_contato", "cancelado", "finalizado", "concluido"].includes(currentState)) {
    await updateConv(supabase, conversationId, "cancelado", data);
    await reply(supabase, phone, conversationId, "❌ Solicitação cancelada. Se precisar, envie uma nova mensagem!", provider);
    return;
  }

  let nextState = currentState;
  let responseText = "";

  switch (currentState) {

    // ─────────── 1. BOAS-VINDAS ───────────
    case "novo_contato": {
      const firstName = contactName && contactName !== phone ? contactName.split(" ")[0] : "";
      responseText =
        `Olá${firstName ? ", " + firstName : ""}! 👋\n\n` +
        `Sou o assistente da *OpGrid Assistência Veicular*.\n\n` +
        `Vou te ajudar a solicitar um guincho/reboque.\n\n` +
        `Para começar, me diga seu *nome completo*:`;
      nextState = "aguardando_nome";
      break;
    }

    // ─────────── 2. NOME ───────────
    case "aguardando_nome": {
      if (text.length < 3) { responseText = "Por favor, informe seu nome completo (mínimo 3 caracteres):"; break; }
      data.nome = text;
      nextState = "aguardando_veiculo";
      responseText = `Obrigado, *${text.split(" ")[0]}*! ✅\n\nAgora informe a *placa do veículo*:\n_(Ex: ABC1D23 ou ABC-1234)_`;
      break;
    }

    // ─────────── 3. PLACA + TIPO VEÍCULO ───────────
    case "aguardando_veiculo": {
      // Se ainda não tem placa, espera placa
      if (!data.placa) {
        const placa = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (placa.length < 7) { responseText = "⚠️ Placa inválida. Informe no formato *ABC1D23* ou *ABC-1234*:"; break; }
        data.placa = placa;
        responseText =
          `🚗 Placa registrada: *${placa}*\n\n` +
          `Qual o *tipo de veículo*?\n\n` +
          `1️⃣ Carro\n2️⃣ Moto\n3️⃣ Caminhão\n4️⃣ Equipamento\n\n` +
          `_Responda com o número:_`;
        break;
      }

      // Já tem placa, espera tipo veículo
      const tipoMap: Record<string, string> = { "1": "Carro", "2": "Moto", "3": "Caminhão", "4": "Equipamento" };
      const tipo = tipoMap[textLower] || text;
      data.modelo = tipo;
      nextState = "aguardando_origem";
      responseText =
        `✅ Veículo: *${tipo}* — Placa: *${data.placa}*\n\n` +
        `Agora envie sua *localização atual* 📍\n\nVocê pode:\n• Compartilhar localização pelo WhatsApp\n• Digitar o endereço completo`;
      break;
    }

    // ─────────── 4. ORIGEM ───────────
    case "aguardando_origem": {
      if (nm.type === "location" && nm.location) {
        data.coordenadas = { lat: nm.location.latitude, lng: nm.location.longitude };
        let endereco = nm.location.address || "";
        if (!endereco || endereco.length < 5) {
          endereco = await reverseGeocode(nm.location.latitude, nm.location.longitude);
        }
        data.origem = endereco || `${nm.location.latitude}, ${nm.location.longitude}`;
      } else {
        if (text.length < 5) { responseText = "📍 Por favor, envie um endereço mais detalhado ou compartilhe sua localização:"; break; }
        data.origem = text;
      }
      nextState = "aguardando_motivo";
      responseText =
        `📍 Localização registrada:\n*${data.origem}*\n\n` +
        `🔧 Qual o *motivo do atendimento*?\n\n` +
        `1️⃣ Pane mecânica\n2️⃣ Pane elétrica\n3️⃣ Pane seca\n4️⃣ Acidente\n5️⃣ Furo de pneu\n\n` +
        `_Responda com o número ou digite o motivo:_`;
      break;
    }

    // ─────────── 5. MOTIVO ───────────
    case "aguardando_motivo": {
      const motivoMap: Record<string, string> = {
        "1": "Pane mecânica", "2": "Pane elétrica", "3": "Pane seca",
        "4": "Acidente", "5": "Furo de pneu",
      };
      const buttonId = nm.interactive?.button_reply?.id;
      const motivoFromBtn: Record<string, string> = {
        pane_mecanica: "Pane mecânica", pane_eletrica: "Pane elétrica",
        pane_seca: "Pane seca", acidente: "Acidente", furo_pneu: "Furo de pneu",
      };
      data.motivo = buttonId ? (motivoFromBtn[buttonId] || text || "Outro") : (motivoMap[textLower] || text || "Outro");
      nextState = "aguardando_destino";
      responseText =
        `✅ Motivo: *${data.motivo}*\n\n` +
        `Agora informe o *endereço de destino*:\n_(Para onde o veículo deve ser levado)_\n\n` +
        `Você também pode compartilhar a localização 📍`;
      break;
    }

    // ─────────── 6. DESTINO ───────────
    case "aguardando_destino": {
      if (nm.type === "location" && nm.location) {
        data.coordenadas_destino = { lat: nm.location.latitude, lng: nm.location.longitude };
        let endDest = nm.location.address || "";
        if (!endDest || endDest.length < 5) {
          endDest = await reverseGeocode(nm.location.latitude, nm.location.longitude);
        }
        data.destino = endDest || `${nm.location.latitude}, ${nm.location.longitude}`;
      } else {
        if (text.length < 5) { responseText = "🏁 Por favor, informe o endereço de destino com mais detalhes:"; break; }
        data.destino = text;
      }
      nextState = "aguardando_observacoes";
      responseText =
        "📝 Deseja adicionar alguma *observação*?\n" +
        "_(Ex: roda travada, veículo trancado, local sem sinal)_\n\n" +
        "1️⃣ Sem observações\n2️⃣ Sim, quero informar\n\n_Responda com o número:_";
      break;
    }

    // ─────────── 7. OBSERVAÇÕES + ORÇAMENTO ───────────
    case "aguardando_observacoes": {
      const buttonId = nm.interactive?.button_reply?.id;
      const isComObs = buttonId === "com_obs" || textLower === "2";
      const isSemObs = buttonId === "sem_obs" || textLower === "1";

      if (isComObs && !data._awaiting_obs_text) {
        data._awaiting_obs_text = true;
        await updateConv(supabase, conversationId, currentState, data);
        await reply(supabase, phone, conversationId, "Digite suas observações:", provider);
        return;
      }

      if (data._awaiting_obs_text) {
        data.observacoes = text;
        delete data._awaiting_obs_text;
      } else {
        data.observacoes = isSemObs ? "" : text;
      }

      // ── Calcula orçamento ──
      let distanciaIdaKm = 15;
      if (data.coordenadas && data.coordenadas_destino) {
        distanciaIdaKm = haversineKm(
          data.coordenadas.lat, data.coordenadas.lng,
          data.coordenadas_destino.lat, data.coordenadas_destino.lng
        );
        distanciaIdaKm = Math.max(Math.round(distanciaIdaKm), 1);
      } else if (data.coordenadas || data.coordenadas_destino) {
        distanciaIdaKm = 20;
      }

      const distanciaKm = distanciaIdaKm * 2; // ida + volta
      const valorBase = 120;
      const valorKm = distanciaKm * 4.5;
      const valorTotal = Math.round((valorBase + valorKm) * 100) / 100;
      data.distanciaKm = distanciaKm;
      data.valorEstimado = valorTotal;

      const resumo =
        `📋 *Resumo do Orçamento*\n\n` +
        `👤 ${data.nome}\n🚗 ${data.modelo || "Veículo"} — Placa: ${data.placa}\n🔧 ${data.motivo}\n` +
        `📍 ${data.origem}\n🏁 ${data.destino}\n` +
        `📏 Distância: ~${distanciaIdaKm} km (ida e volta: ${distanciaKm} km)\n` +
        (data.observacoes ? `📝 Obs: ${data.observacoes}\n` : "") +
        `\n💰 *Valor estimado: R$ ${valorTotal.toFixed(2)}*\n` +
        `  ├ Taxa base: R$ ${valorBase.toFixed(2)}\n` +
        `  └ Km ida+volta (${distanciaKm} × R$ 4,50): R$ ${valorKm.toFixed(2)}`;

      await reply(supabase, phone, conversationId, resumo, provider);
      nextState = "aguardando_aceite";
      responseText = "Deseja *confirmar* este atendimento?\n\n1️⃣ ✅ Aceitar\n2️⃣ ❌ Recusar";
      break;
    }

    // ─────────── 8. ACEITE DO CLIENTE ───────────
    case "aguardando_aceite": {
      const buttonId = nm.interactive?.button_reply?.id;
      const aceite = buttonId === "aceitar" || textLower === "1" || textLower.includes("sim") || textLower.includes("aceito");
      const recusa = buttonId === "recusar" || textLower === "2" || textLower.includes("não") || textLower.includes("cancelar");

      if (aceite) {
        await reply(supabase, phone, conversationId,
          "✅ *Solicitação confirmada!*\n\nEstamos criando sua OS e localizando o prestador mais próximo...", provider);
        const created = await createSolicitacaoAndDispatch(supabase, conversationId, data, phone, provider);
        nextState = created ? "solicitado" : "aguardando_aceite";
      } else if (recusa) {
        nextState = "cancelado";
        responseText = "❌ Orçamento recusado. Se mudar de ideia, é só enviar uma nova mensagem!";
      } else {
        responseText = "Por favor, responda *1* para aceitar ou *2* para recusar o orçamento.";
      }
      break;
    }

    // ─────────── 9. SOLICITADO (aguardando prestador) ───────────
    case "solicitado": {
      // Check if dispatch offers exist and their status
      const solId = conversa.solicitacao_id;
      let hasActiveOffer = false;
      let allExpired = false;

      if (solId) {
        const { data: offers } = await supabase
          .from("dispatch_offers")
          .select("id, status, expires_at")
          .eq("solicitacao_id", solId);

        if (offers?.length) {
          const accepted = offers.find((o: any) => o.status === "accepted");
          if (accepted) {
            // Dispatch already accepted — this shouldn't be "solicitado" but handle gracefully
            hasActiveOffer = true;
          } else {
            const pending = offers.filter((o: any) => o.status === "pending");
            const validPending = pending.filter(
              (o: any) => !o.expires_at || new Date(o.expires_at).getTime() > Date.now()
            );
            hasActiveOffer = validPending.length > 0;
            allExpired = pending.length === 0 && offers.every(
              (o: any) => ["expired", "rejected", "cancelled"].includes(o.status)
            );
          }
        }
      }

      if (allExpired && solId) {
        // All offers expired/rejected — trigger new round
        const lastRedispatch = data._last_redispatch ? new Date(data._last_redispatch).getTime() : 0;
        if (Date.now() - lastRedispatch > 120000) {
          data._last_redispatch = new Date().toISOString();
          responseText = "⏳ Os prestadores anteriores não responderam. Estamos acionando novos prestadores...";

          // Trigger new dispatch round
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            await fetch(`${supabaseUrl}/functions/v1/dispatch-start`, {
              method: "POST",
              headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                solicitacao_id: solId,
                conversation_id: conversationId,
                contact_phone: phone,
              }),
            });
          } catch (err) {
            console.error("[STATE] Re-dispatch failed:", err);
          }
        } else {
          responseText = "⏳ Estamos buscando novos prestadores. Aguarde...";
        }
      } else if (hasActiveOffer) {
        const lastNotif = data._last_solicitado_reply ? new Date(data._last_solicitado_reply).getTime() : 0;
        if (Date.now() - lastNotif > 60000) {
          responseText = "⏳ Aguarde, estamos aguardando a resposta dos prestadores acionados...";
          data._last_solicitado_reply = new Date().toISOString();
        }
      } else {
        const lastNotif = data._last_solicitado_reply ? new Date(data._last_solicitado_reply).getTime() : 0;
        if (Date.now() - lastNotif > 60000) {
          responseText = "⏳ Sua solicitação está sendo processada. Aguarde...";
          data._last_solicitado_reply = new Date().toISOString();
        }
      }
      break;
    }

    // ─────────── 10. PRESTADOR ACEITO ───────────
    case "prestador_aceito": {
      if (!data._notified_prestador_aceito) {
        const pNome = data.prestador_nome || "Prestador";
        responseText = `🚗 O prestador *${pNome}* já aceitou seu serviço e está a caminho!\n\nSe precisar de algo, responda aqui.`;
        data._notified_prestador_aceito = true;
      } else {
        responseText = "🚗 O prestador está a caminho! Você será notificado quando ele chegar.";
      }
      break;
    }

    // ─────────── 11. EM DESLOCAMENTO ───────────
    case "em_deslocamento": {
      if (!data._notified_em_deslocamento) {
        const pNome = data.prestador_nome || "Prestador";
        responseText = `🚛 *${pNome}* está em deslocamento até você! Aguarde...`;
        data._notified_em_deslocamento = true;
      } else {
        responseText = "🚛 O prestador está a caminho! Aguarde a chegada.";
      }
      break;
    }

    // ─────────── 12. NO LOCAL ───────────
    case "no_local": {
      if (!data._notified_no_local) {
        responseText = "📍 O prestador *chegou ao local*! Ele vai confirmar a placa do seu veículo.";
        data._notified_no_local = true;
      } else {
        responseText = "📍 O prestador está no local realizando o atendimento.";
      }
      break;
    }

    // ─────────── 13. EM TRÂNSITO ───────────
    case "em_transito": {
      if (!data._notified_em_transito) {
        responseText = `🚛 Seu veículo está sendo transportado para: *${data.destino || "o destino"}*`;
        data._notified_em_transito = true;
      } else {
        responseText = "🚛 Seu veículo está em trânsito para o destino.";
      }
      break;
    }

    // ─────────── 14. FINALIZADO ───────────
    case "finalizado": {
      if (!data._notified_finalizado) {
        responseText =
          `✅ *Serviço finalizado!*\n\n` +
          `Seu veículo foi entregue com sucesso.\n\n` +
          `Obrigado por usar a *OpGrid*! 🙏\n\n` +
          `Como foi sua experiência? Responda de 1 a 5:\n` +
          `1️⃣ Péssima | 2️⃣ Ruim | 3️⃣ Regular | 4️⃣ Boa | 5️⃣ Excelente`;
        data._notified_finalizado = true;
      } else {
        // Captura nota de satisfação
        const nota = parseInt(text);
        if (nota >= 1 && nota <= 5) {
          data.nota_satisfacao = nota;
          responseText = `Obrigado pela avaliação! ⭐ Nota: ${nota}/5\n\nPara uma nova solicitação, envie "Oi".`;
          // Marca como concluído após avaliação
          nextState = "concluido";
        } else {
          responseText = 'Obrigado! Para uma nova solicitação, envie "Oi".';
          nextState = "concluido";
        }
      }
      break;
    }

    case "concluido":
      responseText = '✅ Este atendimento foi concluído. Para uma nova solicitação, envie "Oi".';
      break;

    case "em_andamento":
      responseText = "🔧 Seu atendimento está em andamento. Se tiver urgência, responda aqui.";
      break;

    case "humano":
      // Operador humano assumiu
      break;

    default:
      responseText = "Desculpe, não entendi. Pode repetir?";
  }

  if (responseText) {
    await reply(supabase, phone, conversationId, responseText, provider);
  }

  // ── Atualiza estado ──
  const { error: updateErr } = await supabase.from("conversations").update({
    state: nextState, data, updated_at: new Date().toISOString(),
  }).eq("id", conversationId);

  if (updateErr) {
    console.error(`[STATE] ❌ FAILED ${currentState} → ${nextState}:`, updateErr);
  } else {
    console.log(`[STATE] ✅ ${currentState} → ${nextState} for ${conversationId}`);
  }
}

// ══════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════

function jsonOk(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateConv(supabase: any, id: string, state: string, data: any) {
  const { error } = await supabase.from("conversations").update({
    state, data, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) console.error(`[UPDATE] Failed:`, error);
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "OpGrid/1.0" } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.display_name || `${lat}, ${lng}`;
    }
  } catch (e) { console.warn("[GEO] Reverse geocode failed:", e); }
  return `${lat}, ${lng}`;
}

// ── Send message ──

async function reply(supabase: any, to: string, conversationId: string, text: string, provider: Provider) {
  const phone = to.replace(/@s\.whatsapp\.net|@c\.us/g, "").replace(/\D/g, "");
  if (provider === "wapi") return sendWapi(supabase, phone, conversationId, text);
  return sendMeta(supabase, phone, conversationId, text);
}

async function sendWapi(supabase: any, to: string, conversationId: string, text: string) {
  const INSTANCE_ID = Deno.env.get("WAPI_INSTANCE_ID") || "";
  const TOKEN = Deno.env.get("WAPI_TOKEN") || "";
  if (!INSTANCE_ID || !TOKEN) { await storeOutbound(supabase, conversationId, to, text, null); return; }

  try {
    const res = await fetch(`https://api.w-api.app/v1/message/send-text?instanceId=${INSTANCE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ phone: to, message: text }),
    });
    const resBody = await res.text();
    console.log("[SEND-WAPI]", res.status, resBody.slice(0, 300));
    let messageId: string | null = null;
    if (res.ok) { try { const p = JSON.parse(resBody); messageId = p.id || p.key?.id || p.messageId || null; } catch {} }
    await storeOutbound(supabase, conversationId, to, text, messageId);
  } catch (err) {
    console.error("[SEND-WAPI] Error:", err);
    await storeOutbound(supabase, conversationId, to, text, null);
  }
}

async function sendMeta(supabase: any, to: string, conversationId: string, text: string) {
  const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
  const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
  const API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v21.0";
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) { await storeOutbound(supabase, conversationId, to, text, null); return; }

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    });
    const resBody = await res.text();
    const messageId = res.ok ? JSON.parse(resBody)?.messages?.[0]?.id : null;
    await storeOutbound(supabase, conversationId, to, text, messageId);
  } catch (err) {
    console.error("[SEND-META] Error:", err);
    await storeOutbound(supabase, conversationId, to, text, null);
  }
}

async function storeOutbound(supabase: any, conversationId: string, to: string, content: string, waMessageId: string | null) {
  await supabase.from("messages").insert({
    conversation_id: conversationId, direction: "outbound",
    wa_message_id: waMessageId, message_type: "text",
    content, status: waMessageId ? "sent" : "pending",
  });
  await supabase.from("message_logs").insert({
    conversation_id: conversationId, provider_message_id: waMessageId,
    direction: "outbound", status: waMessageId ? "sent" : "pending",
  });
}

// ── Automation trigger ──

async function enqueueAutomation(supabase: any, triggerEvent: string, phone: string, conversationId: string, payload?: Record<string, unknown>) {
  try {
    const { data: automations } = await supabase
      .from("message_automations").select("*")
      .eq("trigger_event", triggerEvent).eq("is_active", true);
    if (!automations?.length) return;
    const queueItems = automations.map((auto: any) => ({
      conversation_id: conversationId, automation_id: auto.id,
      recipient_phone: phone, channel: auto.channel,
      template_key: auto.template_key,
      payload_json: { phone, ...payload }, status: "pending",
      scheduled_at: auto.delay_seconds > 0
        ? new Date(Date.now() + auto.delay_seconds * 1000).toISOString()
        : new Date().toISOString(),
    }));
    await supabase.from("message_queue").insert(queueItems);
  } catch (err) {
    console.error("[AUTOMATION] enqueue error:", triggerEvent, err);
  }
}

// ── Create Solicitação + Dispatch ──

async function createSolicitacaoAndDispatch(supabase: any, conversationId: string, data: any, phone: string, provider: Provider) {
  const cleanPhone = phone.replace(/@c\.us|@s\.whatsapp\.net/g, "").replace(/\D/g, "");
  const now = new Date().toISOString();
  const fallbackProtocol = buildFallbackProtocol(new Date(now));

  const { data: sol, error: solErr } = await insertWithSchemaFallback(supabase, "solicitacoes", {
    protocolo: fallbackProtocol, created_at: now, updated_at: now, data_hora: now,
    canal: "WhatsApp",
    cliente_nome: data.nome || "Cliente não informado",
    cliente_telefone: cleanPhone, cliente_whatsapp: cleanPhone,
    placa: data.placa || null, tipo_veiculo: data.modelo || "Veículo não informado",
    origem_endereco: data.origem || null, destino_endereco: data.destino || null,
    motivo: data.motivo || "Outro", observacoes: data.observacoes || "",
    distancia_estimada_km: toNum(data.distanciaKm),
    valor: toNum(data.valorEstimado), valor_estimado: toNum(data.valorEstimado),
    status: "pendente", prioridade: "normal", status_proposta: "Aceita",
  }, "*");

  if (solErr || !sol) {
    console.error("[DISPATCH] Error creating solicitacao:", solErr);
    await reply(supabase, cleanPhone, conversationId, "⚠️ Ocorreu um erro ao criar sua OS. Nossa equipe foi notificada.", provider);
    return false;
  }

  const protocolo = sol.protocolo || fallbackProtocol;

  const { data: atendimento, error: atErr } = await insertWithSchemaFallback(supabase, "atendimentos", {
    solicitacao_id: sol.id, status: "aberto",
    notas: `OS criada via WhatsApp (${protocolo}) • ${data.motivo || ""} • ${data.origem || ""} → ${data.destino || ""}`,
    created_at: now,
  }, "id");

  const atendimentoId = atendimento?.id || null;
  if (atErr) console.error("[DISPATCH] Atendimento error:", atErr);

  // Link conversation → solicitação + atendimento
  await supabase.from("conversations").update({
    solicitacao_id: sol.id,
    ...(atendimentoId ? { atendimento_id: atendimentoId } : {}),
  }).eq("id", conversationId);

  if (atendimentoId) {
    await supabase.from("solicitacoes").update({ atendimento_id: atendimentoId }).eq("id", sol.id);
  }

  const osMsg =
    `📄 *Ordem de Serviço Criada!*\n\n` +
    `📋 Protocolo: *${protocolo}*\n` +
    `👤 Cliente: ${data.nome || "N/I"}\n🚗 ${data.modelo || "Veículo"} — Placa: ${data.placa || "N/I"}\n` +
    `🔧 Motivo: ${data.motivo || "Outro"}\n📍 Origem: ${data.origem || "N/I"}\n` +
    `🏁 Destino: ${data.destino || "N/I"}\n` +
    `💰 Valor: R$ ${(Number(data.valorEstimado || 0)).toFixed(2)}\n\n` +
    `⏳ Estamos acionando os prestadores próximos!`;

  await reply(supabase, cleanPhone, conversationId, osMsg, provider);
  await enqueueAutomation(supabase, "order_created", cleanPhone, conversationId, { protocolo, solicitacaoId: sol.id, atendimentoId });

  // Trigger dispatch-start
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/dispatch-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ solicitacao_id: sol.id, atendimento_id: atendimentoId, conversation_id: conversationId, contact_phone: cleanPhone }),
    });
    if (!res.ok) console.error("[DISPATCH] dispatch-start error:", await res.text());
  } catch (err) { console.error("[DISPATCH] dispatch-start call error:", err); }

  try {
    await fetch(`${supabaseUrl}/functions/v1/process-queue`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (err) { console.error("[DISPATCH] process-queue error:", err); }

  return true;
}

// ── Schema-resilient insert/update ──

async function insertWithSchemaFallback(supabase: any, table: string, fields: Record<string, unknown>, selectClause = "*") {
  let payload = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  let lastError: any = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await supabase.from(table).insert(payload).select(selectClause).maybeSingle();
    if (!error) return { data, error: null };
    lastError = error;
    const col = extractUnknownColumn(error, table);
    if (!col || !(col in payload)) break;
    const { [col]: _, ...next } = payload;
    console.warn(`[DB] Removing ${table}.${col}, retry ${attempt + 1}`);
    if (!Object.keys(next).length) break;
    payload = next;
  }
  return { data: null, error: lastError };
}

function extractUnknownColumn(error: any, table: string) {
  const msg = String(error?.message || "");
  const m1 = msg.match(new RegExp(`Could not find the '([^']+)' column of '${table}'`, "i"));
  if (m1?.[1]) return m1[1];
  const m2 = msg.match(new RegExp(`column[\\s\"']+([^\"'\\s]+)[\\s\"']+of relation[\\s\"']+${table}[\\s\"']+does not exist`, "i"));
  return m2?.[1] || null;
}

function toNum(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : null; }

function buildFallbackProtocol(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `OS-${y}${m}${day}-${String(d.getTime() % 10000).padStart(4, "0")}`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
