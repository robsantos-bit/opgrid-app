import { supabase } from '@/integrations/supabase/client';
import type { MessageTemplate, Automation, MessageQueueItem, TriggerEvent } from '@/types/automation';

// ============================================================
// Templates CRUD
// ============================================================

export async function fetchTemplates() {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as MessageTemplate[];
}

export async function upsertTemplate(template: Partial<MessageTemplate> & { key: string; name: string; content: string; trigger_event: string }) {
  const { data, error } = await supabase
    .from('message_templates')
    .upsert(template, { onConflict: 'key' })
    .select()
    .single();
  if (error) throw error;
  return data as MessageTemplate;
}

export async function toggleTemplate(id: string, is_active: boolean) {
  const { error } = await supabase
    .from('message_templates')
    .update({ is_active })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// Automations CRUD
// ============================================================

export async function fetchAutomations() {
  const { data, error } = await supabase
    .from('message_automations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Automation[];
}

export async function upsertAutomation(automation: Partial<Automation> & { name: string; trigger_event: string }) {
  const { data, error } = await supabase
    .from('automations')
    .upsert(automation)
    .select()
    .single();
  if (error) throw error;
  return data as Automation;
}

export async function toggleAutomation(id: string, is_active: boolean) {
  const { error } = await supabase
    .from('automations')
    .update({ is_active })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAutomation(id: string) {
  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// Queue & Dispatch
// ============================================================

export async function enqueueMessage(params: {
  trigger_event: TriggerEvent;
  conversation_id?: string;
  recipient_phone?: string;
  payload?: Record<string, unknown>;
}) {
  // Find active automations for this trigger
  const { data: automations, error: autoErr } = await supabase
    .from('automations')
    .select('*, message_templates!automations_template_key_fkey(*)')
    .eq('trigger_event', params.trigger_event)
    .eq('is_active', true);

  if (autoErr) throw autoErr;
  if (!automations || automations.length === 0) return [];

  const queueItems: Partial<MessageQueueItem>[] = automations.map((auto: any) => ({
    conversation_id: params.conversation_id || null,
    automation_id: auto.id,
    recipient_phone: params.recipient_phone || null,
    channel: auto.channel,
    template_key: auto.template_key,
    payload_json: params.payload || {},
    status: 'pending' as const,
    scheduled_at: auto.delay_seconds > 0
      ? new Date(Date.now() + auto.delay_seconds * 1000).toISOString()
      : new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('message_queue')
    .insert(queueItems)
    .select();

  if (error) throw error;

  // Increment execution counters
  for (const auto of automations) {
    await supabase
      .from('automations')
      .update({
        executions: (auto.executions || 0) + 1,
        last_executed_at: new Date().toISOString(),
      })
      .eq('id', auto.id);
  }

  // Create logs for each queued item
  if (data) {
    const logs = data.map((qi: any) => ({
      queue_id: qi.id,
      conversation_id: qi.conversation_id,
      direction: 'outbound' as const,
      status: 'queued',
    }));
    await supabase.from('message_send_logs').insert(logs);
  }

  return data;
}

// ============================================================
// Queue management
// ============================================================

export async function fetchQueue(limit = 50) {
  const { data, error } = await supabase
    .from('message_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as MessageQueueItem[];
}

export async function fetchSendLogs(limit = 100) {
  const { data, error } = await supabase
    .from('message_send_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
