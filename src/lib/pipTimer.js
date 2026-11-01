import { useSyncExternalStore } from 'react';
import { formatClock } from '@/lib/format';

// Chrono du jeu en cours dans une fenêtre toujours au premier plan (Document Picture-in-Picture).
// Hors de React : la fenêtre doit survivre aux changements de page de l'application.
const SIZE = { width: 280, height: 110 };
const STYLE = `
  * { box-sizing: border-box; margin: 0; }
  [hidden] { display: none !important; }
  html, body { height: 100%; }
  body {
    display: flex; flex-direction: column; justify-content: center; padding: 8px 14px;
    background: #07070c; color: #f4f4f5; text-align: center;
    font: 600 14px/1.3 system-ui, 'Segoe UI', sans-serif;
  }
  p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #clock {
    color: #22d3ee; font: 600 min(17vw, 55vh) / 1.1 ui-monospace, Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }
`;

const listeners = new Set();
let pip = null;
let label = null;
let clock = null;
let status = null;
let connection = 'connecting';

export const isPipSupported = () => 'documentPictureInPicture' in window;

function render() {
  if (!pip) return;
  const lost = connection === 'closed';
  const playing = Boolean(status?.playing) && !lost;
  // Direct perdu : pas de chrono, il compterait peut-être une partie déjà terminée.
  label.textContent = playing ? status.gameName : lost ? 'Connexion au direct perdue' : 'Aucun jeu détecté';
  clock.hidden = !playing;
  if (playing) clock.textContent = formatClock((Date.now() - Date.parse(status.startedAt)) / 1000);
}

function emit() {
  for (const listener of listeners) listener();
}

async function open() {
  const win = await window.documentPictureInPicture.requestWindow(SIZE);
  const doc = win.document;
  doc.title = 'PlayTrace';
  doc.documentElement.lang = 'fr';
  doc.head.append(Object.assign(doc.createElement('style'), { textContent: STYLE }));
  label = doc.createElement('p');
  clock = Object.assign(doc.createElement('p'), { id: 'clock' });
  doc.body.append(label, clock);
  pip = win;
  // Minuterie de la fenêtre visible : celles de l'onglet, masqué pendant la partie, sont ralenties.
  win.setInterval(render, 1000);
  win.addEventListener('pagehide', () => {
    pip = null;
    emit();
  });
  render();
  emit();
}

/** Ouvre ou ferme le chrono. À appeler depuis un clic : le navigateur l'exige pour ouvrir la fenêtre. */
export function togglePip() {
  if (pip) {
    pip.close();
    return Promise.resolve();
  }
  return open();
}

/** Transmet l'état du flux live : à appeler à chaque changement. */
export function setPipStatus(nextStatus, nextConnection) {
  status = nextStatus;
  connection = nextConnection;
  render();
}

export function usePipOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pip !== null,
  );
}
