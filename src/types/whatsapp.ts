// ============================================================
// Types alinhados com as tabelas conversations, messages, dispatch_offers
// ============================================================

export type ConversationState =
  | 'novo_contato'
  | 'aguardando_nome'
  | 'aguardando_telefone'
  | 'aguardando_veiculo'
  | 'aguardando_origem'
  | 'aguardando_motivo'
  | 'aguardando_destino'
  | 'aguardando_observacoes'
  | 'resumo_pronto'
  | 'aguardando_aceite'
  | 'solicitado'
  | 'prestador_aceito'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | 'humano';

export type MessageDirection = 'inbound' | 'outbound';

export type DispatchOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

// ===== Conversation =====
export interface ConversationData {
  nome?: string;
  telefone?: string;
  placa?: string;
  modelo?: string;
  origem?: string;
  motivo?: string;
  destino?: string;
  observacoes?: string;
}

export interface Conversation {
  id: string;
  wa_contact_id: string;
  contact_name: string | null;
  contact_phone: string;
  state: ConversationState;
  data: ConversationData;
  window_opened_at: string | null;
  window_expires_at: string | null;
  solicitacao_id: string | null;
  atendimento_id: string | null;
  assigned_operator_id: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Message =====
export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  wa_message_id: string | null;
  message_type: string;
  content: string | null;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
}

// ===== Dispatch Offer =====
export interface DispatchOffer {
  id: string;
  solicitacao_id: string;
  atendimento_id: string | null;
  prestador_id: string;
  round: number;
  status: DispatchOfferStatus;
  estimated_distance_km: number | null;
  estimated_time_min: number | null;
  service_value: number | null;
  offer_link: string | null;
  sent_at: string;
  responded_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  // Joined relations
  prestadores?: { id: string; nome: string; telefone: string } | null;
  solicitacoes?: { id: string; cliente_nome: string; cliente_telefone: string; placa: string; tipo_veiculo: string; origem_endereco: string; destino_endereco: string; valor: number; created_at: string } | null;
}
