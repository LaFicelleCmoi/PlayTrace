import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import App from './App.jsx';
import { registerServiceWorker } from './lib/install';

registerServiceWorker();

// Après un déploiement, les anciens fichiers de page n'existent plus : on recharge pour prendre la nouvelle version.
// Une seule fois par minute : si le fichier reste introuvable (hors ligne, panne), recharger ne ferait que boucler.
const RELOAD_KEY = 'playtrace-reloaded-at';
const RELOAD_COOLDOWN_MS = 60_000;

window.addEventListener('vite:preloadError', (event) => {
  if (Date.now() - Number(sessionStorage.getItem(RELOAD_KEY)) < RELOAD_COOLDOWN_MS) return;
  event.preventDefault();
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
