// Edge Function: WhatsApp Cloud API Webhook Handler
// Handles GET (verify) and POST (incoming messages/statuses)
// Deploy: will work once Lovable Cloud / Supabase is enabled

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || '';
  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';

  // GET — Webhook Verification (Meta challenge)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WEBHOOK] Verification successful');
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }

    console.error('[WEBHOOK] Verification failed — token mismatch');
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  // POST — Incoming messages & status updates
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('[WEBHOOK] Received:', JSON.stringify(body).slice(0, 500));

      const entry = body.entry?.[0];
      if (!entry) {
        return new Response(JSON.stringify({ status: 'no_entry' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const changes = entry.changes?.[0]?.value;
      if (!changes) {
        return new Response(JSON.stringify({ status: 'no_changes' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Process messages
      if (changes.messages?.length) {
        for (const msg of changes.messages) {
          const contact = changes.contacts?.find((c: any) => c.wa_id === msg.from);
          const contactName = contact?.profile?.name || msg.from;

          console.log(`[WEBHOOK] Message from ${contactName} (${msg.from}): type=${msg.type}`);

          // TODO: Forward to conversation engine via internal API or direct DB write
          // In production, this would:
          // 1. Store the message in the database
          // 2. Trigger the conversation engine
          // 3. Send response via whatsapp-send function
        }
      }

      // Process status updates
      if (changes.statuses?.length) {
        for (const status of changes.statuses) {
          console.log(`[WEBHOOK] Status: ${status.id} → ${status.status}`);
          // TODO: Update message status in database
        }
      }

      // Process errors
      if (changes.errors?.length) {
        for (const error of changes.errors) {
          console.error(`[WEBHOOK] Error: ${error.code} - ${error.title}: ${error.message}`);
        }
      }

      // Always respond 200 to Meta
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[WEBHOOK] Parse error:', err);
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 200, // Still 200 to avoid Meta retries
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
