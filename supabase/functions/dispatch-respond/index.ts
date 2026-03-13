// Edge Function: Handle Provider Dispatch Response
// Processes accept/reject from providers with concurrency control

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
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

    // Get offer with concurrency check — only process if still pending
    const { data: offer, error: offerErr } = await supabase
      .from('dispatch_offers')
      .select('*, prestadores(id, nome, nome_fantasia, telefone), solicitacoes(id, protocolo, cliente_nome, cliente_whatsapp)')
      .eq('id', offer_id)
      .eq('status', 'pending')
      .single();

    if (offerErr || !offer) {
      return jsonResponse({
        error: 'Oferta não encontrada ou já respondida',
        detail: 'Esta oferta pode ter expirado ou outro prestador já aceitou.',
      }, 409);
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // ── ACCEPT ──
      // 1. Update this offer as accepted
      const { error: updateErr } = await supabase
        .from('dispatch_offers')
        .update({ status: 'accepted', responded_at: now })
        .eq('id', offer_id)
        .eq('status', 'pending'); // Idempotency guard

      if (updateErr) {
        return jsonResponse({ error: 'Falha ao aceitar — tente novamente' }, 500);
      }

      // 2. Cancel other pending offers for same solicitacao
      await supabase
        .from('dispatch_offers')
        .update({ status: 'cancelled', responded_at: now })
        .eq('solicitacao_id', offer.solicitacao_id)
        .neq('id', offer_id)
        .eq('status', 'pending');

      // 3. Update atendimento with provider
      if (offer.atendimento_id) {
        await supabase.from('atendimentos').update({
          prestador_id: offer.prestador_id,
          status: 'Em andamento',
        }).eq('id', offer.atendimento_id);
      }

      // 4. Update conversation state
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, contact_phone')
        .eq('solicitacao_id', offer.solicitacao_id)
        .maybeSingle();

      if (conv) {
        await supabase.from('conversations').update({
          state: 'aguardando_aceite',
          assigned_operator_id: offer.prestador_id,
        }).eq('id', conv.id);

        // Notify client
        const prestadorNome = offer.prestadores?.nome_fantasia || offer.prestadores?.nome || 'Prestador';
        await enqueueAutomation(supabase, 'provider_assigned', conv.contact_phone, conv.id, {
          protocolo: offer.solicitacoes?.protocolo,
          prestadorNome,
          atendimentoId: offer.atendimento_id,
        });
      }

      // Notify provider
      const providerPhone = offer.prestadores?.telefone?.replace(/\D/g, '');
      if (providerPhone) {
        await enqueueAutomation(supabase, 'order_assigned', providerPhone, conv?.id || '', {
          protocolo: offer.solicitacoes?.protocolo,
          clienteNome: offer.solicitacoes?.cliente_nome,
        });
      }

      return jsonResponse({
        status: 'accepted',
        message: 'Oferta aceita com sucesso!',
        atendimento_id: offer.atendimento_id,
      });

    } else {
      // ── REJECT ──
      await supabase
        .from('dispatch_offers')
        .update({
          status: 'rejected',
          responded_at: now,
          rejection_reason: rejection_reason || null,
        })
        .eq('id', offer_id);

      // Notify automation
      const providerPhone = offer.prestadores?.telefone?.replace(/\D/g, '');
      if (providerPhone) {
        await enqueueAutomation(supabase, 'dispatch_offer_rejected', providerPhone, '', {
          protocolo: offer.solicitacoes?.protocolo,
          prestadorId: offer.prestador_id,
          reason: rejection_reason,
        });
      }

      // Check if all offers in this round are rejected
      const { data: pendingOffers } = await supabase
        .from('dispatch_offers')
        .select('id')
        .eq('solicitacao_id', offer.solicitacao_id)
        .eq('round', offer.round)
        .eq('status', 'pending');

      if (!pendingOffers?.length) {
        console.log(`[DISPATCH] All offers rejected for round ${offer.round}`);

        // Get conversation for client notification
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

        // Could trigger next round here
        // await fetch(`${supabaseUrl}/functions/v1/dispatch-start`, { ... round: offer.round + 1 });
      }

      return jsonResponse({
        status: 'rejected',
        message: 'Oferta rejeitada.',
      });
    }
  } catch (err) {
    console.error('[DISPATCH-RESPOND] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
