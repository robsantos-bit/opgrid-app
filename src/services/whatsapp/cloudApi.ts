// WhatsApp Cloud API client — abstraction layer
// In production, calls go through Edge Functions to keep tokens secure
// In dev/hybrid mode, this stores state locally for testing

import {
  SendTextMessage,
  SendInteractiveMessage,
  SendTemplateMessage,
  SendMessageResponse,
  ConversationSession,
  WebhookLog,
  AutomationEvent,
  ConversationStep,
  ConversationData,
  SessionWindowStatus,
} from './types';

const STORAGE_KEYS = {
  sessions: 'opgrid_wa_sessions',
  webhookLogs: 'opgrid_wa_webhook_logs',
  automationEvents: 'opgrid_wa_automation_events',
  config: 'opgrid_wa_config',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ===== EDGE FUNCTION URL BUILDER =====
// When Cloud is enabled, these will point to actual Edge Functions
function getEdgeFunctionUrl(functionName: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectId) {
    return `https://${projectId}.supabase.co/functions/v1/${functionName}`;
  }
  // Fallback: local simulation
  return '';
}

// ===== SEND MESSAGE (via Edge Function or local simulation) =====
export async function sendWhatsAppMessage(
  to: string,
  message: SendTextMessage | SendInteractiveMessage | SendTemplateMessage
): Promise<SendMessageResponse | null> {
  const url = getEdgeFunctionUrl('whatsapp-send');

  if (url) {
    // Production: call Edge Function
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      if (!res.ok) {
        const error = await res.text();
        addWebhookLog({
          direction: 'outgoing',
          type: 'error',
          contactPhone: to,
          payload: JSON.stringify(message),
          level: 'error',
          details: `HTTP ${res.status}: ${error}`,
        });
        return null;
      }
      const data = await res.json();
      addWebhookLog({
        direction: 'outgoing',
        type: 'send',
        contactPhone: to,
        messageId: data.messages?.[0]?.id,
        payload: JSON.stringify(message),
        level: 'info',
      });
      return data;
    } catch (err) {
      addWebhookLog({
        direction: 'outgoing',
        type: 'error',
        contactPhone: to,
        payload: JSON.stringify(message),
        level: 'error',
        details: String(err),
      });
      return null;
    }
  }

  // Local simulation
  const simResponse: SendMessageResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: to, wa_id: to }],
    messages: [{ id: `wamid.sim_${uid()}` }],
  };
  addWebhookLog({
    direction: 'outgoing',
    type: 'send',
    contactPhone: to,
    messageId: simResponse.messages[0].id,
    payload: JSON.stringify(message),
    level: 'info',
    details: '[SIMULAÇÃO LOCAL] Edge Function não configurada',
  });
  return simResponse;
}

// ===== SEND HELPERS =====
export async function sendText(to: string, body: string) {
  const msg: SendTextMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  };
  return sendWhatsAppMessage(to, msg);
}

export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  headerText?: string,
  footerText?: string
) {
  const msg: SendInteractiveMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(headerText ? { header: { type: 'text', text: headerText } } : {}),
      body: { text: bodyText },
      ...(footerText ? { footer: { text: footerText } } : {}),
      action: {
        buttons: buttons.slice(0, 3).map(b => ({
          type: 'reply' as const,
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  };
  return sendWhatsAppMessage(to, msg);
}

export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string = 'pt_BR',
  parameters?: { type: 'text'; text: string }[]
) {
  const msg: SendTemplateMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(parameters
        ? { components: [{ type: 'body', parameters }] }
        : {}),
    },
  };
  return sendWhatsAppMessage(to, msg);
}

// ===== SESSION MANAGEMENT =====
export function getSessions(): ConversationSession[] {
  return load<ConversationSession[]>(STORAGE_KEYS.sessions, []);
}

export function getSession(contactPhone: string): ConversationSession | null {
  return getSessions().find(s => s.contactPhone === contactPhone) || null;
}

export function upsertSession(session: ConversationSession) {
  const all = getSessions();
  const idx = all.findIndex(s => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.push(session);
  save(STORAGE_KEYS.sessions, all);
  window.dispatchEvent(new CustomEvent('opgrid-wa-session-update'));
}

export function createSession(contactPhone: string, contactName: string): ConversationSession {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const session: ConversationSession = {
    id: `session-${uid()}`,
    contactPhone,
    contactName,
    windowOpenedAt: now.toISOString(),
    windowExpiresAt: expires.toISOString(),
    windowStatus: 'open',
    lastMessageAt: now.toISOString(),
    currentStep: 'greeting',
    data: {
      nome: contactName || '',
      telefone: contactPhone,
      placa: '',
      modelo: '',
      localizacao: '',
      motivo: '',
      destino: '',
      observacoes: '',
      valorEstimado: 0,
      distanciaKm: 0,
    },
  };
  upsertSession(session);
  return session;
}

export function getWindowStatus(session: ConversationSession): SessionWindowStatus {
  const now = new Date();
  const expires = new Date(session.windowExpiresAt);
  if (now > expires) return 'closed';
  const remaining = expires.getTime() - now.getTime();
  if (remaining < 60 * 60 * 1000) return 'expiring_soon'; // < 1h
  return 'open';
}

export function refreshWindow(sessionId: string) {
  const all = getSessions();
  const session = all.find(s => s.id === sessionId);
  if (session) {
    const now = new Date();
    session.windowOpenedAt = now.toISOString();
    session.windowExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    session.windowStatus = 'open';
    save(STORAGE_KEYS.sessions, all);
  }
}

// ===== WEBHOOK LOGS =====
export function getWebhookLogs(): WebhookLog[] {
  return load<WebhookLog[]>(STORAGE_KEYS.webhookLogs, []);
}

export function addWebhookLog(log: Omit<WebhookLog, 'id' | 'timestamp'>): WebhookLog {
  const all = getWebhookLogs();
  const newLog: WebhookLog = { ...log, id: `wlog-${uid()}`, timestamp: new Date().toISOString() };
  all.unshift(newLog);
  save(STORAGE_KEYS.webhookLogs, all.slice(0, 500));
  window.dispatchEvent(new CustomEvent('opgrid-wa-log'));
  return newLog;
}

// ===== AUTOMATION EVENTS =====
export function getAutomationEvents(): AutomationEvent[] {
  return load<AutomationEvent[]>(STORAGE_KEYS.automationEvents, []);
}

export function addAutomationEvent(event: Omit<AutomationEvent, 'id' | 'timestamp'>): AutomationEvent {
  const all = getAutomationEvents();
  const newEvent: AutomationEvent = { ...event, id: `evt-${uid()}`, timestamp: new Date().toISOString() };
  all.unshift(newEvent);
  save(STORAGE_KEYS.automationEvents, all.slice(0, 500));
  return newEvent;
}

// ===== RESET =====
export function resetWhatsAppData() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}
