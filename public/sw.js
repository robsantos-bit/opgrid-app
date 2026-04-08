// Service Worker for Web Push Notifications - OpGrid Prestador
self.addEventListener('push', (event) => {
  let data = { title: '🚨 Nova Oferta!', body: 'Você recebeu uma nova oferta de serviço.', url: '/prestador' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [500, 200, 500, 200, 500],
    tag: 'oferta-nova',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/prestador' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/prestador';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/prestador') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
