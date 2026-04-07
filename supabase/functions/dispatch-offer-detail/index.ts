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
      const { data: atData, error: atErr } = await supabase
        .from('atendimentos')
        .select(`
          id, status, notas, created_at, finalizado_at, protocolo, solicitacao_id, prestador_id,
          solicitacoes ( id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, observacoes, created_at ),
          prestadores ( id, nome, telefone, latitude, longitude, cidade, uf, endereco )
        `)
        .eq('id', atendimento_id)
        .maybeSingle();

      if (atErr) {
        console.error('[DISPATCH-OFFER-DETAIL] atendimento query error:', atErr);
        return jsonResponse({ error: 'Erro ao carregar atendimento' }, 500);
      }
      if (!atData) {
        return jsonResponse({ error: 'Atendimento não encontrado' }, 404);
      }

      let solicitacao = atData.solicitacoes || null;
      let prestador = atData.prestadores || null;

      // Fallback: fetch solicitacao separately if join returned null
      if (!solicitacao && atData.solicitacao_id) {
        console.log('[DISPATCH-OFFER-DETAIL] solicitacoes join null, fetching separately for', atData.solicitacao_id);
        const { data: solData } = await supabase
          .from('solicitacoes')
          .select('id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, observacoes, created_at')
          .eq('id', atData.solicitacao_id)
          .maybeSingle();
        if (solData) solicitacao = solData;
      }

      // Fallback: fetch prestador separately if join returned null
      if (!prestador && atData.prestador_id) {
        console.log('[DISPATCH-OFFER-DETAIL] prestadores join null, fetching separately for', atData.prestador_id);
        const { data: prData } = await supabase
          .from('prestadores')
          .select('id, nome, telefone, latitude, longitude, cidade, uf, endereco')
          .eq('id', atData.prestador_id)
          .maybeSingle();
        if (prData) prestador = prData;
      }

      // Fallback: if still no solicitacao, try via dispatch_offers
      if (!solicitacao) {
        console.log('[DISPATCH-OFFER-DETAIL] Trying dispatch_offers fallback for atendimento', atendimento_id);
        const { data: offerData } = await supabase
          .from('dispatch_offers')
          .select('solicitacao_id, prestador_id, solicitacoes(id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, observacoes, created_at)')
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
      }

      return jsonResponse({
        atendimento: { ...atData, solicitacoes: solicitacao, prestadores: prestador },
        solicitacao,
        prestador,
      });
    }

    // ---- Fetch by offer_id (Offer view) ----
    if (!offer_id) {
      return jsonResponse({ error: 'offer_id or atendimento_id required' }, 400);
    }

    const { data: offer, error } = await supabase
      .from('dispatch_offers')
      .select(`
        id,
        solicitacao_id,
        atendimento_id,
        prestador_id,
        round,
        status,
        estimated_distance_km,
        estimated_time_min,
        service_value,
        offer_link,
        sent_at,
        responded_at,
        expires_at,
        rejection_reason,
        created_at,
        prestadores ( id, nome, telefone ),
        solicitacoes ( id, cliente_nome, cliente_telefone, placa, tipo_veiculo, origem_endereco, destino_endereco, valor, status, prioridade, protocolo, motivo, created_at )
      `)
      .eq('id', offer_id)
      .maybeSingle();

    if (error) {
      console.error('[DISPATCH-OFFER-DETAIL] Query error:', error);
      return jsonResponse({ error: 'Erro ao carregar oferta' }, 500);
    }

    if (!offer) {
      return jsonResponse({ error: 'Oferta não encontrada' }, 404);
    }

    return jsonResponse({ offer });
  } catch (error) {
    console.error('[DISPATCH-OFFER-DETAIL] Error:', error);
    return jsonResponse({ error: String(error) }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
