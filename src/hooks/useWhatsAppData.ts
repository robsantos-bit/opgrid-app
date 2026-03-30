import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Conversation,
  ConversationState,
  Message,
  DispatchOffer,
  DispatchOfferStatus,
  ConversationData,
} from '@/types/whatsapp';

type JsonMap = Record<string, unknown>;

function mergeConversationData(
  currentData?: ConversationData | JsonMap | null,
  nextData?: Partial<ConversationData> | JsonMap | null
): JsonMap | undefined {
  if (!currentData && !nextData) return undefined;
  return {
    ...(currentData || {}),
    ...(nextData || {}),
  };
}

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
    refetchInterval: 5000,
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
        .maybeSingle();

      if (error) throw error;
      return (data || null) as Conversation | null;
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
        .not('state', 'in', '("solicitado","cancelado","humano")')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data || null) as Conversation | null;
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wa_contact_id,
      contact_name,
      contact_phone,
      state = 'novo_contato' as ConversationState,
      data,
      window_opened_at,
      window_expires_at,
      solicitacao_id,
      atendimento_id,
      assigned_operator_id,
    }: {
      wa_contact_id: string;
      contact_name?: string | null;
      contact_phone: string;
      state?: ConversationState;
      data?: Partial<ConversationData> | JsonMap;
      window_opened_at?: string | null;
      window_expires_at?: string | null;
      solicitacao_id?: string | null;
      atendimento_id?: string | null;
      assigned_operator_id?: string | null;
    }) => {
      const payload = {
        wa_contact_id,
        contact_name: contact_name ?? null,
        contact_phone,
        state,
        data: data ?? {},
        window_opened_at: window_opened_at ?? null,
        window_expires_at: window_expires_at ?? null,
        solicitacao_id: solicitacao_id ?? null,
        atendimento_id: atendimento_id ?? null,
        assigned_operator_id: assigned_operator_id ?? null,
      };

      const { data: created, error } = await supabase
        .from('conversations')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return created as Conversation;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['conversations', created.id] });
      qc.invalidateQueries({
        queryKey: ['conversations', 'phone', created.contact_phone],
      });
    },
  });
}

export function useUpdateConversationState() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      state,
      data,
      currentData,
      window_opened_at,
      window_expires_at,
      solicitacao_id,
      atendimento_id,
      assigned_operator_id,
    }: {
      id: string;
      state: ConversationState;
      data?: Partial<ConversationData> | JsonMap;
      currentData?: ConversationData | JsonMap | null;
      window_opened_at?: string | null;
      window_expires_at?: string | null;
      solicitacao_id?: string | null;
      atendimento_id?: string | null;
      assigned_operator_id?: string | null;
    }) => {
      const updates: Record<string, unknown> = { state };

      const mergedData = mergeConversationData(currentData, data);
      if (mergedData) updates.data = mergedData;
      if (window_opened_at !== undefined) updates.window_opened_at = window_opened_at;
      if (window_expires_at !== undefined) updates.window_expires_at = window_expires_at;
      if (solicitacao_id !== undefined) updates.solicitacao_id = solicitacao_id;
      if (atendimento_id !== undefined) updates.atendimento_id = atendimento_id;
      if (assigned_operator_id !== undefined) {
        updates.assigned_operator_id = assigned_operator_id;
      }

      const { error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id);

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
    mutationFn: async ({
      conversationId,
      operatorId,
    }: {
      conversationId: string;
      operatorId: string;
    }) => {
      const { error } = await supabase
        .from('conversations')
        .update({
          state: 'humano' as ConversationState,
          assigned_operator_id: operatorId,
        })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

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

/**
 * Este hook registra a mensagem na tabela public.messages.
 * Ele NÃO envia a mensagem para um provedor externo por si só.
 */
export function useCreateMessageLog() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      msg: Omit<Message, 'id' | 'created_at'>
    ) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(msg)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['messages', created.conversation_id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Alias para manter compatibilidade com código já existente
export const useSendMessage = useCreateMessageLog;

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

export function useAllDispatchOffers() {
  return useQuery({
    queryKey: ['dispatch_offers', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_offers')
        .select(`
          *,
          prestadores ( id, nome, telefone ),
          solicitacoes ( id, cliente_nome, placa, origem_endereco, destino_endereco )
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DispatchOffer[];
    },
    refetchInterval: 5000,
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
          solicitacoes ( id, cliente_nome, cliente_telefone, cliente_whatsapp, placa, veiculo_placa, tipo_veiculo, veiculo_modelo, origem_endereco, destino_endereco, valor, valor_estimado, created_at, data_hora )
        `)
        .eq('id', id!)
        .maybeSingle();

      if (error) throw error;
      return (data || null) as DispatchOffer | null;
    },
  });
}

export function useCreateDispatchOffer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      solicitacao_id,
      atendimento_id,
      prestador_id,
      round = 1,
      status = 'pending' as DispatchOfferStatus,
      estimated_distance_km,
      estimated_time_min,
      service_value,
      offer_token,
      offer_link,
      sent_at,
      responded_at,
      expires_at,
      rejection_reason,
    }: {
      solicitacao_id: string;
      atendimento_id?: string | null;
      prestador_id: string;
      round?: number;
      status?: DispatchOfferStatus;
      estimated_distance_km?: number | null;
      estimated_time_min?: number | null;
      service_value?: number | null;
      offer_token?: string | null;
      offer_link?: string | null;
      sent_at?: string;
      responded_at?: string | null;
      expires_at?: string | null;
      rejection_reason?: string | null;
    }) => {
      const payload = {
        solicitacao_id,
        atendimento_id: atendimento_id ?? null,
        prestador_id,
        round,
        status,
        estimated_distance_km: estimated_distance_km ?? null,
        estimated_time_min: estimated_time_min ?? null,
        service_value: service_value ?? null,
        offer_token: offer_token ?? null,
        offer_link: offer_link ?? null,
        sent_at: sent_at ?? new Date().toISOString(),
        responded_at: responded_at ?? null,
        expires_at: expires_at ?? null,
        rejection_reason: rejection_reason ?? null,
      };

      const { data, error } = await supabase
        .from('dispatch_offers')
        .insert(payload)
        .select(`
          *,
          prestadores ( id, nome, telefone ),
          solicitacoes ( id, cliente_nome, placa )
        `)
        .single();

      if (error) throw error;
      return data as DispatchOffer;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['dispatch_offers'] });
      qc.invalidateQueries({ queryKey: ['dispatch_offers', created.solicitacao_id] });
      qc.invalidateQueries({ queryKey: ['dispatch_offers', 'detail', created.id] });
    },
  });
}

export function useRespondDispatchOffer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: DispatchOfferStatus;
      rejectionReason?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status,
        responded_at: new Date().toISOString(),
      };

      if (rejectionReason) updates.rejection_reason = rejectionReason;

      const { data, error } = await supabase
        .from('dispatch_offers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DispatchOffer;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['dispatch_offers'] });
      qc.invalidateQueries({ queryKey: ['dispatch_offers', 'detail', updated.id] });
      qc.invalidateQueries({ queryKey: ['dispatch_offers', updated.solicitacao_id] });
      qc.invalidateQueries({ queryKey: ['solicitacoes'] });
      qc.invalidateQueries({ queryKey: ['atendimentos'] });
    },
  });
}
