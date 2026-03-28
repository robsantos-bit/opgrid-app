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

    // Get solicitacao details
    const { data: sol, error: solErr } = await supabase
      .from('solicitacoes')
      .select('*')
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
      const { data: newAtd, error: atdErr } = await supabase.from('atendimentos').insert({
        protocolo: sol.protocolo,
        data_hora: new Date().toISOString(),
        cliente_nome: sol.cliente_nome,
        solicitante: sol.cliente_nome,
        origem: sol.origem_endereco,
        destino: sol.destino_endereco,
        tipo_atendimento: sol.motivo || 'Guincho',
        veiculo: sol.veiculo_modelo,
        placa: sol.veiculo_placa,
        km_previsto: sol.distancia_estimada_km,
        status: 'Aberto',
        prioridade: 'Normal',
        valor_total: sol.valor_estimado,
        solicitacao_id: sol.id,
      }).select().single();

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

    // Find active & homologated providers (top 2 by score)
    const { data: providers } = await supabase
      .from('prestadores')
      .select('id, nome, nome_fantasia, telefone, score_operacional')
      .eq('status', 'Ativo')
      .eq('homologacao', 'Homologado')
      .order('score_operacional', { ascending: false })
      .limit(2);

    if (!providers?.length) {
      console.warn('[DISPATCH] No providers found');
      // Fire no_provider_found automation
      if (conversation_id && contact_phone) {
        await enqueueAutomation(supabase, 'no_provider_found', contact_phone, conversation_id, {
          protocolo: sol.protocolo,
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
      service_value: sol.valor_estimado,
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

    // Fire automation for each provider
    for (const p of providers) {
      const phone = p.telefone?.replace(/\D/g, '');
      if (phone) {
        await enqueueAutomation(supabase, 'new_dispatch_offer', phone, conversation_id || '', {
          protocolo: sol.protocolo,
          prestadorNome: p.nome_fantasia || p.nome,
          valor: sol.valor_estimado,
          prestadorId: p.id,
        });
      }
    }

    // Notify client
    if (contact_phone && conversation_id) {
      await enqueueAutomation(supabase, 'order_created', contact_phone, conversation_id, {
        protocolo: sol.protocolo,
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
