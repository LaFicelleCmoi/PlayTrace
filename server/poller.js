import { createHash } from 'node:crypto';
import { config } from './config.js';
import { getGameName } from './library.js';
import { closeStaleSessions, getLiveStatus, recordPresence } from './sessions.js';
import { publish } from './sse.js';
import { getPlayerSummaries } from './steam.js';
import { listUserIds, updateProfile } from './users.js';

// Une session sans confirmation pendant 3 sondages est considérée comme terminée.
// Sur Vercel, le sondage est déclenché chaque minute par un cron externe (GET /api/cron/poll).
const STALE_AFTER_MS = config.pollIntervalMs * 3;
const MAX_STEAM_APPID = 0x7fffffff;
const MAX_NAME_LENGTH = 200;

let timer = null;
let running = false;

/**
 * Identifiant d'un jeu non-Steam : négatif pour ne jamais croiser un vrai appid, et stable
 * pour qu'un même raccourci cumule ses sessions. Tient dans la colonne INTEGER.
 */
function shortcutAppid(key) {
  const hash = createHash('sha256').update(key).digest().readUInt32BE(0) & 0x7fffffff;
  return -(hash || 1);
}

async function currentGame(player) {
  const shownName = player.gameextrainfo?.trim().slice(0, MAX_NAME_LENGTH) || null;
  const appid = Number(player.gameid);
  if (Number.isSafeInteger(appid) && appid > 0 && appid <= MAX_STEAM_APPID) {
    return { appid, name: shownName || (await getGameName(player.steamid, appid))?.trim() || `App ${appid}` };
  }
  // Raccourci lancé depuis Steam : gameid 64 bits sans fiche Steam, ou nom seul.
  const gameid = player.gameid && player.gameid !== '0' ? player.gameid : null;
  if (!shownName && !gameid) return null;
  return { appid: shortcutAppid(shownName ?? gameid), name: shownName ?? 'Jeu non-Steam' };
}

async function broadcastStatus(steamid) {
  // Sur Vercel personne n'écoute en direct : le front relit l'état à chaque reconnexion SSE.
  if (!config.serverless) publish(steamid, 'status', await getLiveStatus(steamid));
}

/** Un sondage `GetPlayerSummaries` pour tous les joueurs suivis (ou ceux passés en argument). */
export async function pollOnce(steamids) {
  const ids = steamids ?? (await listUserIds());
  let players = [];
  if (ids.length > 0) {
    players = await getPlayerSummaries(ids);
    const now = new Date();
    for (const player of players) {
      await updateProfile(player);
      const { changed } = await recordPresence(player.steamid, await currentGame(player), now);
      if (changed) await broadcastStatus(player.steamid);
    }
  }
  for (const session of await closeStaleSessions(STALE_AFTER_MS)) await broadcastStatus(session.steamid64);
  return { polled: players.length };
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

/** Démarre le sondage unique, partagé par tous les visiteurs (serveur Node local uniquement). */
export function startPoller() {
  if (timer) return;
  // Après un arrêt du serveur, on clôt d'abord les sessions périmées : la coupure ne doit pas compter comme du jeu.
  closeStaleSessions(STALE_AFTER_MS)
    .catch((error) => console.error('[poller]', error.message))
    .finally(() => {
      tick();
      timer = setInterval(tick, config.pollIntervalMs);
    });
}

export function stopPoller() {
  clearInterval(timer);
  timer = null;
}
