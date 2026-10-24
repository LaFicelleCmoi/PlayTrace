import { config } from './config.js';
import { getGameName } from './library.js';
import { closeStaleSessions, getLiveStatus, recordPresence } from './sessions.js';
import { publish } from './sse.js';
import { getPlayerSummaries } from './steam.js';
import { listUserIds, updateProfile } from './users.js';

// Une session sans confirmation pendant 3 sondages est considérée comme terminée.
const STALE_AFTER_MS = config.pollIntervalMs * 3;

let timer = null;
let running = false;

function currentGame(player) {
  const appid = Number(player.gameid);
  // Les jeux hors Steam ont un gameid 64 bits sans fiche Steam : on les ignore.
  if (!player.gameid || !Number.isSafeInteger(appid) || appid <= 0 || appid > 0xffffffff) return null;
  const name = player.gameextrainfo || getGameName(player.steamid, appid) || `App ${appid}`;
  return { appid, name };
}

function broadcastStatus(steamid) {
  publish(steamid, 'status', getLiveStatus(steamid));
}

/** Un sondage `GetPlayerSummaries` pour tous les joueurs suivis (ou ceux passés en argument). */
export async function pollOnce(steamids = listUserIds()) {
  if (steamids.length > 0) {
    const players = await getPlayerSummaries(steamids);
    const now = new Date();
    for (const player of players) {
      updateProfile(player);
      const { changed } = recordPresence(player.steamid, currentGame(player), now);
      if (changed) broadcastStatus(player.steamid);
    }
  }
  for (const session of closeStaleSessions(STALE_AFTER_MS)) broadcastStatus(session.steamid64);
}

async function tick() {
  // Si Steam répond lentement, on saute le tour plutôt que d'empiler les requêtes.
  if (running) return;
  running = true;
  try {
    await pollOnce();
  } catch (error) {
    console.error('[poller]', error.message);
  } finally {
    running = false;
  }
}

/** Démarre le sondage unique, partagé par tous les visiteurs. */
export function startPoller() {
  if (timer) return;
  // Après un arrêt du serveur, on clôt d'abord les sessions périmées : la coupure ne doit pas compter comme du jeu.
  closeStaleSessions(STALE_AFTER_MS);
  tick();
  timer = setInterval(tick, config.pollIntervalMs);
}

export function stopPoller() {
  clearInterval(timer);
  timer = null;
}
