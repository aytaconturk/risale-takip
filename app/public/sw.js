// Web Push alır ve bildirime dokununca uygulamayı açar. Uygulama çevrimiçi çalışır;
// önbellekte yalnızca adı hash'li (değişmeyen) derleme dosyaları tutulur.
// CACHE değerini web-hazirla.mjs her derlemede değiştirir; böylece yeni sürüm kurulur ve eski önbellek silinir.
const CACHE = 'rt-gelistirme';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a !== CACHE).map((a) => caches.delete(a))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.includes('/_expo/static/')) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((v) => v || fetch(e.request).then((y) => {
    if (y.ok) c.put(e.request, y.clone());
    return y;
  }))));
});

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
