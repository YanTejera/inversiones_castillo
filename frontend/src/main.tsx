import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import TestApp from './TestApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

console.log('API URL:', import.meta.env.VITE_API_URL);

// DESREGISTRAR Service Worker problemático
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Desregistrar todos los service workers existentes
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('Unregistering SW:', registration);
        await registration.unregister();
      }
      
      // Limpiar todos los caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        console.log('Deleting cache:', cacheName);
        await caches.delete(cacheName);
      }
      
      console.log('All service workers and caches cleared');
      
      // Opcional: registrar uno nuevo y simple después de un delay
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
          .then((registration) => {
            console.log('New minimal SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing service workers:', error);
    }
  });
}
