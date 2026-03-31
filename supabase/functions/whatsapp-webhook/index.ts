// Edge Function: WhatsApp Webhook Handler
// Supports both Meta Cloud API and W-API payload formats
// Writes to conversations, messages tables and triggers automation queue

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// ── Detect provider from payload shape ──
type Provider = 'meta' | 'wapi';

interface NormalizedMessage {
  id: string;
  from: string;
  contactName: string;
  type: string;
  content: string;
  raw: any;
  isStatus?: boolean;
  statusValue?: string;
  interactive?: { button_reply?: { id: string; title: string }; list_reply?: { title: string } };
  location?: { latitude: number; longitude: number; address?: string };
}

function detectProvider(body: any): Provider {
  // W-API sends events like { event: "onMessage", ... } or { instanceId: "...", ... }
  if (body.event || body.instanceId || body.data?.key) return 'wapi';
  // Meta sends { object: "whatsapp_business_account", entry: [...] }
  if (body.object === 'whatsapp_business_account' || body.entry) return 'meta';
  // Default to wapi if has data.message
  if (body.data?.message) return 'wapi';
  return 'meta';
}

function normalizeWapiPayload(body: any): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];
  const event = body.event || '';
  const data = body.data || body;

  // Status events
  if (event === 'onMessageStatus' || event === 'message_status') {
    const key = data.key || data;
    const status = data.status || data.ack;
    const statusMap: Record<number, string> = { 0: 'pending', 1: 'sent', 2: 'delivered', 3: 'read' };
    const statusStr = typeof status === 'number' ? (statusMap[status] || 'unknown') : String(status);
    messages.push({
      id: key.id || data.id || '',
      from: (key.remoteJid || '').replace('@s.whatsapp.net', '').replace('@c.us', ''),
      contactName: '',
      type: 'status',
      content: '',
      raw: body,
      isStatus: true,
      statusValue: statusStr,
    });
    return messages;
  }

  // Message events
  if (event === 'onMessage' || event === 'messages.upsert' || !event) {
    const key = data.key || {};
    const phone = (key.remoteJid || data.from || '').replace('@s.whatsapp.net', '').replace('@c.us', '');
    const msgId = key.id || data.id || `wapi_${Date.now()}`;
    const pushName = data.pushName || data.senderName || phone;
    const msg = data.message || {};

    // Determine type and content
    let type = 'text';
    let content = '';
    let interactive: any = undefined;
    let location: any = undefined;

    if (msg.conversation) {
      content = msg.conversation;
    } else if (msg.extendedTextMessage?.text) {
      content = msg.extendedTextMessage.text;
    } else if (msg.imageMessage) {
      type = 'image';
      content = msg.imageMessage.caption || '[Imagem]';
    } else if (msg.videoMessage) {
      type = 'video';
      content = msg.videoMessage.caption || '[Vídeo]';
    } else if (msg.audioMessage) {
      type = 'audio';
      content = '[Áudio]';
    } else if (msg.documentMessage) {
      type = 'document';
      content = msg.documentMessage.fileName || '[Documento]';
    } else if (msg.locationMessage) {
      type = 'location';
      location = {
        latitude: msg.locationMessage.degreesLatitude,
        longitude: msg.locationMessage.degreesLongitude,
        address: msg.locationMessage.address,
      };
      content = `${location.latitude},${location.longitude}`;
    } else if (msg.buttonsResponseMessage) {
      type = 'interactive';
      interactive = {
        button_reply: {
          id: msg.buttonsResponseMessage.selectedButtonId,
          title: msg.buttonsResponseMessage.selectedDisplayText,
        },
      };
      content = msg.buttonsResponseMessage.selectedDisplayText || '';
    } else if (msg.listResponseMessage) {
      type = 'interactive';
      interactive = {
        list_reply: { title: msg.listResponseMessage.title },
      };
      content = msg.listResponseMessage.title || '';
    } else if (data.body || data.text) {
      content = data.body || data.text || '';
    }

    // Skip outgoing messages from ourselves
    if (key.fromMe) return messages;

    messages.push({
      id: msgId,
      from: phone,
      contactName: pushName,
      type,
      content,
      raw: body,
      interactive,
      location,
    });
  }

  return messages;
}

function normalizeMetaPayload(body: any): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];
  const entry = body.entry?.[0];
  if (!entry) return messages;
  const changes = entry.changes?.[0]?.value;
  if (!changes) return messages;

  // Process incoming messages
  if (changes.messages?.length) {
    for (const msg of changes.messages) {
      const contact = changes.contacts?.find((c: any) => c.wa_id === msg.from);
      messages.push({
        id: msg.id,
        from: msg.from,
        contactName: contact?.profile?.name || msg.from,
        type: msg.type,
        content: extractContentMeta(msg),
        raw: msg,
        interactive: msg.interactive,
        location: msg.location,
      });
    }
  }

  // Process status updates
  if (changes.statuses?.length) {
    for (const status of changes.statuses) {
      messages.push({
        id: status.id,
        from: status.recipient_id || '',
        contactName: '',
        type: 'status',
        content: '',
        raw: status,
        isStatus: true,
        statusValue: status.status,
      });
    }
  }

  // Process errors
  if (changes.errors?.length) {
    for (const error of changes.errors) {
      console.error(`[WEBHOOK] Meta error: ${error.code} - ${error.title}`);
    }
  }

  return messages;
}

function extractContentMeta(msg: any): string {
  if (msg.type === 'text') return msg.text?.body || '';
  if (msg.type === 'interactive') {
    return msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
  }
  if (msg.type === 'button') return msg.button?.text || '';
  if (msg.type === 'location') return `${msg.location?.latitude},${msg.location?.longitude}`;
  return '';
}

// ── Main handler ──

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || '';

  // GET — Webhook Verification (Meta challenge)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WEBHOOK] Verification successful');
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    console.error('[WEBHOOK] Verification failed');
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  // POST — Incoming messages & status updates
  if (req.method === 'POST') {
    const supabase = getSupabase();

    try {
      const body = await req.json();
      const provider = detectProvider(body);
      console.log(`[WEBHOOK] Provider: ${provider} | Payload: ${JSON.stringify(body).slice(0, 500)}`);

      const normalized = provider === 'wapi'
        ? normalizeWapiPayload(body)
        : normalizeMetaPayload(body);

      if (!normalized.length) {
        return jsonResponse({ status: 'no_messages', provider });
      }

      for (const nm of normalized) {
        // ── Handle status updates ──
        if (nm.isStatus) {
          console.log(`[WEBHOOK] Status: ${nm.id} → ${nm.statusValue}`);
          await supabase.from('messages')
            .update({ status: nm.statusValue })
            .eq('wa_message_id', nm.id);
          await supabase.from('message_logs').insert({
            provider_message_id: nm.id,
            direction: 'outbound',
            status: nm.statusValue,
            response_json: nm.raw,
          });
          continue;
        }

        // ── Handle incoming messages ──
        const contactPhone = nm.from;
        const contactName = nm.contactName;
        console.log(`[WEBHOOK] Message from ${contactName} (${contactPhone}): type=${nm.type}`);

        // 1. Upsert conversation
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('contact_phone', contactPhone)
          .not('state', 'in', '("cancelado","concluido")')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let conversationId: string;
        let currentState: string;

        if (conv) {
          conversationId = conv.id;
          currentState = conv.state;
          const now = new Date();
          await supabase.from('conversations').update({
            window_opened_at: now.toISOString(),
            window_expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
            updated_at: now.toISOString(),
          }).eq('id', conversationId);
        } else {
          const now = new Date();
          const { data: newConv, error: convErr } = await supabase
            .from('conversations')
            .insert({
              wa_contact_id: contactPhone,
              contact_name: contactName,
              contact_phone: contactPhone,
              state: 'novo_contato',
              data: { nome: contactName, telefone: contactPhone },
              window_opened_at: now.toISOString(),
              window_expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
            })
            .select()
            .single();

          if (convErr) {
            console.error('[WEBHOOK] Error creating conversation:', convErr);
            return jsonResponse({ status: 'error', error: convErr.message });
          }
          conversationId = newConv.id;
          currentState = 'novo_contato';
          await enqueueAutomation(supabase, 'novo_contato', contactPhone, conversationId, { nome: contactName });
        }

        // 2. Store inbound message
        const { error: msgErr } = await supabase.from('messages').upsert({
          conversation_id: conversationId,
          direction: 'inbound',
          wa_message_id: nm.id,
          message_type: nm.type,
          content: nm.content,
          metadata: nm.raw,
          status: 'received',
        }, { onConflict: 'wa_message_id' });

        if (msgErr) console.error('[WEBHOOK] Error storing message:', msgErr);

        // 3. Build a msg-like object for the state machine
        const msgForState: any = {
          id: nm.id,
          from: nm.from,
          type: nm.type,
          text: { body: nm.content },
          interactive: nm.interactive,
          location: nm.location,
        };

        // 4. Process conversation state machine
        await processConversationState(
          supabase, conversationId, currentState, msgForState, contactPhone, contactName, provider
        );

        // 5. Log
        await supabase.from('message_logs').insert({
          conversation_id: conversationId,
          direction: 'inbound',
          provider_message_id: nm.id,
          status: 'received',
          response_json: nm.raw,
        });
      }

      return jsonResponse({ status: 'ok', provider, processed: normalized.length });
    } catch (err) {
      console.error('[WEBHOOK] Parse error:', err);
      return jsonResponse({ error: 'Invalid payload' });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});

// ── Helpers ──

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function extractContent(msg: any): string {
  if (msg.type === 'text') return msg.text?.body || '';
  if (msg.type === 'interactive') {
    return msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
  }
  if (msg.type === 'button') return msg.button?.text || '';
  if (msg.type === 'location') return `${msg.location?.latitude},${msg.location?.longitude}`;
  return '';
}

// ── Conversation State Machine ──

async function processConversationState(
  supabase: any,
  conversationId: string,
  currentState: string,
  msg: any,
  phone: string,
  contactName: string,
  provider: Provider
): Promise<string> {
  const text = extractContent(msg).trim();
  const textLower = text.toLowerCase();

  const { data: conv } = await supabase
    .from('conversations')
    .select('data')
    .eq('id', conversationId)
    .single();

  const data = conv?.data || {};

  // Cancel check
  if (textLower.includes('cancelar') && currentState !== 'novo_contato') {
    await updateConversation(supabase, conversationId, 'cancelado', data);
    await sendResponse(supabase, phone, conversationId, '❌ Solicitação cancelada. Se precisar, é só mandar uma nova mensagem!', provider);
    return 'cancelado';
  }

  let nextState = currentState;
  let responseText = '';

  switch (currentState) {
    case 'novo_contato': {
      responseText =
        `Olá${contactName ? ', ' + contactName.split(' ')[0] : ''}! 👋\n\n` +
        `Sou o assistente da *OpGrid Assistência Veicular*.\n\n` +
        `Vou te ajudar a solicitar um guincho/reboque de forma rápida.\n\n` +
        `Para começar, me diga seu *nome completo*:`;
      nextState = 'aguardando_nome';
      break;
    }

    case 'aguardando_nome': {
      if (text.length < 3) {
        responseText = 'Por favor, informe seu nome completo (mínimo 3 caracteres):';
        break;
      }
      data.nome = text;
      nextState = 'aguardando_veiculo';
      await enqueueAutomation(supabase, 'nome_recebido', phone, conversationId, { nome: text });
      responseText =
        `Obrigado, *${text.split(' ')[0]}*! ✅\n\n` +
        `Agora informe a *placa do veículo*:\n_(Ex: ABC1D23 ou ABC-1234)_`;
      break;
    }

    case 'aguardando_veiculo': {
      const placa = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (placa.length < 7) {
        responseText = '⚠️ Placa inválida. Informe no formato *ABC1D23* ou *ABC-1234*:';
        break;
      }
      data.placa = placa;
      nextState = 'aguardando_origem';
      await enqueueAutomation(supabase, 'veiculo_recebido', phone, conversationId, { placa });
      responseText =
        `🚗 Placa registrada: *${placa}*\n\n` +
        `Agora envie sua *localização atual* 📍\n\n` +
        `Você pode:\n• Compartilhar localização pelo WhatsApp\n• Digitar o endereço completo`;
      break;
    }

    case 'aguardando_origem': {
      if (msg.type === 'location' && msg.location) {
        data.origem = msg.location.address || `${msg.location.latitude}, ${msg.location.longitude}`;
        data.coordenadas = { lat: msg.location.latitude, lng: msg.location.longitude };
      } else {
        if (text.length < 5) {
          responseText = '📍 Por favor, envie um endereço mais detalhado ou compartilhe sua localização:';
          break;
        }
        data.origem = text;
      }
      nextState = 'aguardando_motivo';
      await enqueueAutomation(supabase, 'origem_recebida', phone, conversationId, { origem: data.origem });

      if (provider === 'wapi') {
        // W-API: send text with options listed (no interactive buttons support via proxy)
        responseText =
          '🔧 Qual o *motivo do atendimento*?\n\n' +
          '1️⃣ Pane mecânica\n2️⃣ Pneu furado\n3️⃣ Outro motivo\n\n' +
          '_Responda com o número ou digite o motivo:_';
      } else {
        await sendInteractiveButtons(supabase, phone, conversationId,
          '🔧 Qual o *motivo do atendimento*?',
          [
            { id: 'pane_mecanica', title: 'Pane mecânica' },
            { id: 'pneu_furado', title: 'Pneu furado' },
            { id: 'outro_motivo', title: 'Outro motivo' },
          ],
          'Motivo do atendimento',
          provider
        );
        await updateConversation(supabase, conversationId, nextState, data);
        return nextState;
      }
      break;
    }

    case 'aguardando_motivo': {
      const motivoMap: Record<string, string> = {
        'pane_mecanica': 'Pane mecânica',
        'pneu_furado': 'Pneu furado',
        'outro_motivo': 'Outro',
        '1': 'Pane mecânica',
        '2': 'Pneu furado',
        '3': 'Outro',
      };
      const buttonId = msg.interactive?.button_reply?.id;
      data.motivo = buttonId ? motivoMap[buttonId] || 'Outro' : motivoMap[textLower] || text || 'Outro';
      nextState = 'aguardando_destino';
      await enqueueAutomation(supabase, 'motivo_recebido', phone, conversationId, { motivo: data.motivo });
      responseText =
        `✅ Motivo: *${data.motivo}*\n\nAgora informe o *endereço de destino*:\n_(Para onde o veículo deve ser levado)_`;
      break;
    }

    case 'aguardando_destino': {
      if (text.length < 5) {
        responseText = '🏁 Por favor, informe o endereço de destino com mais detalhes:';
        break;
      }
      data.destino = text;
      nextState = 'aguardando_observacoes';
      await enqueueAutomation(supabase, 'destino_recebido', phone, conversationId, { destino: text });

      if (provider === 'wapi') {
        responseText =
          '📝 Deseja adicionar alguma *observação*?\n_(Ex: veículo rebaixado, rua estreita, etc.)_\n\n' +
          '1️⃣ Sem observações\n2️⃣ Sim, quero informar\n\n_Responda com o número:_';
      } else {
        await sendInteractiveButtons(supabase, phone, conversationId,
          '📝 Deseja adicionar alguma *observação*?\n_(Ex: veículo rebaixado, rua estreita, etc.)_',
          [
            { id: 'sem_obs', title: 'Sem observações' },
            { id: 'com_obs', title: 'Sim, quero informar' },
          ],
          undefined,
          provider
        );
        await updateConversation(supabase, conversationId, nextState, data);
        return nextState;
      }
      break;
    }

    case 'aguardando_observacoes': {
      const buttonId = msg.interactive?.button_reply?.id;
      const isComObs = buttonId === 'com_obs' || textLower === '2';
      const isSemObs = buttonId === 'sem_obs' || textLower === '1';

      if (isComObs) {
        await sendResponse(supabase, phone, conversationId, 'Digite suas observações:', provider);
        await updateConversation(supabase, conversationId, currentState, data);
        return currentState;
      }
      data.observacoes = isSemObs ? '' : text;
      nextState = 'resumo_pronto';
      await enqueueAutomation(supabase, 'observacoes_recebidas', phone, conversationId, { observacoes: data.observacoes });

      const distanciaKm = Math.floor(Math.random() * 30) + 5;
      const valorBase = 120;
      const valorKm = distanciaKm * 4.5;
      const valorTotal = Math.round((valorBase + valorKm) * 100) / 100;
      data.distanciaKm = distanciaKm;
      data.valorEstimado = valorTotal;

      const resumo =
        `📋 *Resumo do Orçamento*\n\n` +
        `👤 ${data.nome}\n🚗 Placa: ${data.placa}\n🔧 ${data.motivo}\n` +
        `📍 ${data.origem}\n🏁 ${data.destino}\n📏 Distância: ~${distanciaKm} km\n` +
        (data.observacoes ? `📝 Obs: ${data.observacoes}\n` : '') +
        `\n💰 *Valor estimado: R$ ${valorTotal.toFixed(2)}*`;

      await sendResponse(supabase, phone, conversationId, resumo, provider);
      await enqueueAutomation(supabase, 'quote_generated', phone, conversationId, { valor: valorTotal });

      nextState = 'aguardando_aceite';

      if (provider === 'wapi') {
        responseText = 'Deseja *confirmar* este atendimento?\n\n1️⃣ ✅ Aceitar\n2️⃣ ❌ Recusar';
      } else {
        await sendInteractiveButtons(supabase, phone, conversationId,
          'Deseja *confirmar* este atendimento?',
          [
            { id: 'aceitar', title: '✅ Aceitar' },
            { id: 'recusar', title: '❌ Recusar' },
          ],
          'Confirmar orçamento',
          provider
        );
        await updateConversation(supabase, conversationId, nextState, data);
        return nextState;
      }
      break;
    }

    case 'aguardando_aceite': {
      const buttonId = msg.interactive?.button_reply?.id;
      const aceite = buttonId === 'aceitar' || textLower === '1' || textLower.includes('sim') || textLower.includes('aceito');
      const recusa = buttonId === 'recusar' || textLower === '2' || textLower.includes('não') || textLower.includes('cancelar');

      if (aceite) {
        nextState = 'solicitado';
        await enqueueAutomation(supabase, 'quote_accepted', phone, conversationId, { valor: data.valorEstimado });
        await sendResponse(supabase, phone, conversationId,
          '✅ *Solicitação confirmada!*\n\nEstamos criando sua OS e localizando o prestador mais próximo...', provider);
        await createSolicitacaoAndDispatch(supabase, conversationId, data, phone, provider);
      } else if (recusa) {
        nextState = 'cancelado';
        await sendResponse(supabase, phone, conversationId,
          '❌ Orçamento recusado. Se mudar de ideia, é só enviar uma nova mensagem!', provider);
      } else {
        responseText = 'Por favor, responda *1* para aceitar ou *2* para recusar o orçamento.';
      }
      break;
    }

    case 'solicitado': {
      responseText = '⏳ Sua OS já está sendo processada! Estamos localizando o prestador mais próximo. Aguarde um momento...';
      break;
    }

    case 'prestador_aceito': {
      responseText = '🚗 O prestador já está a caminho! Se precisar de algo, responda aqui.';
      break;
    }

    case 'em_andamento': {
      responseText = '🔧 Seu atendimento está em andamento. Se tiver alguma urgência, responda aqui.';
      break;
    }

    case 'concluido': {
      responseText = '✅ Este atendimento já foi concluído. Para uma nova solicitação, envie "Oi".';
      break;
    }

    case 'humano': {
      // Conversation handed to human operator — don't auto-respond
      break;
    }

    default:
      responseText = 'Desculpe, não entendi. Pode repetir?';
  }

  if (responseText) {
    await sendResponse(supabase, phone, conversationId, responseText, provider);
  }
  await updateConversation(supabase, conversationId, nextState, data);
  return nextState;
}

async function updateConversation(supabase: any, id: string, state: string, data: any) {
  await supabase.from('conversations').update({
    state,
    data,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
}

// ── Send message — routes to Meta or W-API ──

async function sendResponse(supabase: any, to: string, conversationId: string, text: string, provider: Provider) {
  if (provider === 'wapi') {
    return sendViaWapi(supabase, to, conversationId, text);
  }
  return sendViaMeta(supabase, to, conversationId, text);
}

async function sendViaWapi(supabase: any, to: string, conversationId: string, text: string) {
  const INSTANCE_ID = Deno.env.get('WAPI_INSTANCE_ID') || '';
  const TOKEN = Deno.env.get('WAPI_TOKEN') || '';

  if (!INSTANCE_ID || !TOKEN) {
    console.warn('[SEND-WAPI] Missing credentials — storing message only');
    await storeOutboundMessage(supabase, conversationId, to, text, null);
    return;
  }

  const phone = String(to).replace(/\D/g, '');

  try {
    const res = await fetch(
      `https://api.w-api.app/v1/message/send-text?instanceId=${INSTANCE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, message: text.replace(/\\n/g, '\n') }),
      }
    );
    const resBody = await res.text();
    console.log('[SEND-WAPI] Response:', res.status, resBody.slice(0, 300));

    let messageId: string | null = null;
    if (res.ok) {
      try {
        const parsed = JSON.parse(resBody);
        messageId = parsed.id || parsed.key?.id || parsed.messageId || null;
      } catch {}
    }

    await storeOutboundMessage(supabase, conversationId, to, text, messageId);

    if (!res.ok) {
      console.error('[SEND-WAPI] API error:', res.status, resBody.slice(0, 300));
    }
  } catch (err) {
    console.error('[SEND-WAPI] Error:', err);
    await storeOutboundMessage(supabase, conversationId, to, text, null);
  }
}

async function sendViaMeta(supabase: any, to: string, conversationId: string, text: string) {
  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v21.0';

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('[SEND-META] No credentials — storing message only');
    await storeOutboundMessage(supabase, conversationId, to, text, null);
    return;
  }

  const payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const resBody = await res.text();
    const messageId = res.ok ? JSON.parse(resBody)?.messages?.[0]?.id : null;
    await storeOutboundMessage(supabase, conversationId, to, text, messageId);

    if (!res.ok) {
      console.error('[SEND-META] API error:', res.status, resBody.slice(0, 300));
    }
  } catch (err) {
    console.error('[SEND-META] Error:', err);
    await storeOutboundMessage(supabase, conversationId, to, text, null);
  }
}

async function sendInteractiveButtons(
  supabase: any,
  to: string,
  conversationId: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  headerText?: string,
  provider: Provider = 'meta'
) {
  // W-API doesn't support interactive buttons via Cloud API format,
  // so send as numbered text
  if (provider === 'wapi') {
    const btnText = buttons.map((b, i) => `${i + 1}️⃣ ${b.title}`).join('\n');
    const fullText = `${bodyText}\n\n${btnText}\n\n_Responda com o número:_`;
    return sendViaWapi(supabase, to, conversationId, fullText);
  }

  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v21.0';

  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(headerText ? { header: { type: 'text', text: headerText } } : {}),
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  };

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    await storeOutboundMessage(supabase, conversationId, to, bodyText, null);
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const resBody = await res.text();
    const messageId = res.ok ? JSON.parse(resBody)?.messages?.[0]?.id : null;
    await storeOutboundMessage(supabase, conversationId, to, bodyText, messageId);
  } catch (err) {
    console.error('[SEND] Interactive error:', err);
    await storeOutboundMessage(supabase, conversationId, to, bodyText, null);
  }
}

async function storeOutboundMessage(supabase: any, conversationId: string, to: string, content: string, waMessageId: string | null) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    direction: 'outbound',
    wa_message_id: waMessageId,
    message_type: 'text',
    content,
    status: waMessageId ? 'sent' : 'pending',
  });

  await supabase.from('message_logs').insert({
    conversation_id: conversationId,
    provider_message_id: waMessageId,
    direction: 'outbound',
    status: waMessageId ? 'sent' : 'pending',
  });
}

// ── Automation trigger ──

async function enqueueAutomation(
  supabase: any,
  triggerEvent: string,
  phone: string,
  conversationId: string,
  payload?: Record<string, unknown>
) {
  try {
    const { data: automations } = await supabase
      .from('message_automations')
      .select('*')
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true);

    if (!automations?.length) return;

    const queueItems = automations.map((auto: any) => ({
      conversation_id: conversationId,
      automation_id: auto.id,
      recipient_phone: phone,
      channel: auto.channel,
      template_key: auto.template_key,
      payload_json: { phone, ...payload },
      status: 'pending',
      scheduled_at: auto.delay_seconds > 0
        ? new Date(Date.now() + auto.delay_seconds * 1000).toISOString()
        : new Date().toISOString(),
    }));

    await supabase.from('message_queue').insert(queueItems);

    for (const auto of automations) {
      await supabase.from('message_automations').update({
        executions: (auto.executions || 0) + 1,
        last_executed_at: new Date().toISOString(),
      }).eq('id', auto.id);
    }
  } catch (err) {
    console.error('[AUTOMATION] enqueue error for', triggerEvent, err);
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
  const { data: conversation } = await supabase
    .from('conversations')
    .select('data')
    .eq('id', conversationId)
    .maybeSingle();

  const mergedData = {
    ...(conversation?.data || {}),
    ...(data || {}),
  };

  const now = new Date().toISOString();
  const protocolo = `OS-${Date.now().toString(36).toUpperCase()}`;

  const { data: sol, error: solErr } = await supabase.from('solicitacoes').insert({
    protocolo,
    data_hora: now,
    canal: 'WhatsApp',
    cliente_nome: mergedData.nome || null,
    cliente_telefone: phone,
    cliente_whatsapp: phone,
    placa: mergedData.placa || null,
    tipo_veiculo: mergedData.modelo || 'Veículo não informado',
    origem_endereco: mergedData.origem || null,
    destino_endereco: mergedData.destino || null,
    motivo: mergedData.motivo || 'Outro',
    observacoes: mergedData.observacoes || '',
    distancia_estimada_km: mergedData.distanciaKm || null,
    valor: mergedData.valorEstimado || null,
    status: 'pendente',
    status_proposta: 'Aceita',
  }).select().single();

  if (solErr) {
    console.error('[DISPATCH] Error creating solicitacao:', solErr);
    await sendResponse(supabase, phone, conversationId,
      '⚠️ Ocorreu um erro ao criar sua OS. Nossa equipe foi notificada e entrará em contato.', provider);
    return;
  }

  // Update conversation with solicitacao link
  await supabase.from('conversations').update({
    solicitacao_id: sol.id,
  }).eq('id', conversationId);

  // Send OS confirmation directly to client
  const osConfirmation =
    `📄 *Ordem de Serviço Criada!*\n\n` +
    `📋 Protocolo: *${protocolo}*\n` +
    `👤 Cliente: ${mergedData.nome || 'Não informado'}\n` +
    `🚗 Placa: ${mergedData.placa || 'Não informada'}\n` +
    `🔧 Motivo: ${mergedData.motivo || 'Outro'}\n` +
    `📍 Origem: ${mergedData.origem || 'Não informada'}\n` +
    `🏁 Destino: ${mergedData.destino || 'Não informado'}\n` +
    `💰 Valor: R$ ${(Number(mergedData.valorEstimado || 0)).toFixed(2)}\n\n` +
    `⏳ Estamos acionando os prestadores próximos. Você receberá atualizações aqui!`;

  await sendResponse(supabase, phone, conversationId, osConfirmation, provider);

  // Enqueue automations
  await enqueueAutomation(supabase, 'order_created', phone, conversationId, { protocolo, solicitacaoId: sol.id });
  await enqueueAutomation(supabase, 'new_request', phone, conversationId, { protocolo });

  // Call dispatch-start
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const dispatchRes = await fetch(`${supabaseUrl}/functions/v1/dispatch-start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        solicitacao_id: sol.id,
        conversation_id: conversationId,
        contact_phone: phone,
      }),
    });

    if (!dispatchRes.ok) {
      console.error('[DISPATCH] dispatch-start returned error:', await dispatchRes.text());
    }
  } catch (err) {
    console.error('[DISPATCH] Error calling dispatch-start:', err);
  }

  // Auto-trigger process-queue to send enqueued automation messages
  try {
    await fetch(`${supabaseUrl}/functions/v1/process-queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    console.log('[DISPATCH] process-queue triggered');
  } catch (err) {
    console.error('[DISPATCH] Error triggering process-queue:', err);
  }
}
