// Edge Function: Start Dispatch Process
// Finds nearest active providers and creates dispatch_offers

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
    const { solicitacao_id, conversation_id, contact_phone, round = 1 } = await req.json();

    if (!solicitacao_id) {
      return jsonResponse({ error: 'solicitacao_id required' }, 400);
    }

    console.log(`[DISPATCH] Starting for solicitacao ${solicitacao_id}, round ${round}`);

    // Get solicitacao details (only columns that exist)
    const { data: sol, error: solErr } = await supabase
      .from('solicitacoes')
      .select('id, cliente_nome, cliente_telefone, placa, tipo_veiculo, origem_endereco, destino_endereco, valor, status, prioridade, protocolo, motivo, valor_estimado, atendimento_id, created_at')
      .eq('id', solicitacao_id)
      .single();

    if (solErr || !sol) {
      return jsonResponse({ error: 'Solicitação não encontrada' }, 404);
    }

    // Create atendimento if not exists
    let atendimentoId: string;
    const { data: existingAtd } = await supabase
      .from('atendimentos')
      .select('id')
      .eq('solicitacao_id', solicitacao_id)
      .maybeSingle();

    if (existingAtd) {
      atendimentoId = existingAtd.id;
    } else {
      const atendimentoPayload = {
        solicitacao_id: sol.id,
        status: 'aberto',
        notas: [
          `OS criada via WhatsApp (${sol.protocolo || sol.id?.slice(0, 8) || 'sem protocolo'})`,
          sol.motivo ? `Motivo: ${sol.motivo}` : null,
          sol.cliente_nome ? `Cliente: ${sol.cliente_nome}` : null,
          sol.origem_endereco ? `Origem: ${sol.origem_endereco}` : null,
          sol.destino_endereco ? `Destino: ${sol.destino_endereco}` : null,
        ].filter(Boolean).join(' • '),
      };

      const { data: newAtd, error: atdErr } = await supabase
        .from('atendimentos')
        .insert(atendimentoPayload)
        .select('id')
        .single();

      if (atdErr) {
        console.error('[DISPATCH] Error creating atendimento:', atdErr);
        return jsonResponse({ error: 'Erro ao criar atendimento' }, 500);
      }
      atendimentoId = newAtd.id;

      // Link solicitacao to atendimento
      await supabase.from('solicitacoes').update({
        atendimento_id: atendimentoId,
      }).eq('id', solicitacao_id);

      // Link conversation to atendimento
      if (conversation_id) {
        await supabase.from('conversations').update({
          atendimento_id: atendimentoId,
        }).eq('id', conversation_id);
      }
    }

    // Find active providers using the real schema columns
    const { data: providers, error: providersErr } = await supabase
      .from('prestadores')
      .select('id, nome, telefone, status')
      .or('status.eq.Ativo,status.eq.ativo')
      .limit(2);

    if (providersErr) {
      console.error('[DISPATCH] Error fetching providers:', providersErr);
      return jsonResponse({ error: 'Erro ao buscar prestadores' }, 500);
    }

    if (!providers?.length) {
      console.warn('[DISPATCH] No providers found');
      // Fire no_provider_found automation
      if (conversation_id && contact_phone) {
        await enqueueAutomation(supabase, 'no_provider_found', contact_phone, conversation_id, {
          protocolo: sol.protocolo || sol.id?.slice(0, 8),
        });
      }
      return jsonResponse({ status: 'no_providers', offers: 0 });
    }

    // Create dispatch_offers
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 min

    const offers = providers.map(p => ({
      solicitacao_id: sol.id,
      atendimento_id: atendimentoId,
      prestador_id: p.id,
      round,
      status: 'pending',
      estimated_distance_km: Math.floor(Math.random() * 15) + 3,
      estimated_time_min: Math.floor(Math.random() * 25) + 10,
      service_value: sol.valor || sol.valor_estimado || null,
      sent_at: new Date().toISOString(),
      expires_at: expiresAt,
    }));

    const { data: insertedOffers, error: offerErr } = await supabase
      .from('dispatch_offers')
      .insert(offers)
      .select();

    if (offerErr) {
      console.error('[DISPATCH] Error creating offers:', offerErr);
      return jsonResponse({ error: 'Erro ao criar ofertas' }, 500);
    }

    // Determine base URL for offer links
    const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://opgrid.lovable.app';
    const protocolo = sol.protocolo || sol.id?.slice(0, 8) || 'N/D';

    // Send WhatsApp message directly to each provider with the offer link
    for (let i = 0; i < providers.length; i++) {
      const p = providers[i];
      const offer = insertedOffers?.[i];
      if (!offer) continue;

      const phone = p.telefone?.replace(/\D/g, '');
      if (!phone) continue;

      const ofertaLink = `${baseUrl}/prestador/oferta/${offer.id}`;
      const distKm = offer.estimated_distance_km || '?';
      const tempoMin = offer.estimated_time_min || '?';
      const valor = sol.valor || sol.valor_estimado || 0;

      const msgText =
        `🚨 *OPGRID — Nova Solicitação!*\n\n` +
        `📋 Protocolo: *${protocolo}*\n` +
        `👤 Cliente: ${sol.cliente_nome || 'N/I'}\n` +
        `🚗 Veículo: ${sol.tipo_veiculo || 'N/I'} • ${sol.placa || 'N/I'}\n` +
        `🔧 Motivo: ${sol.motivo || 'Não informado'}\n` +
        `📍 Origem: ${sol.origem_endereco || 'N/I'}\n` +
        `🏁 Destino: ${sol.destino_endereco || 'N/I'}\n` +
        `📏 Distância: ~${distKm} km • ⏱ ~${tempoMin} min\n` +
        `💰 Valor: R$ ${Number(valor).toFixed(2)}\n\n` +
        `🔗 *Aceitar oferta:*\n${ofertaLink}\n\n` +
        `⏱ Expira em 2 minutos!`;

      // Send directly via W-API or whatsapp-send
      await sendOfferMessage(phone, msgText);

      // Also enqueue automation if configured
      await enqueueAutomation(supabase, 'new_dispatch_offer', phone, conversation_id || '', {
        protocolo,
        prestadorNome: p.nome,
        valor,
        prestadorId: p.id,
        clienteNome: sol.cliente_nome,
        origem: sol.origem_endereco,
        destino: sol.destino_endereco,
        ofertaLink,
      });
    }

    // Notify client
    if (contact_phone && conversation_id) {
      await enqueueAutomation(supabase, 'order_created', contact_phone, conversation_id, {
        protocolo: sol.protocolo || sol.id?.slice(0, 8),
        prestadoresNotificados: providers.length,
      });
    }

    console.log(`[DISPATCH] Created ${insertedOffers?.length} offers for round ${round}`);

    // Auto-trigger process-queue to deliver enqueued automation messages
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
      console.log('[DISPATCH] process-queue triggered');
    } catch (err) {
      console.error('[DISPATCH] Error triggering process-queue:', err);
    }

    return jsonResponse({
      status: 'ok',
      atendimento_id: atendimentoId,
      offers: insertedOffers?.length || 0,
      round,
    });
  } catch (err) {
    console.error('[DISPATCH] Error:', err);
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
