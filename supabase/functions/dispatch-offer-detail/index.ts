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
    const body = await req.json();
    const { offer_id, atendimento_id } = body;

    // ---- Fetch by atendimento_id (OS view) ----
    if (atendimento_id) {
      return await handleAtendimento(supabase, atendimento_id);
    }

    // ---- Fetch by offer_id (Offer view) ----
    if (!offer_id) {
      return jsonResponse({ error: 'offer_id or atendimento_id required' }, 400);
    }

    return await handleOffer(supabase, offer_id);
  } catch (error) {
    console.error('[DISPATCH-OFFER-DETAIL] Unhandled error:', error);
    return jsonResponse({
      error: 'SERVICE_FAILED',
      fallback: true,
      details: String(error),
    });
  }
});

async function handleAtendimento(supabase: any, atendimento_id: string) {
  // Try full join first
  const { data: atData, error: atErr } = await supabase
    .from('atendimentos')
    .select(`
      id, status, notas, created_at, finalizado_at, solicitacao_id, prestador_id,
      solicitacoes ( id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, created_at ),
      prestadores ( id, nome, telefone, latitude, longitude, cidade, uf, endereco )
    `)
    .eq('id', atendimento_id)
    .maybeSingle();

  if (atErr) {
    console.error('[DISPATCH-OFFER-DETAIL] atendimento query error:', atErr);
    // Try minimal query as fallback
    const { data: minAt, error: minErr } = await supabase
      .from('atendimentos')
      .select('id, status, notas, created_at, finalizado_at, solicitacao_id, prestador_id')
      .eq('id', atendimento_id)
      .maybeSingle();

    if (minErr || !minAt) {
      return jsonResponse({ error: 'ATENDIMENTO_NOT_FOUND', fallback: true, details: atErr.message });
    }

    // Fetch relations separately
    let solicitacao = null;
    let prestador = null;

    if (minAt.solicitacao_id) {
      const { data } = await supabase
        .from('solicitacoes')
        .select('id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, created_at')
        .eq('id', minAt.solicitacao_id)
        .maybeSingle();
      if (data) solicitacao = data;
    }

    if (minAt.prestador_id) {
      const { data } = await supabase
        .from('prestadores')
        .select('id, nome, telefone, latitude, longitude, cidade, uf, endereco')
        .eq('id', minAt.prestador_id)
        .maybeSingle();
      if (data) prestador = data;
    }

    return jsonResponse({
      atendimento: { ...minAt, solicitacoes: solicitacao, prestadores: prestador },
      solicitacao,
      prestador,
    });
  }

  if (!atData) {
    return jsonResponse({ error: 'Atendimento não encontrado', fallback: true }, 404);
  }

  let solicitacao = atData.solicitacoes || null;
  let prestador = atData.prestadores || null;

  // Fallback: fetch solicitacao separately if join returned null
  if (!solicitacao && atData.solicitacao_id) {
    const { data: solData } = await supabase
      .from('solicitacoes')
      .select('id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, created_at')
      .eq('id', atData.solicitacao_id)
      .maybeSingle();
    if (solData) solicitacao = solData;
  }

  // Fallback: fetch prestador separately if join returned null
  if (!prestador && atData.prestador_id) {
    const { data: prData } = await supabase
      .from('prestadores')
      .select('id, nome, telefone, latitude, longitude, cidade, uf, endereco')
      .eq('id', atData.prestador_id)
      .maybeSingle();
    if (prData) prestador = prData;
  }

  // Fallback: if still no solicitacao, try via dispatch_offers
  if (!solicitacao) {
    try {
      const { data: offerData } = await supabase
        .from('dispatch_offers')
        .select('solicitacao_id, prestador_id, solicitacoes(id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, created_at)')
        .eq('atendimento_id', atendimento_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (offerData?.solicitacoes) {
        solicitacao = offerData.solicitacoes;
      }
      if (!prestador && offerData?.prestador_id) {
        const { data: prData } = await supabase
          .from('prestadores')
          .select('id, nome, telefone, latitude, longitude, cidade, uf, endereco')
          .eq('id', offerData.prestador_id)
          .maybeSingle();
        if (prData) prestador = prData;
      }
    } catch (e) {
      console.warn('[DISPATCH-OFFER-DETAIL] dispatch_offers fallback error:', e);
    }
  }

  return jsonResponse({
    atendimento: { ...atData, solicitacoes: solicitacao, prestadores: prestador },
    solicitacao,
    prestador,
  });
}

async function handleOffer(supabase: any, offer_id: string) {
  // Try full query with joins
  const { data: offer, error } = await supabase
    .from('dispatch_offers')
    .select(`
      id, solicitacao_id, atendimento_id, prestador_id, round, status,
      estimated_distance_km, estimated_time_min, service_value, offer_link,
      sent_at, responded_at, expires_at, rejection_reason, created_at,
      prestadores ( id, nome, telefone, endereco, latitude, longitude, cidade, uf ),
      solicitacoes ( id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, created_at )
    `)
    .eq('id', offer_id)
    .maybeSingle();

  if (error) {
    console.error('[DISPATCH-OFFER-DETAIL] Offer join query error:', error);

    // Fallback: minimal query without joins
    const { data: minOffer, error: minErr } = await supabase
      .from('dispatch_offers')
      .select('id, solicitacao_id, atendimento_id, prestador_id, round, status, estimated_distance_km, estimated_time_min, service_value, offer_link, sent_at, responded_at, expires_at, rejection_reason, created_at')
      .eq('id', offer_id)
      .maybeSingle();

    if (minErr || !minOffer) {
      return jsonResponse({ error: 'OFFER_NOT_FOUND', fallback: true, details: error.message });
    }

    // Fetch relations separately
    let prestador = null;
    let solicitacao = null;

    if (minOffer.prestador_id) {
      const { data } = await supabase
        .from('prestadores')
        .select('id, nome, telefone, endereco, latitude, longitude, cidade, uf')
        .eq('id', minOffer.prestador_id)
        .maybeSingle();
      if (data) prestador = data;
    }

    if (minOffer.solicitacao_id) {
      const { data } = await supabase
        .from('solicitacoes')
        .select('id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, created_at')
        .eq('id', minOffer.solicitacao_id)
        .maybeSingle();
      if (data) solicitacao = data;
    }

    return jsonResponse({ offer: { ...minOffer, prestadores: prestador, solicitacoes: solicitacao } });
  }

  if (!offer) {
    return jsonResponse({ error: 'OFFER_NOT_FOUND', fallback: true }, 404);
  }

  return jsonResponse({ offer });
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
