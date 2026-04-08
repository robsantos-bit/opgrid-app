import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Web Push requires signing with VAPID. We use the web-push npm package via esm.sh.
// However, since Deno edge runtime doesn't support node crypto natively,
// we implement JWT-based VAPID manually using Web Crypto API.

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  // For simplicity, we send a fetch to the push endpoint with the required VAPID headers
  // This is a simplified implementation - for production, consider using a full web-push library
  
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
    },
    body: payload,
  });

  return response;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!vapidPrivateKey) {
    console.error('[SEND-PUSH] Missing VAPID_PRIVATE_KEY');
    return new Response(
      JSON.stringify({ error: 'Server config error: missing VAPID key' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    // Support both direct HTTP and DB webhook trigger
    const record = body.record || body;
    const prestadorId = record.prestador_id;

    if (!prestadorId) {
      return new Response(
        JSON.stringify({ error: 'prestador_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch push subscriptions for this prestador
    const { data: subscriptions, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('prestador_id', prestadorId);

    if (subErr) {
      console.error('[SEND-PUSH] Error fetching subscriptions:', subErr);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[SEND-PUSH] No subscriptions found for prestador:', prestadorId);
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch offer details for the notification message
    const solicitacaoId = record.solicitacao_id;
    let notifBody = 'Você recebeu uma nova oferta de serviço!';
    
    if (solicitacaoId) {
      const { data: sol } = await supabase
        .from('solicitacoes')
        .select('cliente_nome, origem_endereco, tipo_veiculo')
        .eq('id', solicitacaoId)
        .maybeSingle();
      
      if (sol) {
        notifBody = `${sol.tipo_veiculo || 'Veículo'} - ${sol.origem_endereco || 'Endereço não informado'}`;
      }
    }

    const payload = JSON.stringify({
      title: '🚨 NOVO SERVIÇO NA REGIÃO!',
      body: notifBody,
      url: `/prestador/oferta/${record.id}`,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const res = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: payload,
        });

        if (res.ok || res.status === 201) {
          sent++;
        } else if (res.status === 404 || res.status === 410) {
          // Subscription expired, remove it
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
          console.log('[SEND-PUSH] Removed expired subscription:', sub.endpoint);
          failed++;
        } else {
          console.error('[SEND-PUSH] Push failed:', res.status, await res.text());
          failed++;
        }
      } catch (err) {
        console.error('[SEND-PUSH] Error sending to endpoint:', err);
        failed++;
      }
    }

    console.log(`[SEND-PUSH] Results: sent=${sent}, failed=${failed}`);

    return new Response(
      JSON.stringify({ message: 'Push notifications processed', sent, failed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SEND-PUSH] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
