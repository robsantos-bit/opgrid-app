// ===== WhatsApp Cloud API Types =====
// Ready for official Meta integration — no BSP

// --- Config ---
export interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
  apiVersion: string; // e.g. 'v21.0'
}

// --- Webhook Incoming ---
export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: WebhookValue;
  field: string;
}

export interface WebhookValue {
  messaging_product: 'whatsapp';
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: WebhookContact[];
  messages?: IncomingMessage[];
  statuses?: MessageStatus[];
  errors?: WebhookError[];
}

export interface WebhookContact {
  profile: { name: string };
  wa_id: string;
}

export interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'location' | 'interactive' | 'button';
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; filename: string; mime_type: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
  button?: { text: string; payload: string };
  context?: { from: string; id: string };
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: WebhookError[];
}

export interface WebhookError {
  code: number;
  title: string;
  message: string;
  error_data?: { details: string };
}

// --- Outgoing Messages ---
export interface SendTextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { preview_url?: boolean; body: string };
}

export interface SendTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components?: TemplateComponent[];
  };
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: TemplateParameter[];
  sub_type?: string;
  index?: number;
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  image?: { link: string };
}

export interface SendInteractiveMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button' | 'list';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: InteractiveAction;
  };
}

export interface InteractiveAction {
  buttons?: InteractiveButton[];
  button?: string;
  sections?: InteractiveSection[];
}

export interface InteractiveButton {
  type: 'reply';
  reply: { id: string; title: string };
}

export interface InteractiveSection {
  title: string;
  rows: { id: string; title: string; description?: string }[];
}

// --- Send API Response ---
export interface SendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

// --- Session / Window ---
export type SessionWindowStatus = 'open' | 'closed' | 'expiring_soon';

export interface ConversationSession {
  id: string;
  contactPhone: string;
  contactName: string;
  windowOpenedAt: string; // ISO
  windowExpiresAt: string; // ISO +24h
  windowStatus: SessionWindowStatus;
  lastMessageAt: string;
  currentStep: ConversationStep;
  data: ConversationData;
  solicitacaoId?: string;
  atendimentoId?: string;
  despachoId?: string;
}

// --- Conversation Engine ---
export type ConversationStep =
  | 'greeting'
  | 'collect_nome'
  | 'collect_telefone'
  | 'collect_placa'
  | 'collect_localizacao'
  | 'collect_motivo'
  | 'collect_destino'
  | 'collect_observacoes'
  | 'resumo'
  | 'orcamento'
  | 'aguardando_aceite'
  | 'aceite_confirmado'
  | 'criando_os'
  | 'despacho'
  | 'aguardando_prestador'
  | 'prestador_confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado';

export interface ConversationData {
  nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  localizacao: string;
  coordenadas?: { lat: number; lng: number };
  motivo: string;
  destino: string;
  observacoes: string;
  valorEstimado: number;
  distanciaKm: number;
}

// --- Webhook Log ---
export type WebhookLogLevel = 'info' | 'warning' | 'error';

export interface WebhookLog {
  id: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  type: 'message' | 'status' | 'webhook_verify' | 'send' | 'error';
  contactPhone?: string;
  contactName?: string;
  messageId?: string;
  payload: string; // JSON stringified
  level: WebhookLogLevel;
  details?: string;
}

// --- Automation Event ---
export interface AutomationEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  step: ConversationStep;
  action: string;
  success: boolean;
  details?: string;
}
