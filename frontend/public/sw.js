// Service Worker MINIMAL - Solo para PWA básico
// NO intercepta ninguna request para evitar errores

const CACHE_NAME = 'inversiones-cc-minimal-v1';

// Instalar - cache mínimo
self.addEventListener('install', (event) => {
  console.log('SW: Installing minimal service worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Solo cachear el manifest para PWA
      return cache.addAll(['/manifest.json']);
    })
  );
  self.skipWaiting();
});

// Activar - limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('SW: Activating minimal service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - NO INTERCEPTAR NADA
// Esto elimina todos los errores de fetch
self.addEventListener('fetch', (event) => {
  // No hacer nada - dejar que las requests pasen normalmente
  return;
});

console.log('SW: Minimal service worker loaded');