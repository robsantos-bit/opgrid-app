// Simulated push notification system using localStorage events
export interface AppNotification {
  id: string;
  type: 'oferta_aceita' | 'oferta_recusada' | 'status_update' | 'solicitacao_nova';
  title: string;
  message: string;
  solicitacaoId: string;
  prestadorNome?: string;
  timestamp: string;
  read: boolean;
}

const NOTIF_KEY = 'opgrid_notifications';

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
  const all = getNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  all.unshift(newNotif);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all.slice(0, 50)));
  // Dispatch custom event for cross-component communication
  window.dispatchEvent(new CustomEvent('opgrid-notification', { detail: newNotif }));
  return newNotif;
}

export function markAllRead() {
  const all = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}
