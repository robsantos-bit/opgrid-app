// Edge Function: Send WhatsApp messages
// Supports both Meta Cloud API and W-API
// Auto-detects provider based on available credentials

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
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Detect provider: if W-API credentials exist, prefer W-API
  const WAPI_INSTANCE_ID = Deno.env.get('WAPI_INSTANCE_ID') || '';
  const WAPI_TOKEN = Deno.env.get('WAPI_TOKEN') || '';
  const META_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const META_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v21.0';

  const useWapi = !!(WAPI_INSTANCE_ID && WAPI_TOKEN);
  const useMeta = !!(META_ACCESS_TOKEN && META_PHONE_NUMBER_ID);

  if (!useWapi && !useMeta) {
    console.error('[SEND] No WhatsApp credentials configured (neither W-API nor Meta)');
    return new Response(
      JSON.stringify({ error: 'WhatsApp credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    // Allow explicit provider selection
    const provider = body.provider || (useWapi ? 'wapi' : 'meta');
    const to = body.to || body.chatId;

    console.log(`[SEND] Provider: ${provider} | To: ${to} | Type: ${body.type || 'text'}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (provider === 'wapi') {
      // ── W-API Send ──
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const text = body.text?.body || body.text || body.message || '';

      const res = await fetch(
        `https://api.w-api.app/v2/${WAPI_INSTANCE_ID}/messages/send-text`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId, text }),
        }
      );

      const resBody = await res.text();
      console.log('[SEND-WAPI] Response:', res.status, resBody.slice(0, 300));

      let resData: any = null;
      try { resData = JSON.parse(resBody); } catch {}

      await supabase.from('message_logs').insert({
        provider_message_id: resData?.id || resData?.key?.id || null,
        direction: 'outbound',
        status: res.ok ? 'sent' : 'failed',
        response_json: res.ok ? resData : { error: resBody.slice(0, 500) },
      });

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: 'W-API error', status: res.status, details: resBody }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(resData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // ── Meta Cloud API Send ──
      const messagePayload = { ...body };
      delete messagePayload.provider;

      const metaUrl = `https://graph.facebook.com/${API_VERSION}/${META_PHONE_NUMBER_ID}/messages`;

      const metaRes = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      const metaBody = await metaRes.text();
      console.log('[SEND-META] Response:', metaRes.status, metaBody.slice(0, 300));

      const metaData = metaRes.ok ? JSON.parse(metaBody) : null;

      await supabase.from('message_logs').insert({
        provider_message_id: metaData?.messages?.[0]?.id || null,
        direction: 'outbound',
        status: metaRes.ok ? 'sent' : 'failed',
        response_json: metaRes.ok ? metaData : { error: metaBody.slice(0, 500) },
      });

      if (!metaRes.ok) {
        return new Response(
          JSON.stringify({ error: 'Meta API error', status: metaRes.status, details: metaBody }),
          { status: metaRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(metaData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('[SEND] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
