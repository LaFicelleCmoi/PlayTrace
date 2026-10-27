import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import App from './App.jsx';
import { registerServiceWorker } from './lib/install';

registerServiceWorker();

// Après un déploiement, les anciens fichiers de page n'existent plus : on recharge une fois pour prendre la nouvelle version.
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem('playtrace-reloaded')) return;
  event.preventDefault();
  sessionStorage.setItem('playtrace-reloaded', '1');
  window.location.reload();
});
window.addEventListener('load', () => sessionStorage.removeItem('playtrace-reloaded'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
