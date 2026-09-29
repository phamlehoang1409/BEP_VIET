// Service Worker with Network-First strategy and cache self-healing
const CACHE_NAME = 'bepviet-pwa-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always use network directly for all requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
