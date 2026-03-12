import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, ConversationState, Message, DispatchOffer, DispatchOfferStatus } from '@/types/whatsapp';

// ===== CONVERSATIONS =====

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Conversation[];
    },
    refetchInterval: 5000, // polling a cada 5s para updates em tempo real
  });
}

export function useConversation(id: string | null | undefined) {
  return useQuery({
    queryKey: ['conversations', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Conversation;
    },
  });
}

export function useActiveConversationByPhone(phone: string | null | undefined) {
  return useQuery({
    queryKey: ['conversations', 'phone', phone],
    enabled: !!phone,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_phone', phone!)
        .not('state', 'in', '("solicitado","cancelado")')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Conversation | null;
    },
  });
}

export function useUpdateConversationState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, state, data }: { id: string; state: ConversationState; data?: Record<string, unknown> }) => {
      const updates: Record<string, unknown> = { state };
      if (data) updates.data = data;
      const { error } = await supabase.from('conversations').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useAssignOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, operatorId }: { conversationId: string; operatorId: string }) => {
      const { error } = await supabase
        .from('conversations')
        .update({ state: 'humano' as ConversationState, assigned_operator_id: operatorId })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ===== MESSAGES =====

export function useMessages(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Message[];
    },
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: Omit<Message, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(msg)
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
    },
  });
}

// ===== DISPATCH OFFERS =====

export function useDispatchOffers(solicitacaoId: string | null | undefined) {
  return useQuery({
    queryKey: ['dispatch_offers', solicitacaoId],
    enabled: !!solicitacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_offers')
        .select(`
          *,
          prestadores ( id, nome, telefone ),
          solicitacoes ( id, cliente_nome, placa )
        `)
        .eq('solicitacao_id', solicitacaoId!)
        .order('round', { ascending: true })
        .order('sent_at', { ascending: true });
      if (error) throw error;
      return (data || []) as DispatchOffer[];
    },
  });
}

export function useDispatchOfferById(id: string | null | undefined) {
  return useQuery({
    queryKey: ['dispatch_offers', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_offers')
        .select(`
          *,
          prestadores ( id, nome, telefone ),
          solicitacoes ( id, cliente_nome, placa, origem_endereco, destino_endereco )
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as DispatchOffer;
    },
  });
}

export function useRespondDispatchOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: DispatchOfferStatus; rejectionReason?: string }) => {
      const updates: Record<string, unknown> = {
        status,
        responded_at: new Date().toISOString(),
      };
      if (rejectionReason) updates.rejection_reason = rejectionReason;
      const { error } = await supabase.from('dispatch_offers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispatch_offers'] });
    },
  });
}
