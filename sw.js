const CACHE_NAME = 'moba-shop-static-v218';
const SAFE_ASSETS = [
  '/styles/app.css',
  '/assets/moba-shop-logo-256.png',
  '/assets/moba-shop-logo-512.webp',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SAFE_ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  if(url.pathname.startsWith('/api/') || url.pathname.includes('admin') || url.pathname.includes('/js/')) return;
  const safe = SAFE_ASSETS.includes(url.pathname) || req.destination === 'style' || req.destination === 'image';
  if(!safe) return;
  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
      return res;
    }).catch(() => caches.match(req))
  );
});
