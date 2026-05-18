self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = {}; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'SUN TO DO', {
      body: data.body || '알림이 도착했어요.',
      icon: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin)) return c.focus();
      }
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('fetch', () => {});
