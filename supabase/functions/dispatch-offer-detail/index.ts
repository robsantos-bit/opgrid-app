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
    const { offer_id } = await req.json();

    if (!offer_id) {
      return jsonResponse({ error: 'offer_id required' }, 400);
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
        solicitacoes ( id, protocolo, cliente_nome, cliente_telefone, placa, tipo_veiculo, origem_endereco, destino_endereco, valor, created_at )
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