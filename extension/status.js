// Doit correspondre à `host_permissions` dans manifest.json.
export const SITE = 'https://play-trace-nine.vercel.app';

const TIMEOUT_MS = 10_000;

/** Secondes écoulées depuis le début de la session. */
export function elapsedSeconds(startedAt) {
  return Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
}

/** Chronomètre « 01:23:45 ». */
export function formatClock(seconds) {
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

/** Texte du badge, 4 caractères au plus : « 45m », « 1h23 », « 12h ». */
export function formatBadge(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (hours < 10) return `${hours}h${String(minutes).padStart(2, '0')}`;
  return `${hours}h`;
}

/** Lit l'état sur le site, avec le cookie de session du navigateur. */
async function fetchState() {
  try {
    const res = await fetch(`${SITE}/api/live/status`, {
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 401) return { kind: 'signed-out' };
    if (!res.ok) return { kind: 'offline' };
    const status = await res.json();
    return status.playing ? { kind: 'playing', status } : { kind: 'idle' };
  } catch {
    return { kind: 'offline' };
  }
}

function updateAction(state) {
  const playing = state.kind === 'playing';
  const seconds = playing ? elapsedSeconds(state.status.startedAt) : 0;
  const titles = {
    playing: () => `${state.status.gameName} : ${formatClock(seconds)}`,
    idle: () => 'PlayTrace : aucun jeu détecté',
    'signed-out': () => 'PlayTrace : connecte-toi pour voir ton temps de jeu',
    offline: () => 'PlayTrace : site injoignable',
  };
  // Hors partie ou hors ligne, pas de badge : un temps figé serait faux.
  return Promise.all([
    chrome.action.setBadgeText({ text: playing ? formatBadge(seconds) : '' }),
    chrome.action.setTitle({ title: titles[state.kind]() }),
  ]);
}

/** Récupère l'état et met à jour le badge. Sert au service worker comme au popup. */
export async function refresh() {
  const state = await fetchState();
  await updateAction(state);
  return state;
}
