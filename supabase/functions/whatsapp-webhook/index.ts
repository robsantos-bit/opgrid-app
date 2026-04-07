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

interface CreateSolicitacaoResult {
  ok: boolean;
  dispatchStarted: boolean;
  dataPatch?: Record<string, unknown>;
}

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

  // Bloqueio de segurança para grupos e mensagens do próprio número
  if (body.isGroup || body.fromMe === true) return messages;

  // 1. TRATAMENTO DE STATUS (Read, Delivered, Sent)
  if (event === "onMessageStatus" || event === "message_status" || body.status || body.ack) {
    const data = body.data || body;
    const key = data.key || data;
    const statusMap: Record<number, string> = { 0: "pending", 1: "sent", 2: "delivered", 3: "read" };
    const statusVal = data.status || data.ack;
    
    messages.push({
      id: key.id || data.id || "",
      from: (key.remoteJid || data.from || "").replace(/@s\.whatsapp\.net|@c\.us/g, ""),
      contactName: "",
      type: "status",
      content: "",
      raw: body,
      isStatus: true,
      statusValue: typeof statusVal === "number" ? (statusMap[statusVal] || "unknown") : String(statusVal),
    });
    return messages;
  }

  // 2. TRATAMENTO DE MENSAGENS RECEBIDAS (Text, Location, Media)
  if (event === "onMessage" || event === "messages.upsert" || event === "webhookReceived" || !event) {
    const data = body.data || body;
    const key = data.key || {};
    
    // Ignora se for mensagem enviada por nós
    if (key.fromMe === true || data.fromMe === true || body.fromMe === true) return messages;

    // Identificação do Telefone
    let phone = "";
    if (body.sender?.id) phone = body.sender.id.replace(/@s\.whatsapp\.net|@c\.us/g, "");
    else phone = (key.remoteJid || data.from || body.from || "").replace(/@s\.whatsapp\.net|@c\.us/g, "");
    
    if (!phone) return messages;

    const msgId = key.id || data.id || body.messageId || `wapi_${Date.now()}`;
    const pushName = data.pushName || data.senderName || body.sender?.name || "";
    
    // O segredo está aqui: A W-API pode enviar em 'msgContent', 'message' ou direto no 'data'
    const msg = body.msgContent || data.message || data || {};
    
    let type = "text";
    let content = "";
    let interactive: any = undefined;
    let location: any = undefined;

    // 📍 CAPTURA DE LOCALIZAÇÃO — busca multinível em todos os caminhos possíveis da W-API
    // Pode vir como locationMessage, liveLocationMessage, location, ou aninhado em vários níveis
    function findLocationObj(...sources: any[]): any {
      for (const src of sources) {
        if (!src || typeof src !== "object") continue;
        // Checa caminhos diretos
        for (const key of ["locationMessage", "liveLocationMessage", "location"]) {
          if (src[key] && typeof src[key] === "object") {
            const obj = src[key];
            const lat = obj.degreesLatitude || obj.latitude || obj.lat;
            const lng = obj.degreesLongitude || obj.longitude || obj.lng;
            if (lat && lng) return obj;
          }
        }
        // Checa se o próprio objeto tem lat/lng
        const lat = src.degreesLatitude || src.latitude || src.lat;
        const lng = src.degreesLongitude || src.longitude || src.lng;
        if (lat && lng) return src;
      }
      return null;
    }

    const locObj = findLocationObj(msg, data, body, data.message, body.msgContent);

    if (locObj) {
      type = "location";
      const lat = locObj.degreesLatitude || locObj.latitude || locObj.lat;
      const lng = locObj.degreesLongitude || locObj.longitude || locObj.lng;
      
      if (lat && lng) {
        location = { 
          latitude: Number(lat), 
          longitude: Number(lng), 
          address: locObj.address || locObj.name || locObj.comment || "" 
        };
        content = `${Number(lat)},${Number(lng)}`;
        console.log(`📍 [W-API] Localização detectada: lat=${lat}, lng=${lng}, address="${location.address}"`);
      }
    }
    // 📝 CAPTURA DE TEXTO E OUTROS
    else if (msg.conversation) content = msg.conversation;
    else if (msg.extendedTextMessage?.text) content = msg.extendedTextMessage.text;
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
    else {
      content = data.body || data.text || body.text || "";
    }

    if (!content && type === "text") return messages;

    messages.push({ 
      id: msgId, 
      from: phone, 
      contactName: pushName || phone, 
      type, 
      content, 
      raw: body, 
      interactive, 
      location 
    });
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

    // ─────────── 3. PLACA + TIPO + MARCA + MODELO ───────────
    case "aguardando_veiculo": {
      // Sub-step 1: Placa
      if (!data.placa) {
        const placa = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (placa.length < 7) { responseText = "⚠️ Placa inválida. Informe no formato *ABC1D23* ou *ABC-1234*:"; break; }
        data.placa = placa;
        responseText =
          `🚗 Placa registrada: *${placa}*\n\n` +
          `Qual o *tipo de veículo*?\n\n` +
          `1️⃣ Carro\n2️⃣ Moto\n3️⃣ Caminhonete/SUV\n4️⃣ Caminhão\n5️⃣ Equipamento\n\n` +
          `_Responda com o número:_`;
        break;
      }

      // Sub-step 2: Tipo de veículo
      if (!data.tipo_veiculo) {
        const tipoMap: Record<string, string> = {
          "1": "Carro", "2": "Moto", "3": "Caminhonete/SUV",
          "4": "Caminhão", "5": "Equipamento"
        };
        const tipo = tipoMap[textLower] || text;
        data.tipo_veiculo = tipo;
        data.modelo = tipo; // Keep for pricing compatibility
        responseText =
          `✅ Tipo: *${tipo}*\n\n` +
          `Qual a *marca* do veículo?\n_(Ex: Volkswagen, Chevrolet, Fiat, Ford, Toyota, Hyundai, Honda, Renault, Jeep, Nissan, Audi, BMW, Mercedes)_`;
        break;
      }

      // Sub-step 3: Marca
      if (!data.marca_veiculo) {
        if (text.length < 2) { responseText = "Por favor, informe a marca do veículo:"; break; }
        data.marca_veiculo = text.trim();
        responseText =
          `✅ Marca: *${data.marca_veiculo}*\n\n` +
          `Qual o *modelo* do veículo?\n_(Ex: Gol, Corsa, Uno, Civic, HB20, Onix, Compass)_`;
        break;
      }

      // Sub-step 4: Modelo
      if (!data.modelo_veiculo) {
        if (text.length < 2) { responseText = "Por favor, informe o modelo do veículo:"; break; }
        data.modelo_veiculo = text.trim();
        nextState = "aguardando_origem";
        responseText =
          `✅ Veículo: *${data.tipo_veiculo}* — *${data.marca_veiculo} ${data.modelo_veiculo}*\n` +
          `Placa: *${data.placa}*\n\n` +
          `Agora envie sua *localização atual* 📍\n\nVocê pode:\n• Compartilhar localização pelo WhatsApp\n• Digitar o endereço completo`;
        break;
      }

      // Fallback
      nextState = "aguardando_origem";
      responseText = `Agora envie sua *localização atual* 📍`;
      break;
    }

    // ─────────── 4. ORIGEM ───────────
    case "aguardando_origem": {
      console.log(`[ORIGEM] nm.type="${nm.type}", nm.location=${JSON.stringify(nm.location)}, text="${text.slice(0,60)}"`);
      if (nm.type === "location" && nm.location) {
        const lat = Number(nm.location.latitude);
        const lng = Number(nm.location.longitude);
        data.coordenadas = { lat, lng };
        let endereco = nm.location.address || "";
        if (!endereco || endereco.length < 5) {
          endereco = await reverseGeocode(lat, lng);
        }
        data.origem = endereco || `${lat}, ${lng}`;
        console.log(`[ORIGEM] GPS capturado: lat=${lat}, lng=${lng}, endereco="${data.origem}"`);
      } else {
        // Tenta extrair coordenadas do texto (caso W-API envie como texto "lat,lng")
        const coordMatch = text.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
          const lat = Number(coordMatch[1]);
          const lng = Number(coordMatch[2]);
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            data.coordenadas = { lat, lng };
            const endereco = await reverseGeocode(lat, lng);
            data.origem = endereco || `${lat}, ${lng}`;
            console.log(`[ORIGEM] Coordenadas extraídas do texto: lat=${lat}, lng=${lng}`);
          } else {
            data.origem = text;
          }
        } else {
          if (text.length < 5) { responseText = "📍 Por favor, envie um endereço mais detalhado ou compartilhe sua localização:"; break; }
          data.origem = text;
          const coords = await forwardGeocode(text);
          if (coords) data.coordenadas = coords;
        }
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
        const coords = await forwardGeocode(text);
        if (coords) data.coordenadas_destino = coords;
      }
      nextState = "aguardando_observacoes";
      // Structured checklist instead of free-text observations
      data._checklist_step = 0;
      responseText =
        `📝 *Informações adicionais do veículo*\n\n` +
        `Responda cada pergunta com *Sim* ou *Não*:\n\n` +
        `1️⃣ As rodas estão travadas?`;
      break;
    }

    // ─────────── 7. OBSERVAÇÕES ESTRUTURADAS + ORÇAMENTO ───────────
    case "aguardando_observacoes": {
      const checklistQuestions = [
        { key: "rodas_travadas", question: "As rodas estão travadas?" },
        { key: "veiculo_carregado", question: "O veículo está carregado?" },
        { key: "veiculo_rebaixado", question: "O veículo é baixo ou rebaixado?" },
        { key: "facil_acesso", question: "O veículo está de fácil acesso para remoção?" },
        { key: "qtd_pessoas", question: "Quantas pessoas estão no veículo? (1, 2, 3, 4, 5)" },
        { key: "veiculo_blindado", question: "O veículo é blindado?" },
        { key: "documentos_local", question: "Os documentos estão no local?" },
        { key: "chave_em_maos", question: "A chave do veículo está em mãos?" },
        { key: "acompanha_reboque", question: "Irá acompanhar o reboque?" },
        { key: "ciente_itens_pessoais", question: "Não nos responsabilizamos por itens pessoais deixados no veículo ou na cabine do prestador. Confirme: *OK, estou ciente*" },
      ];

      const step = data._checklist_step || 0;

      if (step < checklistQuestions.length) {
        const currentQ = checklistQuestions[step];

        // Parse answer
        if (step === 4) {
          // Numeric answer for qtd_pessoas
          const num = parseInt(text);
          data[`info_${currentQ.key}`] = (num >= 1 && num <= 5) ? num : 1;
        } else if (step === 9) {
          // Last question — any answer proceeds
          data[`info_${currentQ.key}`] = textLower.includes("ok") || textLower.includes("sim") || textLower.includes("ciente") ? "Sim" : "Sim";
        } else {
          const isSim = textLower === "sim" || textLower === "s" || textLower === "1";
          data[`info_${currentQ.key}`] = isSim ? "Sim" : "Não";
        }

        data._checklist_step = step + 1;

        if (step + 1 < checklistQuestions.length) {
          const nextQ = checklistQuestions[step + 1];
          if (step + 1 === 4) {
            responseText = `✅ Registrado!\n\n${nextQ.question}`;
          } else if (step + 1 === 9) {
            responseText = `✅ Registrado!\n\n⚠️ ${nextQ.question}`;
          } else {
            responseText = `✅ Registrado!\n\n${nextQ.question}\n_(Sim ou Não)_`;
          }
          // Stay in same state — don't proceed to quote yet
          await updateConv(supabase, conversationId, currentState, data);
          await reply(supabase, phone, conversationId, responseText, provider);
          return;
        }

        // All questions answered — build observacoes summary
        const obsLines = checklistQuestions.map((q, i) => {
          const val = data[`info_${q.key}`];
          const label = q.question.replace(/\?$/, "").replace(/^Não nos responsabilizamos.*/, "Ciente sobre itens pessoais");
          return `• ${label}: *${val}*`;
        });
        data.observacoes = obsLines.join("\n");
        delete data._checklist_step;
      }

      // ── Continua para o orçamento ──

      // ── Determina tipo de veículo para calculate-quote ──
      const vehicleText = normalizeVehicleType(data.modelo);
      const isPesado = /caminhao|equipamento|pesad/.test(vehicleText);
      const isUtilitario = /utilitario|van|fiorino|sprinter/.test(vehicleText);
      const tipoVeiculo = isPesado ? "pesado" : isUtilitario ? "utilitario" : "padrao";

      // ── Determina se é horário noturno (20h–6h) ──
      const horaAtual = new Date().getUTCHours() - 3; // UTC-3 (Brasília)
      const ehNoturno = horaAtual < 0 ? (horaAtual + 24 >= 20 || horaAtual + 24 < 6) : (horaAtual >= 20 || horaAtual < 6);

      // ── Chama calculate-quote Edge Function ──
      let quoteResult: any = null;
      let usedFallback = false;

      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const quoteRes = await fetch(`${supabaseUrl}/functions/v1/calculate-quote`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origem: data.origem || "",
            destino: data.destino || "",
            tipo_veiculo: tipoVeiculo,
            possui_patins: false,
            eh_noturno: ehNoturno,
          }),
        });

        const quoteBody = await quoteRes.json();
        console.log("[QUOTE] Response:", JSON.stringify(quoteBody).slice(0, 500));

        if (quoteBody.sucesso && quoteBody.orcamento) {
          quoteResult = quoteBody.orcamento;
        } else {
          console.warn("[QUOTE] Failed:", quoteBody.erro || "Unknown error");
          usedFallback = true;
        }
      } catch (err) {
        console.error("[QUOTE] Error calling calculate-quote:", err);
        usedFallback = true;
      }

      // ── Fallback: cálculo local se calculate-quote falhar ──
      if (usedFallback || !quoteResult) {
        let pricingRows: Array<{ chave: string; valor: number }> = [];
        try {
          const { data: pricingData } = await supabase
            .from('pricing_config')
            .select('chave, valor')
            .eq('ativo', true);
          pricingRows = Array.isArray(pricingData) ? pricingData : [];
        } catch (e) {
          console.warn('[PRICING] Falha ao buscar pricing_config:', e);
        }

        const pricing = resolveDynamicPricing(pricingRows, data.modelo);

        let distanciaIdaKm = pricing.fallbackTotal;
        if (data.coordenadas && data.coordenadas_destino) {
          const haversine = haversineKm(
            data.coordenadas.lat, data.coordenadas.lng,
            data.coordenadas_destino.lat, data.coordenadas_destino.lng
          );
          distanciaIdaKm = Math.max(Math.round(haversine * pricing.fatorCorrecao), 1);
        } else if (data.coordenadas || data.coordenadas_destino) {
          distanciaIdaKm = pricing.fallbackParcial;
        }

        const distanciaTotal = distanciaIdaKm * pricing.fatorIdaVolta;
        const valorKm = distanciaTotal * pricing.custoKm;
        const valorBruto = pricing.taxaBase + valorKm + pricing.adicionalVeiculo;
        const valorTotal = Math.max(Math.round(valorBruto * 100) / 100, pricing.valorMinimo);

        quoteResult = {
          total: valorTotal,
          distancia_km: distanciaIdaKm,
          pedagios: 0,
          taxa_base: pricing.taxaBase,
          custo_km: valorKm,
          adicional_tipo: pricing.adicionalVeiculo,
          adicional_patins: 0,
          adicional_noturno: 0,
          previsao_chegada: null,
        };
      }

      // ── Armazena valores calculados no data ──
      data.distanciaKm = quoteResult.distancia_km;
      data.valorEstimado = quoteResult.total;
      data.pedagios = quoteResult.pedagios || 0;
      data.previsao_chegada = quoteResult.previsao_chegada || null;

      // ── Monta resumo detalhado ──
      const composicaoPreco = [
        `• Taxa base: R$ ${Number(quoteResult.taxa_base || 0).toFixed(2)}`,
        ...(quoteResult.adicional_tipo > 0 ? [`• Adicional do veículo: R$ ${Number(quoteResult.adicional_tipo).toFixed(2)}`] : []),
        `• Custo por km: R$ ${Number(quoteResult.custo_km || 0).toFixed(2)}`,
        ...(quoteResult.pedagios > 0 ? [`• Pedágios (ida+volta): R$ ${Number(quoteResult.pedagios).toFixed(2)}`] : []),
        ...(quoteResult.adicional_patins > 0 ? [`• Adicional patins: R$ ${Number(quoteResult.adicional_patins).toFixed(2)}`] : []),
        ...(quoteResult.adicional_noturno > 0 ? [`• Adicional noturno: R$ ${Number(quoteResult.adicional_noturno).toFixed(2)}`] : []),
      ].join("\n");

      const previsaoTexto = quoteResult.previsao_chegada
        ? `\n⏱️ Previsão de deslocamento: ${formatDuration(quoteResult.previsao_chegada)}`
        : "";

      const resumo =
        `📋 *Resumo do Orçamento*\n\n` +
        `👤 ${data.nome}\n🚗 ${data.tipo_veiculo || "Veículo"} — ${data.marca_veiculo || ""} ${data.modelo_veiculo || ""}\n🔖 Placa: ${data.placa}\n🔧 ${data.motivo}\n` +
        `📍 ${data.origem}\n🏁 ${data.destino}\n` +
        `📏 Distância: ~${Number(quoteResult.distancia_km).toFixed(1)} km\n` +
        (data.observacoes ? `📝 Obs: ${data.observacoes}\n` : "") +
        previsaoTexto +
        `\n💰 *Valor: R$ ${Number(quoteResult.total).toFixed(2)}*\n` +
        composicaoPreco +
        (usedFallback ? "\n\n⚠️ _Valor estimado (sem rota Google)_" : "\n\n✅ _Valor calculado com rota e pedágios reais_");

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
        data = { ...data, ...(created.dataPatch || {}) };
        nextState = created.ok ? "solicitado" : "aguardando_aceite";
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
      if (data._dispatch_manual_required) {
        const lastManualReply = data._last_manual_dispatch_reply
          ? new Date(data._last_manual_dispatch_reply).getTime()
          : 0;
        if (Date.now() - lastManualReply > 60000) {
          responseText = "⚠️ Sua OS já foi criada, mas o acionamento automático está indisponível no momento. Nossa central está seguindo com o despacho manual e vai te atualizar por aqui.";
          data._last_manual_dispatch_reply = new Date().toISOString();
        }
        break;
      }

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
        const lastRedispatch = data._last_redispatch ? new Date(data._last_redispatch).getTime() : 0;
        if (Date.now() - lastRedispatch > 120000) {
          data._last_redispatch = new Date().toISOString();
          responseText = "⏳ Os prestadores anteriores não responderam. Estamos acionando novos prestadores...";

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
        const nota = parseInt(text);
        if (nota >= 1 && nota <= 5) {
          data.nota_satisfacao = nota;
          responseText = `Obrigado pela avaliação! ⭐ Nota: ${nota}/5\n\nPara uma nova solicitação, envie "Oi".`;
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

async function forwardGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = address.trim();
  if (!query) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "OpGrid/1.0", "Accept-Language": "pt-BR" } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  } catch (e) {
    console.warn("[GEO] Forward geocode failed:", e);
  }

  return null;
}

function normalizeVehicleType(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveDynamicPricing(
  pricingRows: Array<{ chave: string; valor: number }> | null | undefined,
  vehicleType: unknown,
) {
  const pc: Record<string, number> = {};
  for (const row of pricingRows || []) {
    pc[row.chave] = Number(row.valor);
  }

  const vehicleText = normalizeVehicleType(vehicleType);
  const isPesado = /caminhao|equipamento|pesad/.test(vehicleText);
  const isUtilitario = /utilitario|van|fiorino|sprinter/.test(vehicleText);

  const taxaBase = pc.taxa_base ?? 120;
  const fatorIdaVolta = pc.fator_ida_volta ?? 2;
  const fatorCorrecao = pc.fator_correcao_rodoviario ?? 1.3;
  const fallbackParcial = pc.distancia_fallback_parcial ?? 20;
  const fallbackTotal = pc.distancia_fallback_total ?? 15;
  const valorMinimo = pc.valor_minimo ?? 80;

  const custoKm = isPesado
    ? (pc.custo_km_pesado ?? pc.custo_km ?? pc.custo_km_padrao ?? 4.5)
    : isUtilitario
      ? (pc.custo_km_utilitario ?? pc.custo_km ?? pc.custo_km_padrao ?? 4.5)
      : (pc.custo_km_padrao ?? pc.custo_km ?? 4.5);

  const adicionalVeiculo = isPesado
    ? (pc.adicional_pesado ?? 0)
    : isUtilitario
      ? (pc.adicional_utilitario ?? 0)
      : 0;

  return {
    taxaBase,
    custoKm,
    fatorIdaVolta,
    fatorCorrecao,
    fallbackParcial,
    fallbackTotal,
    valorMinimo,
    adicionalVeiculo,
  };
}

function formatDuration(duration: string | null): string {
  if (!duration) return "";
  // Google Routes API returns duration like "3600s"
  const match = duration.match(/^(\d+)s$/);
  if (match) {
    const totalSec = parseInt(match[1]);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? m + "min" : ""}`;
    return `${m} min`;
  }
  return duration;
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

async function createSolicitacaoAndDispatch(
  supabase: any,
  conversationId: string,
  data: any,
  phone: string,
  provider: Provider
): Promise<CreateSolicitacaoResult> {
  const cleanPhone = phone.replace(/@c\.us|@s\.whatsapp\.net/g, "").replace(/\D/g, "");
  const now = new Date().toISOString();
  const fallbackProtocol = buildFallbackProtocol(new Date(now));

  const { data: sol, error: solErr } = await insertWithSchemaFallback(supabase, "solicitacoes", {
    protocolo: fallbackProtocol, created_at: now, updated_at: now, data_hora: now,
    canal: "WhatsApp",
    cliente_nome: data.nome || "Cliente não informado",
    cliente_telefone: cleanPhone, cliente_whatsapp: cleanPhone,
    placa: data.placa || null, tipo_veiculo: data.tipo_veiculo || data.modelo || "Veículo não informado",
    marca_veiculo: data.marca_veiculo || null,
    modelo_veiculo: data.modelo_veiculo || null,
    origem_endereco: data.origem || null, destino_endereco: data.destino || null,
    origem_latitude: data.coordenadas?.lat || null, origem_longitude: data.coordenadas?.lng || null,
    destino_latitude: data.coordenadas_destino?.lat || null, destino_longitude: data.coordenadas_destino?.lng || null,
    motivo: data.motivo || "Outro", observacoes: data.observacoes || "",
    distancia_estimada_km: toNum(data.distanciaKm),
    valor: toNum(data.valorEstimado), valor_estimado: toNum(data.valorEstimado),
    status: "pendente", prioridade: "normal", status_proposta: "Aceita",
  }, "*");

  if (solErr || !sol) {
    console.error("[DISPATCH] Error creating solicitacao:", solErr);
    await reply(supabase, cleanPhone, conversationId, "⚠️ Ocorreu um erro ao criar sua OS. Nossa equipe foi notificada.", provider);
    return { ok: false, dispatchStarted: false };
  }

  const protocolo = sol.protocolo || fallbackProtocol;

  const { data: atendimento, error: atErr } = await insertWithSchemaFallback(supabase, "atendimentos", {
    solicitacao_id: sol.id, status: "aberto",
    notas: `OS criada via WhatsApp (${protocolo}) • ${data.motivo || ""} • ${data.origem || ""} → ${data.destino || ""}`,
    created_at: now,
  }, "id");

  const atendimentoId = atendimento?.id || null;
  if (atErr) console.error("[DISPATCH] Atendimento error:", atErr);

  const resultPatch: Record<string, unknown> = {
    protocolo,
    solicitacao_id: sol.id,
    ...(atendimentoId ? { atendimento_id: atendimentoId } : {}),
    _dispatch_started: false,
    _dispatch_manual_required: false,
    _dispatch_error: null,
    _dispatch_last_attempt_at: now,
  };

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
    `👤 Cliente: ${data.nome || "N/I"}\n🚗 ${data.tipo_veiculo || "Veículo"} — ${data.marca_veiculo || ""} ${data.modelo_veiculo || ""}\n` +
    `🔖 Placa: ${data.placa || "N/I"}\n` +
    `🔧 Motivo: ${data.motivo || "Outro"}\n📍 Origem: ${data.origem || "N/I"}\n` +
    `🏁 Destino: ${data.destino || "N/I"}\n` +
    `💰 Valor: R$ ${(Number(data.valorEstimado || 0)).toFixed(2)}\n\n` +
    `⏳ Sua OS foi criada. Vou te avisar assim que o acionamento for confirmado.`;

  await reply(supabase, cleanPhone, conversationId, osMsg, provider);
  await enqueueAutomation(supabase, "order_created", cleanPhone, conversationId, { protocolo, solicitacaoId: sol.id, atendimentoId });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let dispatchStarted = false;
  let dispatchError: string | null = null;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/dispatch-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ solicitacao_id: sol.id, atendimento_id: atendimentoId, conversation_id: conversationId, contact_phone: cleanPhone }),
    });
    const dispatchBody = await res.text();
    if (!res.ok) {
      dispatchError = `dispatch-start ${res.status}: ${dispatchBody.slice(0, 300)}`;
      console.error("[DISPATCH] dispatch-start error:", dispatchError);
    } else {
      dispatchStarted = true;
    }
  } catch (err) {
    dispatchError = String(err);
    console.error("[DISPATCH] dispatch-start call error:", err);
  }

  if (!dispatchStarted) {
    await reply(
      supabase,
      cleanPhone,
      conversationId,
      "⚠️ Sua OS foi criada, mas o acionamento automático está indisponível agora. Nossa central seguirá com o despacho manual e te atualizará por aqui.",
      provider
    );
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/process-queue`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (err) { console.error("[DISPATCH] process-queue error:", err); }

  return {
    ok: true,
    dispatchStarted,
    dataPatch: {
      ...resultPatch,
      _dispatch_started: dispatchStarted,
      _dispatch_manual_required: !dispatchStarted,
      _dispatch_error: dispatchError,
    },
  };
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
