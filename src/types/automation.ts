// Automation Engine Types

export type AutomationChannel = 'whatsapp' | 'email' | 'sms' | 'push' | 'internal';
export type AutomationAudience = 'cliente' | 'prestador' | 'interno';
export type QueueStatus = 'pending' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export interface MessageTemplate {
  id: string;
  key: string;
  name: string;
  channel: AutomationChannel;
  audience: AutomationAudience;
  trigger_event: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger_event: string;
  channel: AutomationChannel;
  template_key: string | null;
  is_active: boolean;
  delay_seconds: number;
  executions: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  template?: MessageTemplate;
}

export interface MessageQueueItem {
  id: string;
  conversation_id: string | null;
  automation_id: string | null;
  recipient_phone: string | null;
  channel: AutomationChannel;
  template_key: string | null;
  payload_json: Record<string, unknown>;
  status: QueueStatus;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface MessageSendLog {
  id: string;
  queue_id: string | null;
  conversation_id: string | null;
  provider_message_id: string | null;
  direction: 'inbound' | 'outbound';
  status: string;
  response_json: Record<string, unknown>;
  created_at: string;
}

// All trigger events used in the system
export const TRIGGER_EVENTS = {
  // Cliente
  novo_contato: 'Novo contato',
  nome_recebido: 'Nome recebido',
  telefone_recebido: 'Telefone recebido',
  veiculo_recebido: 'Veículo recebido',
  origem_recebida: 'Origem recebida',
  motivo_recebido: 'Motivo recebido',
  destino_recebido: 'Destino recebido',
  observacoes_recebidas: 'Observações recebidas',
  quote_generated: 'Orçamento gerado',
  quote_accepted: 'Orçamento aceito',
  order_created: 'OS criada',
  provider_assigned: 'Prestador atribuído',
  provider_arrived: 'Prestador chegou',
  service_completed: 'Atendimento concluído',
  // Prestador
  new_dispatch_offer: 'Nova oferta de despacho',
  dispatch_offer_accepted: 'Oferta aceita',
  dispatch_offer_rejected: 'Oferta rejeitada',
  dispatch_offer_expired: 'Oferta expirada',
  order_assigned: 'OS atribuída',
  checklist_pending: 'Checklist pendente',
  // Interno
  new_conversation: 'Nova conversa',
  new_request: 'Nova solicitação',
  no_provider_found: 'Nenhum prestador encontrado',
  dispatch_round_expired: 'Rodada de despacho expirada',
  provider_rejected: 'Prestador rejeitou',
  critical_service: 'Serviço crítico',
} as const;

export type TriggerEvent = keyof typeof TRIGGER_EVENTS;
