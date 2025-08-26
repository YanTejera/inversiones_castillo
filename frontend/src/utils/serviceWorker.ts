// Utility functions for service worker management

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function registerSW() {
  if ('serviceWorker' in navigator) {
    const swUrl = `/sw.js`;

    if (isLocalhost) {
      // This is running on localhost. Let's check if a service worker still exists or not.
      checkValidServiceWorker(swUrl);

      // Add some additional logging to localhost, pointing developers to the
      // service worker/PWA documentation.
      navigator.serviceWorker.ready.then(() => {
        console.log(
          'This web app is being served cache-first by a service ' +
            'worker. To learn more, visit https://cra.link/PWA'
        );
      });
    } else {
      // Is not localhost. Just register service worker
      registerValidSW(swUrl);
    }
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('SW: Service worker registered successfully');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'SW: New content is available and will be used when all ' +
                  'tabs for this page are closed.'
              );
            } else {
              console.log('SW: Content is cached for offline use.');
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('SW: Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log(
        'SW: No internet connection found. App is running in offline mode.'
      );
    });
}

export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Handle messages from service worker
export function setupSWMessageListener() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const message = event.data;
      
      if (message && message.type === 'NOTIFICATION_CLICK') {
        // Handle notification click
        console.log('SW: Notification clicked, navigating to:', message.url);
        window.location.href = message.url;
      }
      
      if (message && message.type === 'SYNC_COMPLETE') {
        // Handle sync complete
        console.log('SW: Background sync completed');
      }
    });
  }
}