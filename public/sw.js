const CACHE_NAME = 'moba-shop-shell-v223';
const STATIC_ASSETS = [
  '/assets/moba-shop-logo-256.png',
  '/assets/moba-shop-logo-512.webp',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const blocked =
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.includes('/js/') ||
    url.pathname.includes('/styles/') ||
    url.pathname.includes('catalog') ||
    url.pathname.includes('order') ||
    url.pathname.includes('checkout');
  if (blocked) return;

  if (!STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
        return res;
      })
      .catch(() => caches.match(req))
  );
});
