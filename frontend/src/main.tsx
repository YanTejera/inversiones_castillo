import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/document-styles.css'
import App from './App.tsx'
// import TestApp from './TestApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

console.log('API URL:', import.meta.env.VITE_API_URL);

// SERVICE WORKER DISABLED - Fix deployment issues
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Only clear existing service workers, don't register new ones
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
      
      console.log('All service workers and caches cleared - PWA disabled');
      
    } catch (error) {
      console.error('Error clearing service workers:', error);
    }
  });
}
