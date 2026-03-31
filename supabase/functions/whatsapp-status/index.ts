// Edge Function: WhatsApp Status Webhook
// Receives delivery status updates from Meta and updates messages + logs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const statuses = Array.isArray(body?.statuses) ? body.statuses : [];

    if (!statuses.length) {
      return jsonResponse({ status: 'no_statuses' });
    }

    let processed = 0;

    for (const status of statuses) {
      const providerMessageId = String(status?.id || '').trim();
      const providerStatus = String(status?.status || '').trim();

      if (!providerMessageId || !providerStatus) {
        continue;
      }

      processed += 1;
      console.log(`[STATUS] ${providerMessageId} → ${providerStatus}`);

      // Update message status
      const { error: msgErr } = await supabase
        .from('messages')
        .update({ status: providerStatus })
        .eq('wa_message_id', providerMessageId);

      if (msgErr) console.error('[STATUS] message update error:', msgErr);

      const { data: logRow, error: logLookupErr } = await supabase
        .from('message_logs')
        .select('queue_id')
        .eq('provider_message_id', providerMessageId)
        .not('queue_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logLookupErr) {
        console.error('[STATUS] queue lookup error:', logLookupErr);
      }

      if (logRow?.queue_id) {
        const nextQueueStatus = ['sent', 'delivered', 'read'].includes(providerStatus)
          ? 'sent'
          : providerStatus === 'failed'
            ? 'failed'
            : 'sending';

        const queuePayload = {
          status: nextQueueStatus,
          sent_at: nextQueueStatus === 'sent' ? new Date().toISOString() : null,
          error_message: nextQueueStatus === 'failed'
            ? (status.errors?.[0]?.message || 'Unknown error')
            : null,
        };

        const { error: queueErr } = await supabase
          .from('message_queue')
          .update(queuePayload)
          .eq('id', logRow.queue_id);

        if (queueErr) console.error('[STATUS] queue update error:', queueErr);
      }

      // Log
      await supabase.from('message_logs').insert({
        queue_id: logRow?.queue_id || null,
        provider_message_id: providerMessageId,
        direction: 'outbound',
        status: providerStatus,
        response_json: status,
      });
    }

    return jsonResponse({ status: 'ok', processed });
  } catch (err) {
    console.error('[STATUS] Error:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}
