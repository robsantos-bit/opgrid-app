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

  // GET — Meta webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[WEBHOOK] Verification OK");
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
    console.log("[WEBHOOK] Payload:", JSON.stringify(body).slice(0, 600));

    // Detect provider
    const provider = detectProvider(body);
    console.log("[WEBHOOK] Provider:", provider);

    // Normalize messages
    const normalized = provider === "wapi"
      ? normalizeWapi(body)
      : normalizeMeta(body);

    if (!normalized.length) {
      return jsonOk({ status: "no_messages", provider });
    }

    for (const nm of normalized) {
      // Status updates
      if (nm.isStatus) {
        console.log(`[WEBHOOK] Status: ${nm.id} → ${nm.statusValue}`);
        await supabase.from("messages").update({ status: nm.statusValue }).eq("wa_message_id", nm.id);
        await supabase.from("message_logs").insert({
          provider_message_id: nm.id,
          direction: "outbound",
          status: nm.statusValue,
          response_json: nm.raw,
        });
        continue;
      }

      const contactPhone = nm.from;
      const contactName = nm.contactName;
      console.log(`[WEBHOOK] Msg from ${contactName} (${contactPhone}): ${nm.content.slice(0, 80)}`);

      // 1. Find or create conversation
      const { data: found, error: findErr } = await supabase
        .from("conversations")
        .select("*")
        .eq("contact_phone", contactPhone)
        .not("state", "in", '("cancelado","concluido")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findErr) {
        console.error("[WEBHOOK] Find conversation error:", findErr);
      }

      let conversa = found;
      if (!conversa) {
        const now = new Date();
        const { data: nova, error: insertErr } = await supabase
          .from("conversations")
          .insert({
            contact_phone: contactPhone,
            wa_contact_id: contactPhone,
            contact_name: contactName,
            state: "novo_contato",
            data: { nome: contactName, telefone: contactPhone },
            window_opened_at: now.toISOString(),
            window_expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
          })
          .select()
          .single();

        if (insertErr || !nova) {
          console.error("[WEBHOOK] Error creating conversation:", insertErr);
          return jsonOk({ status: "error", error: insertErr?.message || "insert failed" });
        }
        conversa = nova;
      } else {
        // Refresh window
        const now = new Date();
        await supabase.from("conversations").update({
          window_opened_at: now.toISOString(),
          window_expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", conversa.id);
      }

      // 2. Store inbound message
      await supabase.from("messages").upsert({
        conversation_id: conversa.id,
        direction: "inbound",
        wa_message_id: nm.id,
        message_type: nm.type,
        content: nm.content,
        metadata: nm.raw,
        status: "received",
      }, { onConflict: "wa_message_id" });

      // 3. Process state machine
      await processState(supabase, conversa, nm, provider);

      // 4. Log
      await supabase.from("message_logs").insert({
        conversation_id: conversa.id,
        direction: "inbound",
        provider_message_id: nm.id,
        status: "received",
        response_json: nm.raw,
      });
    }

    return jsonOk({ status: "ok", provider, processed: normalized.length });
  } catch (err) {
    console.error("[WEBHOOK] Error:", err);
    return jsonOk({ error: String(err) });
  }
});

// ── Types ──

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

// ── Provider detection ──

function detectProvider(body: any): Provider {
  if (body.event || body.instanceId || body.data?.key || body.sender?.id) return "wapi";
  if (body.object === "whatsapp_business_account" || body.entry) return "meta";
  if (body.data?.message) return "wapi";
  return "meta";
}

// ── W-API normalization ──

function normalizeWapi(body: any): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];
  const event = body.event || "";

  // Skip group messages and own messages
  if (body.isGroup || body.fromMe) return messages;

  // Status events
  if (event === "onMessageStatus" || event === "message_status") {
    const data = body.data || body;
    const key = data.key || data;
    const status = data.status || data.ack;
    const statusMap: Record<number, string> = { 0: "pending", 1: "sent", 2: "delivered", 3: "read" };
    const statusStr = typeof status === "number" ? (statusMap[status] || "unknown") : String(status);
    messages.push({
      id: key.id || data.id || "",
      from: (key.remoteJid || "").replace(/@s\.whatsapp\.net|@c\.us/g, ""),
      contactName: "",
      type: "status",
      content: "",
      raw: body,
      isStatus: true,
      statusValue: statusStr,
    });
    return messages;
  }

  // Message events (multiple W-API event formats)
  if (event === "onMessage" || event === "messages.upsert" || event === "webhookReceived" || !event) {
    // W-API has different payload shapes depending on version
    const data = body.data || body;
    const key = data.key || {};

    // Skip outgoing
    if (key.fromMe) return messages;

    // Extract phone - handles both sender.id format and key.remoteJid format
    let phone = "";
    if (body.sender?.id) {
      phone = body.sender.id.replace(/@s\.whatsapp\.net|@c\.us/g, "");
    } else {
      phone = (key.remoteJid || data.from || "").replace(/@s\.whatsapp\.net|@c\.us/g, "");
    }

    if (!phone) return messages;

    const msgId = key.id || data.id || body.messageId || `wapi_${Date.now()}`;
    const pushName = data.pushName || data.senderName || body.sender?.name || phone;

    // Content extraction - handles both msgContent and data.message shapes
    const msg = body.msgContent || data.message || {};
    let type = "text";
    let content = "";
    let interactive: any = undefined;
    let location: any = undefined;

    if (msg.conversation) {
      content = msg.conversation;
    } else if (msg.extendedTextMessage?.text) {
      content = msg.extendedTextMessage.text;
    } else if (msg.imageMessage) {
      type = "image";
      content = msg.imageMessage.caption || "[Imagem]";
    } else if (msg.videoMessage) {
      type = "video";
      content = msg.videoMessage.caption || "[Vídeo]";
    } else if (msg.audioMessage) {
      type = "audio";
      content = "[Áudio]";
    } else if (msg.documentMessage) {
      type = "document";
      content = msg.documentMessage.fileName || "[Documento]";
    } else if (msg.locationMessage) {
      type = "location";
      location = {
        latitude: msg.locationMessage.degreesLatitude,
        longitude: msg.locationMessage.degreesLongitude,
        address: msg.locationMessage.address,
      };
      content = `${location.latitude},${location.longitude}`;
    } else if (msg.buttonsResponseMessage) {
      type = "interactive";
      interactive = { button_reply: { id: msg.buttonsResponseMessage.selectedButtonId, title: msg.buttonsResponseMessage.selectedDisplayText } };
      content = msg.buttonsResponseMessage.selectedDisplayText || "";
    } else if (msg.listResponseMessage) {
      type = "interactive";
      interactive = { list_reply: { title: msg.listResponseMessage.title } };
      content = msg.listResponseMessage.title || "";
    } else if (data.body || data.text) {
      content = data.body || data.text || "";
    }

    messages.push({ id: msgId, from: phone, contactName: pushName, type, content, raw: body, interactive, location });
  }

  return messages;
}

// ── Meta normalization ──

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
        id: msg.id,
        from: msg.from,
        contactName: contact?.profile?.name || msg.from,
        type: msg.type,
        content,
        raw: msg,
        interactive: msg.interactive,
        location: msg.location,
      });
    }
  }

  if (changes.statuses?.length) {
    for (const s of changes.statuses) {
      messages.push({
        id: s.id,
        from: s.recipient_id || "",
        contactName: "",
        type: "status",
        content: "",
        raw: s,
        isStatus: true,
        statusValue: s.status,
      });
    }
  }

  return messages;
}

// ── State Machine ──

async function processState(supabase: any, conversa: any, nm: NormalizedMessage, provider: Provider) {
  const text = nm.content.trim();
  const textLower = text.toLowerCase();
  const phone = nm.from;
  const contactName = nm.contactName;
  const conversationId = conversa.id;
  let currentState = conversa.state;
  let data = conversa.data || {};

  // Cancel check
  if (textLower.includes("cancelar") && currentState !== "novo_contato") {
    await updateConv(supabase, conversationId, "cancelado", data);
    await reply(supabase, phone, conversationId, "❌ Solicitação cancelada. Se precisar, envie uma nova mensagem!", provider);
    return;
  }

  let nextState = currentState;
  let responseText = "";

  switch (currentState) {
    case "novo_contato": {
      const firstName = contactName ? contactName.split(" ")[0] : "";
      responseText =
        `Olá${firstName ? ", " + firstName : ""}! 👋\n\n` +
        `Sou o assistente da *OpGrid Assistência Veicular*.\n\n` +
        `Vou te ajudar a solicitar um guincho/reboque.\n\n` +
        `Para começar, me diga seu *nome completo*:`;
      nextState = "aguardando_nome";
      break;
    }

    case "aguardando_nome": {
      if (text.length < 3) { responseText = "Por favor, informe seu nome completo (mínimo 3 caracteres):"; break; }
      data.nome = text;
      nextState = "aguardando_veiculo";
      responseText = `Obrigado, *${text.split(" ")[0]}*! ✅\n\nAgora informe a *placa do veículo*:\n_(Ex: ABC1D23 ou ABC-1234)_`;
      break;
    }

    case "aguardando_veiculo": {
      const placa = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (placa.length < 7) { responseText = "⚠️ Placa inválida. Informe no formato *ABC1D23* ou *ABC-1234*:"; break; }
      data.placa = placa;
      nextState = "aguardando_origem";
      responseText = `🚗 Placa registrada: *${placa}*\n\nAgora envie sua *localização atual* 📍\n\nVocê pode:\n• Compartilhar localização pelo WhatsApp\n• Digitar o endereço completo`;
      break;
    }

    case "aguardando_origem": {
      if (nm.type === "location" && nm.location) {
        data.origem = nm.location.address || `${nm.location.latitude}, ${nm.location.longitude}`;
        data.coordenadas = { lat: nm.location.latitude, lng: nm.location.longitude };
      } else {
        if (text.length < 5) { responseText = "📍 Por favor, envie um endereço mais detalhado ou compartilhe sua localização:"; break; }
        data.origem = text;
      }
      nextState = "aguardando_motivo";
      responseText = "🔧 Qual o *motivo do atendimento*?\n\n1️⃣ Pane mecânica\n2️⃣ Pneu furado\n3️⃣ Outro motivo\n\n_Responda com o número ou digite o motivo:_";
      break;
    }

    case "aguardando_motivo": {
      const motivoMap: Record<string, string> = { "1": "Pane mecânica", "2": "Pneu furado", "3": "Outro" };
      const buttonId = nm.interactive?.button_reply?.id;
      const motivoFromBtn: Record<string, string> = { pane_mecanica: "Pane mecânica", pneu_furado: "Pneu furado", outro_motivo: "Outro" };
      data.motivo = buttonId ? (motivoFromBtn[buttonId] || "Outro") : (motivoMap[textLower] || text || "Outro");
      nextState = "aguardando_destino";
      responseText = `✅ Motivo: *${data.motivo}*\n\nAgora informe o *endereço de destino*:\n_(Para onde o veículo deve ser levado)_`;
      break;
    }

    case "aguardando_destino": {
      if (text.length < 5) { responseText = "🏁 Por favor, informe o endereço de destino com mais detalhes:"; break; }
      data.destino = text;
      nextState = "aguardando_observacoes";
      responseText = "📝 Deseja adicionar alguma *observação*?\n_(Ex: veículo rebaixado, rua estreita, etc.)_\n\n1️⃣ Sem observações\n2️⃣ Sim, quero informar\n\n_Responda com o número:_";
      break;
    }

    case "aguardando_observacoes": {
      const buttonId = nm.interactive?.button_reply?.id;
      const isComObs = buttonId === "com_obs" || textLower === "2";
      const isSemObs = buttonId === "sem_obs" || textLower === "1";

      if (isComObs) {
        await reply(supabase, phone, conversationId, "Digite suas observações:", provider);
        await updateConv(supabase, conversationId, currentState, data);
        return;
      }
      data.observacoes = isSemObs ? "" : text;

      // Calculate estimate
      const distanciaKm = Math.floor(Math.random() * 30) + 5;
      const valorTotal = Math.round((120 + distanciaKm * 4.5) * 100) / 100;
      data.distanciaKm = distanciaKm;
      data.valorEstimado = valorTotal;

      const resumo =
        `📋 *Resumo do Orçamento*\n\n` +
        `👤 ${data.nome}\n🚗 Placa: ${data.placa}\n🔧 ${data.motivo}\n` +
        `📍 ${data.origem}\n🏁 ${data.destino}\n📏 Distância: ~${distanciaKm} km\n` +
        (data.observacoes ? `📝 Obs: ${data.observacoes}\n` : "") +
        `\n💰 *Valor estimado: R$ ${valorTotal.toFixed(2)}*`;

      await reply(supabase, phone, conversationId, resumo, provider);

      nextState = "aguardando_aceite";
      responseText = "Deseja *confirmar* este atendimento?\n\n1️⃣ ✅ Aceitar\n2️⃣ ❌ Recusar";
      break;
    }

    case "aguardando_aceite": {
      const buttonId = nm.interactive?.button_reply?.id;
      const aceite = buttonId === "aceitar" || textLower === "1" || textLower.includes("sim") || textLower.includes("aceito");
      const recusa = buttonId === "recusar" || textLower === "2" || textLower.includes("não") || textLower.includes("cancelar");

      if (aceite) {
        nextState = "solicitado";
        await reply(supabase, phone, conversationId,
          "✅ *Solicitação confirmada!*\n\nEstamos criando sua OS e localizando o prestador mais próximo...", provider);
        await createSolicitacaoAndDispatch(supabase, conversationId, data, phone, provider);
      } else if (recusa) {
        nextState = "cancelado";
        responseText = "❌ Orçamento recusado. Se mudar de ideia, é só enviar uma nova mensagem!";
      } else {
        responseText = "Por favor, responda *1* para aceitar ou *2* para recusar o orçamento.";
      }
      break;
    }

    case "solicitado":
      responseText = "⏳ Sua OS já está sendo processada! Estamos localizando o prestador mais próximo. Aguarde...";
      break;
    case "prestador_aceito":
      responseText = "🚗 O prestador já está a caminho! Se precisar de algo, responda aqui.";
      break;
    case "em_andamento":
      responseText = "🔧 Seu atendimento está em andamento. Se tiver alguma urgência, responda aqui.";
      break;
    case "concluido":
      responseText = '✅ Este atendimento já foi concluído. Para uma nova solicitação, envie "Oi".';
      break;
    case "humano":
      // Human takeover — no auto-response
      break;
    default:
      responseText = "Desculpe, não entendi. Pode repetir?";
  }

  if (responseText) {
    await reply(supabase, phone, conversationId, responseText, provider);
  }
  await updateConv(supabase, conversationId, nextState, data);
}

// ── Helpers ──

function jsonOk(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateConv(supabase: any, id: string, state: string, data: any) {
  await supabase.from("conversations").update({
    state,
    data,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
}

// ── Send message via W-API or Meta ──

async function reply(supabase: any, to: string, conversationId: string, text: string, provider: Provider) {
  if (provider === "wapi") {
    return sendWapi(supabase, to, conversationId, text);
  }
  return sendMeta(supabase, to, conversationId, text);
}

async function sendWapi(supabase: any, to: string, conversationId: string, text: string) {
  const INSTANCE_ID = Deno.env.get("WAPI_INSTANCE_ID") || "";
  const TOKEN = Deno.env.get("WAPI_TOKEN") || "";

  if (!INSTANCE_ID || !TOKEN) {
    console.warn("[SEND-WAPI] Missing credentials");
    await storeOutbound(supabase, conversationId, to, text, null);
    return;
  }

  const phone = to.replace(/@s\.whatsapp\.net|@c\.us/g, "").replace(/\D/g, "");

  try {
    const res = await fetch(
      `https://api.w-api.app/v1/message/send-text?instanceId=${INSTANCE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, message: text.replace(/\\n/g, "\n") }),
      }
    );
    const resBody = await res.text();
    console.log("[SEND-WAPI]", res.status, resBody.slice(0, 300));

    let messageId: string | null = null;
    if (res.ok) {
      try { const p = JSON.parse(resBody); messageId = p.id || p.key?.id || p.messageId || null; } catch {}
    }
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

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    await storeOutbound(supabase, conversationId, to, text, null);
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
      }
    );
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
    conversation_id: conversationId,
    direction: "outbound",
    wa_message_id: waMessageId,
    message_type: "text",
    content,
    status: waMessageId ? "sent" : "pending",
  });
  await supabase.from("message_logs").insert({
    conversation_id: conversationId,
    provider_message_id: waMessageId,
    direction: "outbound",
    status: waMessageId ? "sent" : "pending",
  });
}

// ── Automation trigger ──

async function enqueueAutomation(supabase: any, triggerEvent: string, phone: string, conversationId: string, payload?: Record<string, unknown>) {
  try {
    const { data: automations } = await supabase
      .from("message_automations")
      .select("*")
      .eq("trigger_event", triggerEvent)
      .eq("is_active", true);

    if (!automations?.length) return;

    const queueItems = automations.map((auto: any) => ({
      conversation_id: conversationId,
      automation_id: auto.id,
      recipient_phone: phone,
      channel: auto.channel,
      template_key: auto.template_key,
      payload_json: { phone, ...payload },
      status: "pending",
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

async function createSolicitacaoAndDispatch(
  supabase: any,
  conversationId: string,
  data: any,
  phone: string,
  provider: Provider
) {
  const now = new Date().toISOString();

  const { data: sol, error: solErr } = await supabase.from("solicitacoes").insert({
    data_hora: now,
    canal: "WhatsApp",
    cliente_nome: data.nome || null,
    cliente_telefone: phone.replace(/@c\.us|@s\.whatsapp\.net/g, ""),
    cliente_whatsapp: phone.replace(/@c\.us|@s\.whatsapp\.net/g, ""),
    placa: data.placa || null,
    tipo_veiculo: data.modelo || "Veículo não informado",
    origem_endereco: data.origem || null,
    destino_endereco: data.destino || null,
    motivo: data.motivo || "Outro",
    observacoes: data.observacoes || "",
    distancia_estimada_km: data.distanciaKm || null,
    valor: data.valorEstimado || null,
    valor_estimado: data.valorEstimado || null,
    status: "pendente",
    status_proposta: "Aceita",
  }).select().single();

  if (solErr) {
    console.error("[DISPATCH] Error creating solicitacao:", solErr);
    await reply(supabase, phone, conversationId,
      "⚠️ Ocorreu um erro ao criar sua OS. Nossa equipe foi notificada e entrará em contato.", provider);
    return;
  }

  const protocolo = sol.protocolo || `OS-${sol.id}`;

  // Link conversation to solicitacao
  await supabase.from("conversations").update({ solicitacao_id: sol.id }).eq("id", conversationId);

  // Confirmation to client
  const osMsg =
    `📄 *Ordem de Serviço Criada!*\n\n` +
    `📋 Protocolo: *${protocolo}*\n` +
    `👤 Cliente: ${data.nome || "N/I"}\n` +
    `🚗 Placa: ${data.placa || "N/I"}\n` +
    `🔧 Motivo: ${data.motivo || "Outro"}\n` +
    `📍 Origem: ${data.origem || "N/I"}\n` +
    `🏁 Destino: ${data.destino || "N/I"}\n` +
    `💰 Valor: R$ ${(Number(data.valorEstimado || 0)).toFixed(2)}\n\n` +
    `⏳ Estamos acionando os prestadores próximos. Você receberá atualizações aqui!`;

  await reply(supabase, phone, conversationId, osMsg, provider);

  // Enqueue automations
  await enqueueAutomation(supabase, "order_created", phone, conversationId, { protocolo, solicitacaoId: sol.id });
  await enqueueAutomation(supabase, "new_request", phone, conversationId, { protocolo });

  // Call dispatch-start
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/dispatch-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ solicitacao_id: sol.id, conversation_id: conversationId, contact_phone: phone }),
    });
    if (!res.ok) console.error("[DISPATCH] dispatch-start error:", await res.text());
  } catch (err) {
    console.error("[DISPATCH] Error calling dispatch-start:", err);
  }

  // Trigger process-queue
  try {
    await fetch(`${supabaseUrl}/functions/v1/process-queue`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.error("[DISPATCH] Error triggering process-queue:", err);
  }
}
