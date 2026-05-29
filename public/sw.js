self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = {}; }
  event.waitUntil(
    self.registration.showNotification(data.title || '알림이 도착했어요', {
      body: data.body || '',
      icon: '/icon-192.png',
      data: { action: data.action || '' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const action = event.notification.data?.action || '';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin)) {
          if (action) c.postMessage({ action });
          return c.focus();
        }
      }
      return clients.openWindow(action ? `/?action=${action}` : '/');
    })
  );
});

self.addEventListener('fetch', () => {});
