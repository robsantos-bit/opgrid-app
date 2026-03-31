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

  const WAPI_INSTANCE_ID = Deno.env.get('WAPI_INSTANCE_ID') || '';
  const WAPI_TOKEN = Deno.env.get('WAPI_TOKEN') || '';
  const META_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const META_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v21.0';

  const useWapi = !!(WAPI_INSTANCE_ID && WAPI_TOKEN);
  const useMeta = !!(META_ACCESS_TOKEN && META_PHONE_NUMBER_ID);

  if (!useWapi && !useMeta) {
    console.error('[SEND] Nenhuma credencial WhatsApp configurada');
    return new Response(
      JSON.stringify({ error: 'WhatsApp credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SEND] Payload recebido:', JSON.stringify(body).slice(0, 500));

    // Suporte a database webhook trigger (payload.record) e chamada direta
    const dados = body.record || body;

    // Extrai provider e destinatário
    const requestedProvider = typeof dados.provider === 'string' ? dados.provider.toLowerCase() : '';
    const provider = (requestedProvider || (useWapi ? 'wapi' : 'meta')) as 'wapi' | 'meta';

    const to = dados.to || dados.recipient_phone || dados.phone || dados.contact_phone || dados.chatId || '';
    const textContent = dados.text?.body || dados.text || dados.message || dados.content || dados.body || '';

    console.log(`[SEND] Provider: ${provider} | To: ${to} | Texto: ${String(textContent).slice(0, 100)}`);

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Destinatário ausente (to/recipient_phone/phone)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase client para logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = (supabaseUrl && supabaseServiceKey)
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    const logMessage = async (payload: {
      provider_message_id: string | null;
      direction: 'outbound';
      status: 'sent' | 'failed';
      response_json: unknown;
    }) => {
      if (!supabase) return;
      const { error } = await supabase.from('message_logs').insert(payload);
      if (error) console.error('[SEND] Falha ao inserir message_logs:', error.message);
    };

    // ── W-API ──
    if (provider === 'wapi') {
      if (!useWapi) {
        return new Response(
          JSON.stringify({ error: 'Credenciais W-API não configuradas' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const phone = String(to).replace(/\D/g, '');
      const text = String(textContent).replace(/\\n/g, '\n');

      const res = await fetch(
        `https://api.w-api.app/v1/message/send-text?instanceId=${WAPI_INSTANCE_ID}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone, message: text }),
        }
      );

      const resBody = await res.text();
      console.log('[SEND-WAPI] Response:', res.status, resBody.slice(0, 300));

      let resData: any = null;
      try { resData = JSON.parse(resBody); } catch {}

      await logMessage({
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

      return new Response(JSON.stringify({ success: true, result: resData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Meta Cloud API ──
    const messagePayload = { ...dados };
    delete messagePayload.provider;
    delete messagePayload.record;

    // Se veio de formato simplificado, montar payload Meta
    if (!messagePayload.messaging_product) {
      messagePayload.messaging_product = 'whatsapp';
      messagePayload.to = String(to).replace(/\D/g, '');
      messagePayload.type = 'text';
      messagePayload.text = { body: String(textContent) };
    }

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

    let metaData: any = null;
    try { metaData = JSON.parse(metaBody); } catch { metaData = { raw: metaBody }; }

    await logMessage({
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

    return new Response(JSON.stringify({ success: true, result: metaData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[SEND] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
