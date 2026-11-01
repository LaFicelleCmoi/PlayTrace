import { elapsedSeconds, formatClock, refresh } from './status.js';

const REFRESH_MS = 30_000;
const PIP_SIZE = { width: 280, height: 110 };
const LABELS = {
  idle: 'Aucun jeu détecté',
  'signed-out': 'Connecte-toi à PlayTrace',
  offline: 'Site injoignable',
};

// Références gardées : une fois le chrono déplacé dans le PiP, `document` ne le trouve plus.
const timer = document.getElementById('timer');
const label = document.getElementById('label');
const clock = document.getElementById('clock');
const controls = document.getElementById('controls');

let startedAt = null;
let stopTimers = () => {};

function renderClock() {
  if (startedAt) clock.textContent = formatClock(elapsedSeconds(startedAt));
}

async function update() {
  const state = await refresh();
  const playing = state.kind === 'playing';
  startedAt = playing ? state.status.startedAt : null;
  label.textContent = playing ? state.status.gameName : LABELS[state.kind];
  clock.hidden = !playing;
  renderClock();
}

/**
 * Les minuteries tournent dans la fenêtre visible : celles de cette page, une fois réduite,
 * seraient ralenties par le navigateur et le chrono sauterait.
 */
function runTimers(win) {
  stopTimers();
  const ticking = win.setInterval(renderClock, 1000);
  const polling = win.setInterval(update, REFRESH_MS);
  stopTimers = () => {
    win.clearInterval(ticking);
    win.clearInterval(polling);
  };
}

async function detach() {
  const pip = await window.documentPictureInPicture.requestWindow(PIP_SIZE);
  const style = pip.document.createElement('link');
  style.rel = 'stylesheet';
  style.href = chrome.runtime.getURL('pip.css');
  pip.document.head.append(style);
  pip.document.title = 'PlayTrace';
  pip.document.body.append(timer);
  controls.hidden = true;
  runTimers(pip);

  pip.addEventListener('pagehide', () => {
    document.body.prepend(timer);
    controls.hidden = false;
    runTimers(window);
  });
}

if ('documentPictureInPicture' in window) {
  document.getElementById('detach').addEventListener('click', detach);
} else {
  controls.hidden = true;
}

update();
runTimers(window);
