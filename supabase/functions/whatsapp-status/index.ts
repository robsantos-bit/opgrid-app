// Edge Function: WhatsApp Status Webhook
// Receives delivery status updates from Meta and updates messages + logs

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
    const { statuses } = await req.json();

    if (!statuses?.length) {
      return new Response(JSON.stringify({ status: 'no_statuses' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const status of statuses) {
      console.log(`[STATUS] ${status.id} → ${status.status}`);

      // Update message status
      const { error: msgErr } = await supabase
        .from('messages')
        .update({ status: status.status })
        .eq('wa_message_id', status.id);

      if (msgErr) console.error('[STATUS] message update error:', msgErr);

      // Update queue item if exists
      if (status.status === 'delivered' || status.status === 'read') {
        await supabase
          .from('message_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('status', 'sending');
      }

      if (status.status === 'failed') {
        const errorMsg = status.errors?.[0]?.message || 'Unknown error';
        await supabase
          .from('message_queue')
          .update({ status: 'failed', error_message: errorMsg })
          .eq('status', 'sending');
      }

      // Log
      await supabase.from('message_logs').insert({
        provider_message_id: status.id,
        direction: 'outbound',
        status: status.status,
        response_json: status,
      });
    }

    return new Response(JSON.stringify({ status: 'ok', processed: statuses.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[STATUS] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
