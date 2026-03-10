// Sandbox WhatsApp messaging engine — no external API, all simulated locally

export type SandboxMessageStatus = 'gerada' | 'entregue_simulada' | 'lida_simulada';
export type SandboxMessageType = 'texto' | 'link' | 'template' | 'interativo' | 'midia';
export type SandboxSender = 'sistema' | 'cliente' | 'prestador' | 'central';

export interface SandboxContact {
  id: string;
  nome: string;
  telefone: string;
  tipo: 'cliente' | 'prestador' | 'teste';
  avatar?: string;
}

export interface SandboxMessage {
  id: string;
  contactId: string;
  sender: SandboxSender;
  tipo: SandboxMessageType;
  conteudo: string;
  dataHora: string;
  status: SandboxMessageStatus;
  template?: string;
  metadata?: Record<string, string>;
}

export interface SandboxAutomationLog {
  id: string;
  dataHora: string;
  gatilho: string;
  mensagemId?: string;
  destinatario: string;
  template: string;
  evento: string;
  sucesso: boolean;
  detalhes?: string;
}

const KEYS = {
  contacts: 'opgrid_sandbox_contacts',
  messages: 'opgrid_sandbox_messages',
  logs: 'opgrid_sandbox_logs',
};

// Default test contact
const DEFAULT_TEST_CONTACT: SandboxContact = {
  id: 'contato-teste-principal',
  nome: 'Contato Teste WhatsApp',
  telefone: '5512992184913',
  tipo: 'teste',
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

// ===== CONTACTS =====
export function getSandboxContacts(): SandboxContact[] {
  const contacts = load<SandboxContact[]>(KEYS.contacts, [DEFAULT_TEST_CONTACT]);
  // Ensure default test contact always exists
  if (!contacts.find(c => c.id === DEFAULT_TEST_CONTACT.id)) {
    contacts.unshift(DEFAULT_TEST_CONTACT);
    save(KEYS.contacts, contacts);
  }
  return contacts;
}

export function addSandboxContact(contact: SandboxContact) {
  const all = getSandboxContacts();
  if (!all.find(c => c.id === contact.id)) {
    all.push(contact);
    save(KEYS.contacts, all);
  }
}

export function getOrCreateContact(nome: string, telefone: string, tipo: SandboxContact['tipo']): SandboxContact {
  const contacts = getSandboxContacts();
  const existing = contacts.find(c => c.telefone === telefone);
  if (existing) return existing;
  const newContact: SandboxContact = {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nome,
    telefone,
    tipo,
  };
  contacts.push(newContact);
  save(KEYS.contacts, contacts);
  return newContact;
}

// ===== MESSAGES =====
export function getSandboxMessages(): SandboxMessage[] {
  return load<SandboxMessage[]>(KEYS.messages, []);
}

export function getMessagesForContact(contactId: string): SandboxMessage[] {
  return getSandboxMessages().filter(m => m.contactId === contactId);
}

export function addSandboxMessage(msg: Omit<SandboxMessage, 'id' | 'dataHora' | 'status'>): SandboxMessage {
  const all = getSandboxMessages();
  const newMsg: SandboxMessage = {
    ...msg,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dataHora: new Date().toISOString(),
    status: 'gerada',
  };
  all.push(newMsg);
  save(KEYS.messages, all);

  // Simulate delivery after 500ms, read after 2s
  setTimeout(() => {
    updateMessageStatus(newMsg.id, 'entregue_simulada');
  }, 500);
  setTimeout(() => {
    updateMessageStatus(newMsg.id, 'lida_simulada');
  }, 2000);

  // Dispatch event
  window.dispatchEvent(new CustomEvent('opgrid-sandbox-message', { detail: newMsg }));

  return newMsg;
}

export function updateMessageStatus(msgId: string, status: SandboxMessageStatus) {
  const all = getSandboxMessages();
  const idx = all.findIndex(m => m.id === msgId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], status };
    save(KEYS.messages, all);
    window.dispatchEvent(new CustomEvent('opgrid-sandbox-update'));
  }
}

// ===== AUTOMATION LOGS =====
export function getSandboxLogs(): SandboxAutomationLog[] {
  return load<SandboxAutomationLog[]>(KEYS.logs, []);
}

export function addSandboxLog(log: Omit<SandboxAutomationLog, 'id' | 'dataHora'>): SandboxAutomationLog {
  const all = getSandboxLogs();
  const newLog: SandboxAutomationLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dataHora: new Date().toISOString(),
  };
  all.unshift(newLog);
  save(KEYS.logs, all.slice(0, 200));
  return newLog;
}

// ===== HIGH-LEVEL SEND API =====
// This replaces wa.me links — instead of opening WhatsApp, logs the message internally
export function sandboxSendMessage(
  destinatarioNome: string,
  destinatarioTelefone: string,
  destinatarioTipo: SandboxContact['tipo'],
  conteudo: string,
  options?: {
    sender?: SandboxSender;
    tipo?: SandboxMessageType;
    template?: string;
    evento?: string;
    metadata?: Record<string, string>;
  }
) {
  const contact = getOrCreateContact(destinatarioNome, destinatarioTelefone, destinatarioTipo);
  const msg = addSandboxMessage({
    contactId: contact.id,
    sender: options?.sender || 'sistema',
    tipo: options?.tipo || 'texto',
    conteudo,
    template: options?.template,
    metadata: options?.metadata,
  });
  addSandboxLog({
    gatilho: options?.evento || 'mensagem_manual',
    mensagemId: msg.id,
    destinatario: `${destinatarioNome} (${destinatarioTelefone})`,
    template: options?.template || 'texto_livre',
    evento: options?.evento || 'envio_mensagem',
    sucesso: true,
  });
  return msg;
}

// ===== RESET =====
export function resetSandbox() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

// ===== CONVERSATION THREADS =====
export function getConversationThreads() {
  const contacts = getSandboxContacts();
  const messages = getSandboxMessages();
  return contacts.map(contact => {
    const msgs = messages.filter(m => m.contactId === contact.id);
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    const unread = msgs.filter(m => m.status !== 'lida_simulada' && m.sender === 'sistema').length;
    return { contact, messages: msgs, lastMessage: lastMsg, unread, totalMessages: msgs.length };
  }).filter(t => t.totalMessages > 0).sort((a, b) => {
    const aTime = a.lastMessage?.dataHora || '';
    const bTime = b.lastMessage?.dataHora || '';
    return bTime.localeCompare(aTime);
  });
}
