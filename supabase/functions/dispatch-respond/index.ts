import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { offer_id, action, rejection_reason } = await req.json();

    if (!offer_id || !action) {
      return jsonResponse({ error: 'offer_id and action required' }, 400);
    }

    if (!['accept', 'reject'].includes(action)) {
      return jsonResponse({ error: 'action must be accept or reject' }, 400);
    }

    console.log(`[DISPATCH-RESPOND] Offer ${offer_id} → ${action}`);

    const { data: offer, error: offerErr } = await supabase
      .from('dispatch_offers')
      .select(`
        *,
        prestadores(id, nome, telefone),
        solicitacoes(id, cliente_nome, cliente_telefone, origem_endereco, destino_endereco, placa, tipo_veiculo, valor, protocolo, motivo)
      `)
      .eq('id', offer_id)
      .eq('status', 'pending')
      .single();

    if (offerErr || !offer) {
      console.error('[DISPATCH-RESPOND] Pending offer not found:', offerErr);
      return jsonResponse({
        error: 'Oferta não encontrada ou já respondida',
        detail: 'Esta oferta pode ter expirado ou outro prestador já aceitou.',
      }, 409);
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      const atendimentoId = await ensureAtendimento(supabase, offer);

      const { data: acceptedOffer, error: acceptError } = await supabase
        .from('dispatch_offers')
        .update({ status: 'accepted', responded_at: now, atendimento_id: atendimentoId })
        .eq('id', offer_id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (acceptError || !acceptedOffer) {
        console.error('[DISPATCH-RESPOND] Accept failed:', acceptError);
        return jsonResponse({ error: 'Falha ao aceitar — tente novamente' }, acceptError ? 500 : 409);
      }

      // Cancel other pending offers for same solicitação
      await supabase
        .from('dispatch_offers')
        .update({ status: 'cancelled', responded_at: now })
        .eq('solicitacao_id', offer.solicitacao_id)
        .neq('id', offer_id)
        .eq('status', 'pending');

      // Update solicitação status
      await supabase
        .from('solicitacoes')
        .update({
          status: 'Convertida em OS',
          atendimento_id: atendimentoId,
        })
        .eq('id', offer.solicitacao_id);

      // ── IMPORTANT: Update conversation FIRST (before atendimento) ──
      // This prevents the SQL trigger from overwriting prestador_aceito
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, contact_phone, data')
        .eq('solicitacao_id', offer.solicitacao_id)
        .maybeSingle();

      if (conv) {
        const prestadorNome = offer.prestadores?.nome || 'Prestador';
        const prestadorTel = offer.prestadores?.telefone || '';
        const protocolo = offer.solicitacoes?.protocolo || '';
        const mergedData = {
          ...(conv.data || {}),
          prestador_nome: prestadorNome,
          prestador_telefone: prestadorTel,
          atendimento_id: atendimentoId,
          prestador_id: offer.prestador_id,
          _notified_prestador_aceito: false,
        };

        const { error: conversationError } = await supabase
          .from('conversations')
          .update({
            state: 'prestador_aceito',
            data: mergedData,
            atendimento_id: atendimentoId,
          })
          .eq('id', conv.id);

        if (conversationError) {
          console.warn('[DISPATCH-RESPOND] prestador_aceito failed, fallback to solicitado:', conversationError);
          await supabase
            .from('conversations')
            .update({
              state: 'solicitado',
              data: mergedData,
              atendimento_id: atendimentoId,
            })
            .eq('id', conv.id);
        }

        // ── DIRECT WhatsApp notification to client ──
        const clientPhone = conv.contact_phone?.replace(/\D/g, '') || '';
        if (clientPhone) {
          const clientMsg =
            `🎉 *Prestador confirmado!*\n\n` +
            `🚗 O prestador *${prestadorNome}* aceitou seu serviço e está a caminho!\n\n` +
            (protocolo ? `📋 Protocolo: *${protocolo}*\n` : '') +
            (prestadorTel ? `📞 Contato do prestador: ${prestadorTel}\n` : '') +
            `\n⏳ Você será notificado quando ele chegar no local.`;

          await sendWhatsAppDirect(supabase, clientPhone, conv.id, clientMsg);
        }

        await enqueueAutomation(supabase, 'provider_assigned', conv.contact_phone, conv.id, {
          protocolo,
          prestadorNome,
          atendimentoId: atendimentoId,
        });

        await enqueueAutomation(supabase, 'cliente_prestador_confirmado', conv.contact_phone, conv.id, {
          protocolo,
          prestadorNome,
          atendimentoId: atendimentoId,
        });
      }

      const providerPhone = offer.prestadores?.telefone?.replace(/\D/g, '');
      if (providerPhone) {
        await enqueueAutomation(supabase, 'order_assigned', providerPhone, conv?.id || '', {
          protocolo: offer.solicitacoes?.protocolo,
          clienteNome: offer.solicitacoes?.cliente_nome,
        });
      }

      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        await fetch(`${supabaseUrl}/functions/v1/process-queue`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        console.log('[DISPATCH-RESPOND] process-queue triggered');
      } catch (err) {
        console.error('[DISPATCH-RESPOND] Error triggering process-queue:', err);
      }

      return jsonResponse({
        status: 'accepted',
        message: 'Oferta aceita com sucesso!',
        atendimento_id: atendimentoId,
      });
    }

    await supabase
      .from('dispatch_offers')
      .update({
        status: 'rejected',
        responded_at: now,
        rejection_reason: rejection_reason || null,
      })
      .eq('id', offer_id);

    const providerPhone = offer.prestadores?.telefone?.replace(/\D/g, '');
    if (providerPhone) {
      await enqueueAutomation(supabase, 'dispatch_offer_rejected', providerPhone, '', {
        protocolo: offer.solicitacoes?.protocolo,
        prestadorId: offer.prestador_id,
        reason: rejection_reason,
      });
    }

    const { data: pendingOffers } = await supabase
      .from('dispatch_offers')
      .select('id')
      .eq('solicitacao_id', offer.solicitacao_id)
      .eq('round', offer.round)
      .eq('status', 'pending');

    if (!pendingOffers?.length) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, contact_phone')
        .eq('solicitacao_id', offer.solicitacao_id)
        .maybeSingle();

      if (conv) {
        await enqueueAutomation(supabase, 'dispatch_round_expired', conv.contact_phone, conv.id, {
          protocolo: offer.solicitacoes?.protocolo,
          round: offer.round,
        });
      }
    }

    return jsonResponse({
      status: 'rejected',
      message: 'Oferta rejeitada.',
    });
  } catch (err) {
    console.error('[DISPATCH-RESPOND] Error:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

async function ensureAtendimento(supabase: any, offer: any) {
  if (offer.atendimento_id) {
    return offer.atendimento_id;
  }

  const { data: existingAtendimento, error: existingError } = await supabase
    .from('atendimentos')
    .select('id')
    .eq('solicitacao_id', offer.solicitacao_id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingAtendimento?.id) {
    await supabase
      .from('dispatch_offers')
      .update({ atendimento_id: existingAtendimento.id })
      .eq('id', offer.id);

    return existingAtendimento.id;
  }

  const notas = [
    `OS criada via aceite do prestador (${offer.solicitacoes?.protocolo || offer.solicitacao_id?.slice(0, 8) || 'sem protocolo'})`,
    offer.solicitacoes?.motivo ? `Motivo: ${offer.solicitacoes.motivo}` : null,
    offer.solicitacoes?.origem_endereco ? `Origem: ${offer.solicitacoes.origem_endereco}` : null,
    offer.solicitacoes?.destino_endereco ? `Destino: ${offer.solicitacoes.destino_endereco}` : null,
  ].filter(Boolean).join(' • ');

  const { data: createdAtendimento, error: createError } = await supabase
    .from('atendimentos')
    .insert({
      solicitacao_id: offer.solicitacao_id,
      status: 'aberto',
      notas,
    })
    .select('id')
    .single();

  if (createError || !createdAtendimento?.id) {
    throw createError || new Error('Erro ao criar atendimento');
  }

  await supabase
    .from('dispatch_offers')
    .update({ atendimento_id: createdAtendimento.id })
    .eq('id', offer.id);

  return createdAtendimento.id;
}

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
      conversation_id: conversationId || null,
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
  } catch (err) {
    console.error('[AUTOMATION] enqueue error:', err);
  }
}

async function sendWhatsAppDirect(supabase: any, phone: string, conversationId: string, text: string) {
  const INSTANCE_ID = Deno.env.get('WAPI_INSTANCE_ID') || '';
  const TOKEN = Deno.env.get('WAPI_TOKEN') || '';

  try {
    if (INSTANCE_ID && TOKEN) {
      // Send via W-API
      const res = await fetch(
        `https://api.w-api.app/v1/message/send-text?instanceId=${INSTANCE_ID}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message: text }),
        }
      );
      const resBody = await res.text();
      console.log('[DISPATCH-RESPOND] W-API send:', res.status, resBody.slice(0, 200));

      let messageId: string | null = null;
      if (res.ok) {
        try { const p = JSON.parse(resBody); messageId = p.id || p.key?.id || p.messageId || null; } catch {}
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId, direction: 'outbound',
        wa_message_id: messageId, message_type: 'text',
        content: text, status: messageId ? 'sent' : 'pending',
      });
    } else {
      // Fallback: try via whatsapp-send edge function
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: text, conversation_id: conversationId }),
      });
    }
  } catch (err) {
    console.error('[DISPATCH-RESPOND] sendWhatsAppDirect error:', err);
  }
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}