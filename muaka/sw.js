/* La Wuaka · service worker
   1) Permite instalar la app y abrirla sin conexión (red primero; si no hay internet, copia guardada).
   2) Muestra las notificaciones push (Firebase Cloud Messaging) aunque la app esté cerrada,
      y al tocarlas abre la app directamente en el pedido, la solicitud o la oferta.
   Las llamadas al servidor (Apps Script) nunca se guardan. */
const CACHE = 'wuaka-v6';
const SHELL = ['./', './index.html', './manifest.json', './config.json', './icon-192.png', './icon-512.png', './icon-maskable.png', './badge-96.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (e.request.headers.has('range') || /\.(mp4|webm)$/i.test(url.pathname)) return; // los videos se transmiten directo
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});

/* ---------- notificaciones push ---------- */
const ES_IOS = /iPhone|iPad|iPod/.test(self.navigator.userAgent) || (/Macintosh/.test(self.navigator.userAgent) && !/Chrome|Edg|Firefox/.test(self.navigator.userAgent));
// Vibración "mua-ka · mua-KA": el mismo ritmo del tono de la app (Android)
const VIB = { pedido: [90, 60, 90, 160, 220, 90, 220], aviso: [70, 50, 130] };

self.addEventListener('push', e => {
  let d = {};
  try { const j = e.data ? e.data.json() : {}; d = j.data || j.notification || j || {}; }
  catch (x) { d = { t: 'La Wuaka', b: e.data ? e.data.text() : '' }; }
  const kind = d.k === 'pedido' ? 'pedido' : 'aviso';
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visible = wins.find(c => c.visibilityState === 'visible');
    if (visible) visible.postMessage({ t: 'push', d });
    // Con la app abierta y a la vista, el aviso lo muestra la app (con el sonido de la app).
    // iPhone exige mostrar siempre la notificación del sistema.
    if (visible && !ES_IOS) return;
    await self.registration.showNotification(d.t || 'La Wuaka', {
      body: d.b || '',
      icon: 'icon-192.png',
      badge: 'badge-96.png',
      image: d.img || undefined,
      tag: d.tag || undefined,
      renotify: !!d.tag,
      requireInteraction: kind === 'pedido',
      vibrate: VIB[kind],
      timestamp: Date.now(),
      data: { u: d.u || '#/' },
      actions: kind === 'pedido' ? [{ action: 'ver', title: 'Ver pedido' }] : []
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = (e.notification.data && e.notification.data.u) || '#/';
  const target = self.registration.scope + (u.charAt(0) === '#' ? u : '#/');
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if (c.url.indexOf(self.registration.scope) === 0) {
        try { await c.focus(); } catch (x) { /* sin foco */ }
        c.postMessage({ t: 'nav', u });
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
