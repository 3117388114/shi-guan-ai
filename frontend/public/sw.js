const CACHE = 'esophageal-screening-v4';
const STATIC_ASSET = /\.(?:js|css|json|wasm|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf)$/i;

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const url = new URL(request.url);
  const isNavigation = request.mode === 'navigate';
  const isStaticAsset = url.pathname.startsWith('/assets/') || STATIC_ASSET.test(url.pathname);

  if (!isNavigation && !isStaticAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);

    if (isStaticAsset && cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && (isStaticAsset || isNavigation)) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      if (isNavigation) {
        const fallback = await cache.match('/');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
