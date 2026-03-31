// Edge Function: Process Message Queue
// Picks pending/scheduled items from message_queue and sends via WhatsApp
// Designed to be called by a cron job or manually

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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v21.0';

  try {
    const now = new Date().toISOString();

    // Fetch pending items whose scheduled_at has passed
    const { data: items, error: fetchErr } = await supabase
      .from('message_queue')
      .select('*, message_templates!message_queue_template_key_fkey(*)')
      .in('status', ['pending', 'scheduled'])
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!items?.length) {
      return jsonResponse({ status: 'empty', processed: 0 });
    }

    console.log(`[QUEUE] Processing ${items.length} items`);

    let sent = 0;
    let failed = 0;

    for (const item of items) {
      // Mark as sending
      await supabase.from('message_queue')
        .update({ status: 'sending' })
        .eq('id', item.id);

      // Resolve template content
      let content = '';
      if (item.message_templates) {
        content = resolveTemplate(item.message_templates.content, item.payload_json || {});
      } else if (item.template_key) {
        // Lookup template by key
        const { data: tmpl } = await supabase
          .from('message_templates')
          .select('content')
          .eq('key', item.template_key)
          .eq('is_active', true)
          .single();
        content = tmpl ? resolveTemplate(tmpl.content, item.payload_json || {}) : '';
      }

      if (!content || !item.recipient_phone) {
        await supabase.from('message_queue').update({
          status: 'failed',
          error_message: !content ? 'Template not found or empty' : 'No recipient phone',
        }).eq('id', item.id);
        failed++;
        continue;
      }

      // Send via Meta API
      if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        // No credentials — mark as sent (simulation mode)
        await supabase.from('message_queue').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }).eq('id', item.id);

        await supabase.from('message_logs').insert({
          queue_id: item.id,
          conversation_id: item.conversation_id,
          direction: 'outbound',
          status: 'simulated',
          response_json: { simulated: true, content },
        });
        sent++;
        continue;
      }

      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: item.recipient_phone,
          type: 'text',
          text: { body: content },
        };

        const res = await fetch(
          `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        const resBody = await res.text();

        if (res.ok) {
          const resData = JSON.parse(resBody);
          const messageId = resData.messages?.[0]?.id;

          await supabase.from('message_queue').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          }).eq('id', item.id);

          await supabase.from('message_logs').insert({
            queue_id: item.id,
            conversation_id: item.conversation_id,
            provider_message_id: messageId,
            direction: 'outbound',
            status: 'sent',
            response_json: resData,
          });

          // Store outbound message
          if (item.conversation_id) {
            await supabase.from('messages').insert({
              conversation_id: item.conversation_id,
              direction: 'outbound',
              wa_message_id: messageId,
              message_type: 'text',
              content,
              status: 'sent',
            });
          }

          sent++;
        } else {
          await supabase.from('message_queue').update({
            status: 'failed',
            error_message: `HTTP ${res.status}: ${resBody.slice(0, 200)}`,
          }).eq('id', item.id);

          await supabase.from('message_logs').insert({
            queue_id: item.id,
            conversation_id: item.conversation_id,
            direction: 'outbound',
            status: 'failed',
            response_json: { error: resBody.slice(0, 500) },
          });
          failed++;
        }
      } catch (err) {
        await supabase.from('message_queue').update({
          status: 'failed',
          error_message: String(err),
        }).eq('id', item.id);
        failed++;
      }
    }

    return jsonResponse({ status: 'ok', processed: items.length, sent, failed });
  } catch (err) {
    console.error('[QUEUE] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function resolveTemplate(content: string, payload: Record<string, unknown>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(payload[key] ?? `{{${key}}}`);
  });
}

function jsonResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
