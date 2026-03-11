// Edge Function: Send WhatsApp messages via Cloud API
// Proxies send requests to Meta Graph API, keeping token server-side

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

  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v21.0';

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('[SEND] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    return new Response(
      JSON.stringify({ error: 'WhatsApp credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const messagePayload = await req.json();
    console.log('[SEND] Sending to:', messagePayload.to, 'type:', messagePayload.type);

    const metaUrl = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const metaBody = await metaRes.text();
    console.log('[SEND] Meta response:', metaRes.status, metaBody.slice(0, 300));

    if (!metaRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Meta API error', status: metaRes.status, details: metaBody }),
        { status: metaRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metaData = JSON.parse(metaBody);
    return new Response(JSON.stringify(metaData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[SEND] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
