// Service Worker para PWA y Push Notifications
const CACHE_NAME = 'inversiones-cc-v1';
const SW_VERSION = '1.0.0';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker with push support, version:', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/manifest.json']);
    })
  );
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker, version:', SW_VERSION);
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch - NO INTERCEPTAR para evitar conflictos
self.addEventListener('fetch', (event) => {
  return;
});

// Escuchar mensajes push
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received:', event);

  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('SW: Error parsing push data:', error);
      data = {
        title: 'Nueva notificación',
        message: event.data.text() || 'Tienes una nueva notificación',
        type: 'sistema'
      };
    }
  }

  const options = {
    body: data.message || 'Nueva notificación de Inversiones C&C',
    icon: '/logo.png',
    badge: '/logo.png',
    image: data.image,
    data: {
      url: data.url || '/',
      notificationId: data.id,
      type: data.type || 'sistema',
      ...data.datos_adicionales
    },
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ],
    tag: `notification-${data.id || Date.now()}`,
    requireInteraction: data.type === 'pago_vencido' || data.prioridad === 'urgente',
    silent: false,
    timestamp: Date.now(),
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Inversiones C&C', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      const url = data.url || '/';
      
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(() => {
            return client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: url,
              notificationId: data.notificationId,
              notificationType: data.type
            });
          });
        }
      }
      
      return clients.openWindow(url);
    })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('SW: Notification closed:', event);
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  console.log('SW: Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('SW: Service worker loaded with push support, version:', SW_VERSION);