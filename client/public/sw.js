// Service Worker with Network-Only strategy and cache cleanup
const CACHE_NAME = 'bepviet-pwa-v10';

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
  // Always fetch directly from network to ensure 100% fresh code
  event.respondWith(fetch(event.request));
});
