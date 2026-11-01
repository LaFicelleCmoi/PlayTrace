import { SITE, elapsedSeconds, formatClock, refresh } from './status.js';

const REFRESH_MS = 30_000;
const PIP_HOST_SIZE = { width: 340, height: 260 };

const MESSAGES = {
  idle: {
    title: 'Aucun jeu détecté',
    text: 'Lance un jeu sur Steam : il apparaîtra ici en moins de deux minutes.',
  },
  'signed-out': {
    title: 'Connecte-toi à PlayTrace',
    text: 'L’extension utilise ta session du site pour lire ta partie en cours.',
    link: { label: 'Se connecter avec Steam', href: `${SITE}/auth/steam` },
  },
  offline: {
    title: 'Site injoignable',
    text: 'Nouvelle tentative dans quelques secondes…',
  },
};

const el = (id) => document.getElementById(id);
const startTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

let startedAt = null;
let sessionId = null;

function renderClock() {
  if (startedAt) el('clock').textContent = formatClock(elapsedSeconds(startedAt));
}

function renderMessage(kind) {
  const { title, text, link } = MESSAGES[kind];
  el('message-title').textContent = title;
  el('message-text').textContent = text;
  el('message-link').hidden = !link;
  if (link) {
    el('message-link').textContent = link.label;
    el('message-link').href = link.href;
  }
}

function renderPlaying(status) {
  // Ne recharge le visuel qu'au changement de session, pas à chaque rafraîchissement.
  if (status.sessionId !== sessionId) {
    sessionId = status.sessionId;
    el('art').hidden = false;
    el('art').src = `${SITE}/api/art/${status.appid}/header`;
  }
  el('game').textContent = status.gameName;
  el('game').href = `${SITE}/jeux/${status.appid}`;
  el('started').textContent = `Session lancée à ${startTime.format(new Date(status.startedAt))}`;
}

async function update() {
  const state = await refresh();
  const playing = state.kind === 'playing';
  startedAt = playing ? state.status.startedAt : null;
  el('playing').hidden = !playing;
  el('message').hidden = playing;
  if (playing) renderPlaying(state.status);
  else renderMessage(state.kind);
  renderClock();
}

/** Ouvre la fenêtre du chrono : le popup se ferme au moindre clic ailleurs et ne peut pas l'héberger. */
async function openPipWindow() {
  const url = chrome.runtime.getURL('pip.html');
  const [existing] = await chrome.runtime.getContexts({ contextTypes: ['TAB'], documentUrls: [url] });
  if (existing) await chrome.windows.update(existing.windowId, { focused: true });
  else await chrome.windows.create({ url, type: 'popup', width: PIP_HOST_SIZE.width, height: PIP_HOST_SIZE.height });
  window.close();
}

el('pip').addEventListener('click', openPipWindow);
el('site').href = SITE;
el('art').addEventListener('error', () => {
  el('art').hidden = true;
});

update();
setInterval(update, REFRESH_MS);
setInterval(renderClock, 1000);
