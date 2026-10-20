// Web Push alır ve bildirime dokununca uygulamayı açar. Önbellek yok: uygulama çevrimiçi çalışır.
self.addEventListener('push', (e) => {
  const v = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(v.baslik || 'Risale Takip', {
    body: v.govde,
    icon: 'ikon-192.png',
    data: { url: self.registration.scope + (v.veri && v.veri.ekran ? v.veri.ekran : '') },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((acik) => {
    const p = acik.find((c) => c.url.startsWith(self.registration.scope));
    return p ? p.focus().then(() => p.navigate(e.notification.data.url)) : clients.openWindow(e.notification.data.url);
  }));
});
