// Service Worker voor Push Notificaties

// Installatie
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activatie
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push ontvangen
self.addEventListener('push', (event) => {
  let data = {
    title: 'TeamSync',
    body: 'Je hebt een melding',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'teamsync-notification',
    renotify: true,
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Klik op notificatie
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Als de app al open is, focus erop
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Anders open een nieuw venster
      return self.clients.openWindow(url);
    })
  );
});
