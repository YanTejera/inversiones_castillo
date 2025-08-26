import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/document-styles.css'
import App from './App.tsx'
import { registerSW, setupSWMessageListener } from './utils/serviceWorker'
// import TestApp from './TestApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

console.log('API URL:', import.meta.env.VITE_API_URL);

// Register service worker for push notifications
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () => {
    registerSW();
    setupSWMessageListener();
  });
}
