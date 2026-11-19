/* Muaka · service worker: permite instalar la app y abrirla sin conexión.
   Las páginas se piden primero a la red (siempre la versión nueva) y, si no hay internet,
   se usa la copia guardada. Las llamadas al servidor (Apps Script) nunca se guardan. */
const CACHE = 'muaka-v1';
const SHELL = ['./', './index.html', './manifest.json', './config.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];

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
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
