import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: 'lead_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from('prestador_leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: 'Lead não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (lead.status_lead === 'convertido_em_prestador') {
      return new Response(JSON.stringify({ error: 'Lead já foi convertido' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Generate a temporary password
    const tempPassword = `OpGrid@${Date.now().toString(36).slice(-6)}`;

    // 3. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: lead.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nome: lead.responsavel,
        origem: 'lead_aprovado',
      },
    });

    if (authErr) {
      return new Response(JSON.stringify({ error: `Erro ao criar usuário: ${authErr.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;

    // 4. Create prestador record
    const { data: prestador, error: prestErr } = await supabase
      .from('prestadores')
      .insert({
        nome_fantasia: lead.nome_fantasia || lead.razao_social,
        razao_social: lead.razao_social,
        documento: lead.documento,
        telefone: lead.telefone,
        email: lead.email,
        responsavel: lead.responsavel,
        cidade: lead.cidade,
        uf: lead.estado,
        endereco: lead.endereco || '',
        cep: lead.cep || '',
        status: 'Ativo',
        plano: 'Básico',
        tipos_servico: lead.servicos_json || [],
        area_cobertura: lead.cobertura_texto || '',
        aceita_noturno: lead.atende_noturno || false,
        aceita_rodoviario: lead.atende_rodovia || false,
        disponibilidade_24h: lead.atendimento_24h || false,
        tipo_parceiro: lead.tipo_principal || 'guincho',
        homologacao: 'Pendente',
        score_operacional: 50,
      })
      .select('id')
      .single();

    if (prestErr) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: `Erro ao criar prestador: ${prestErr.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Create/update profile linking user to prestador
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        nome: lead.responsavel,
        email: lead.email,
        provider_id: prestador.id,
      });

    if (profileErr) {
      console.error('Erro ao criar profile:', profileErr);
    }

    // 6. Assign prestador role
    const { error: roleErr } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'prestador' });

    if (roleErr) {
      console.error('Erro ao atribuir role:', roleErr);
    }

    // 7. Update lead status
    await supabase
      .from('prestador_leads')
      .update({ status_lead: 'convertido_em_prestador', updated_at: new Date().toISOString() })
      .eq('id', lead_id);

    return new Response(JSON.stringify({
      success: true,
      prestador_id: prestador.id,
      user_id: userId,
      email: lead.email,
      temp_password: tempPassword,
      message: `Prestador "${lead.razao_social}" criado com sucesso!`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Erro inesperado:', err);
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
