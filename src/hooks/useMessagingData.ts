import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MessageTemplate, Automation, MessageQueueItem, MessageSendLog } from '@/types/automation';

// ── Templates ──────────────────────────────────────────────
export function useTemplates() {
  return useQuery({
    queryKey: ['message_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as MessageTemplate[];
    },
  });
}

export function useUpsertTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: Partial<MessageTemplate> & { key: string; name: string; content: string; trigger_event: string }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .upsert(template, { onConflict: 'key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_templates'] }),
  });
}

export function useToggleTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('message_templates').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('message_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_templates'] }),
  });
}

// ── Automations ────────────────────────────────────────────
export function useAutomations() {
  return useQuery({
    queryKey: ['message_automations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_automations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Automation[];
    },
  });
}

export function useUpsertAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (automation: Partial<Automation> & { name: string; trigger_event: string }) => {
      const { data, error } = await supabase
        .from('message_automations')
        .upsert(automation)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_automations'] }),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('message_automations').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_automations'] }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('message_automations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_automations'] }),
  });
}

// ── Queue ──────────────────────────────────────────────────
export function useMessageQueue() {
  return useQuery({
    queryKey: ['message_queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as MessageQueueItem[];
    },
  });
}

// ── Logs ───────────────────────────────────────────────────
export function useMessageLogs() {
  return useQuery({
    queryKey: ['message_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as MessageSendLog[];
    },
  });
}
