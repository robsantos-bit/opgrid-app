// Edge Function: WhatsApp Cloud API Webhook Handler
// Handles GET (verify) and POST (incoming messages/statuses)
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
      console.log('[WEBHOOK] Received:', JSON.stringify(body).slice(0, 500));

      const entry = body.entry?.[0];
      if (!entry) {
        return jsonResponse({ status: 'no_entry' });
      }

      const changes = entry.changes?.[0]?.value;
      if (!changes) {
        return jsonResponse({ status: 'no_changes' });
      }

      // ── Process incoming messages ──
      if (changes.messages?.length) {
        for (const msg of changes.messages) {
          const contact = changes.contacts?.find((c: any) => c.wa_id === msg.from);
          const contactName = contact?.profile?.name || msg.from;
          const contactPhone = msg.from;

          console.log(`[WEBHOOK] Message from ${contactName} (${contactPhone}): type=${msg.type}`);

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
            // Refresh 24h window
            const now = new Date();
            await supabase.from('conversations').update({
              window_opened_at: now.toISOString(),
              window_expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
              updated_at: now.toISOString(),
            }).eq('id', conversationId);
          } else {
            // New conversation
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

            // Fire automation for new contact
            await enqueueAutomation(supabase, 'novo_contato', contactPhone, conversationId, { nome: contactName });
          }

          // 2. Store inbound message (deduplicate by wa_message_id)
          const { error: msgErr } = await supabase.from('messages').upsert({
            conversation_id: conversationId,
            direction: 'inbound',
            wa_message_id: msg.id,
            message_type: msg.type,
            content: extractContent(msg),
            metadata: msg,
            status: 'received',
          }, { onConflict: 'wa_message_id' });

          if (msgErr) console.error('[WEBHOOK] Error storing message:', msgErr);

          // 3. Process conversation state machine
          const nextState = await processConversationState(
            supabase, conversationId, currentState, msg, contactPhone, contactName
          );

          // 4. Log
          await supabase.from('message_logs').insert({
            conversation_id: conversationId,
            direction: 'inbound',
            provider_message_id: msg.id,
            status: 'received',
            response_json: msg,
          });
        }
      }

      // ── Process status updates ──
      if (changes.statuses?.length) {
        for (const status of changes.statuses) {
          console.log(`[WEBHOOK] Status: ${status.id} → ${status.status}`);

          // Update message status
          await supabase.from('messages')
            .update({ status: status.status })
            .eq('wa_message_id', status.id);

          // Log status update
          await supabase.from('message_logs').insert({
            provider_message_id: status.id,
            direction: 'outbound',
            status: status.status,
            response_json: status,
          });
        }
      }

      // ── Process errors ──
      if (changes.errors?.length) {
        for (const error of changes.errors) {
          console.error(`[WEBHOOK] Error: ${error.code} - ${error.title}`);
          await supabase.from('message_logs').insert({
            direction: 'inbound',
            status: 'error',
            response_json: error,
          });
        }
      }

      return jsonResponse({ status: 'ok' });
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

// ── Conversation State Machine (server-side) ──

async function processConversationState(
  supabase: any,
  conversationId: string,
  currentState: string,
  msg: any,
  phone: string,
  contactName: string
): Promise<string> {
  const text = extractContent(msg).trim();
  const textLower = text.toLowerCase();

  // Get current conversation data
  const { data: conv } = await supabase
    .from('conversations')
    .select('data')
    .eq('id', conversationId)
    .single();

  const data = conv?.data || {};

  // Cancel check
  if (textLower.includes('cancelar') && currentState !== 'novo_contato') {
    await updateConversation(supabase, conversationId, 'cancelado', data);
    await sendResponse(supabase, phone, conversationId, '❌ Solicitação cancelada. Se precisar, é só mandar uma nova mensagem!');
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
      // Send interactive buttons via whatsapp-send
      await sendInteractiveButtons(supabase, phone, conversationId,
        '🔧 Qual o *motivo do atendimento*?',
        [
          { id: 'pane_mecanica', title: 'Pane mecânica' },
          { id: 'pneu_furado', title: 'Pneu furado' },
          { id: 'outro_motivo', title: 'Outro motivo' },
        ],
        'Motivo do atendimento'
      );
      await updateConversation(supabase, conversationId, nextState, data);
      return nextState;
    }

    case 'aguardando_motivo': {
      const motivoMap: Record<string, string> = {
        'pane_mecanica': 'Pane mecânica',
        'pneu_furado': 'Pneu furado',
        'outro_motivo': 'Outro',
      };
      const buttonId = msg.interactive?.button_reply?.id;
      data.motivo = buttonId ? motivoMap[buttonId] || 'Outro' : text || 'Outro';
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
      // Send observation buttons
      await sendInteractiveButtons(supabase, phone, conversationId,
        '📝 Deseja adicionar alguma *observação*?\n_(Ex: veículo rebaixado, rua estreita, etc.)_',
        [
          { id: 'sem_obs', title: 'Sem observações' },
          { id: 'com_obs', title: 'Sim, quero informar' },
        ]
      );
      await updateConversation(supabase, conversationId, nextState, data);
      return nextState;
    }

    case 'aguardando_observacoes': {
      const buttonId = msg.interactive?.button_reply?.id;
      if (buttonId === 'com_obs') {
        await sendResponse(supabase, phone, conversationId, 'Digite suas observações:');
        await updateConversation(supabase, conversationId, currentState, data);
        return currentState;
      }
      data.observacoes = buttonId === 'sem_obs' ? '' : text;
      nextState = 'resumo_pronto';
      await enqueueAutomation(supabase, 'observacoes_recebidas', phone, conversationId, { observacoes: data.observacoes });
      // Generate quote
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

      await sendResponse(supabase, phone, conversationId, resumo);
      await enqueueAutomation(supabase, 'quote_generated', phone, conversationId, { valor: valorTotal });

      // Send accept/reject
      nextState = 'aguardando_aceite';
      await sendInteractiveButtons(supabase, phone, conversationId,
        'Deseja *confirmar* este atendimento?',
        [
          { id: 'aceitar', title: '✅ Aceitar' },
          { id: 'recusar', title: '❌ Recusar' },
        ],
        'Confirmar orçamento'
      );
      await updateConversation(supabase, conversationId, nextState, data);
      return nextState;
    }

    case 'aguardando_aceite': {
      const buttonId = msg.interactive?.button_reply?.id;
      const aceite = buttonId === 'aceitar' || textLower.includes('sim') || textLower.includes('aceito');
      const recusa = buttonId === 'recusar' || textLower.includes('não') || textLower.includes('cancelar');

      if (aceite) {
        nextState = 'solicitado';
        await enqueueAutomation(supabase, 'quote_accepted', phone, conversationId, { valor: data.valorEstimado });
        await sendResponse(supabase, phone, conversationId,
          '✅ *Solicitação confirmada!*\n\nEstamos criando sua OS e localizando o prestador mais próximo...');

        // Create solicitacao and trigger dispatch
        await createSolicitacaoAndDispatch(supabase, conversationId, data, phone);
      } else if (recusa) {
        nextState = 'cancelado';
        await sendResponse(supabase, phone, conversationId,
          '❌ Orçamento recusado. Se mudar de ideia, é só enviar uma nova mensagem!');
      } else {
        responseText = 'Por favor, responda *SIM* para aceitar ou *NÃO* para recusar o orçamento.';
      }
      break;
    }

    default:
      responseText = 'Desculpe, não entendi. Pode repetir?';
  }

  if (responseText) {
    await sendResponse(supabase, phone, conversationId, responseText);
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

// ── Send message via whatsapp-send Edge Function ──

async function sendResponse(supabase: any, to: string, conversationId: string, text: string) {
  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v21.0';

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('[SEND] No WhatsApp credentials — storing message only');
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
      console.error('[SEND] Meta API error:', res.status, resBody.slice(0, 300));
    }
  } catch (err) {
    console.error('[SEND] Error:', err);
    await storeOutboundMessage(supabase, conversationId, to, text, null);
  }
}

async function sendInteractiveButtons(
  supabase: any,
  to: string,
  conversationId: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  headerText?: string
) {
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
  phone: string
) {
  const now = new Date().toISOString();
  const protocolo = `OS-${Date.now().toString(36).toUpperCase()}`;

  // Create solicitacao
  const { data: sol, error: solErr } = await supabase.from('solicitacoes').insert({
    protocolo,
    data_hora: now,
    canal: 'WhatsApp',
    cliente_nome: data.nome,
    cliente_telefone: phone,
    cliente_whatsapp: phone,
    veiculo_placa: data.placa,
    veiculo_modelo: data.modelo || 'Veículo',
    origem_endereco: data.origem,
    destino_endereco: data.destino,
    motivo: data.motivo || 'Outro',
    observacoes: data.observacoes || '',
    distancia_estimada_km: data.distanciaKm,
    valor_estimado: data.valorEstimado,
    status: 'Convertida em OS',
    status_proposta: 'Aceita',
  }).select().single();

  if (solErr) {
    console.error('[DISPATCH] Error creating solicitacao:', solErr);
    return;
  }

  // Link conversation to solicitacao
  await supabase.from('conversations').update({
    solicitacao_id: sol.id,
  }).eq('id', conversationId);

  // Fire automations
  await enqueueAutomation(supabase, 'order_created', phone, conversationId, { protocolo, solicitacaoId: sol.id });
  await enqueueAutomation(supabase, 'new_request', phone, conversationId, { protocolo });

  // Start dispatch — invoke dispatch-start Edge Function
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    await fetch(`${supabaseUrl}/functions/v1/dispatch-start`, {
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
  } catch (err) {
    console.error('[DISPATCH] Error calling dispatch-start:', err);
  }
}
