import { db, transaction } from './db.js';
import { getOwnedGames } from './steam.js';

const CACHE_TTL_MS = 60 * 60 * 1000;
const refreshing = new Map();

async function refresh(steamid) {
  const games = await getOwnedGames(steamid);
  transaction(() => {
    db.prepare('DELETE FROM owned_games WHERE steamid64 = ?').run(steamid);
    const insert = db.prepare('INSERT INTO owned_games (steamid64, appid, name, playtime_minutes) VALUES (?, ?, ?, ?)');
    for (const game of games) {
      insert.run(steamid, game.appid, game.name ?? `App ${game.appid}`, game.playtime_forever ?? 0);
    }
    db.prepare(`
      INSERT INTO owned_games_meta (steamid64, fetched_at) VALUES (?, ?)
      ON CONFLICT (steamid64) DO UPDATE SET fetched_at = excluded.fetched_at
    `).run(steamid, new Date().toISOString());
  });
}

/** Rafraîchit le cache `GetOwnedGames` s'il a plus d'une heure. Une seule requête Steam à la fois par joueur. */
export async function ensureLibrary(steamid) {
  const meta = db.prepare('SELECT fetched_at FROM owned_games_meta WHERE steamid64 = ?').get(steamid);
  if (meta && Date.now() - Date.parse(meta.fetched_at) < CACHE_TTL_MS) return;

  if (!refreshing.has(steamid)) {
    refreshing.set(steamid, refresh(steamid).finally(() => refreshing.delete(steamid)));
  }
  try {
    await refreshing.get(steamid);
  } catch (error) {
    // On garde l'ancien cache plutôt que de casser le dashboard.
    console.error('[library]', error.message);
  }
}

export function getGameName(steamid, appid) {
  return db.prepare('SELECT name FROM owned_games WHERE steamid64 = ? AND appid = ?').get(steamid, appid)?.name ?? null;
}

export function getLibrarySummary(steamid) {
  const totals = db.prepare(`
    SELECT COUNT(*) AS gameCount, COALESCE(SUM(playtime_minutes), 0) AS totalMinutes
    FROM owned_games WHERE steamid64 = ?
  `).get(steamid);
  const topGames = db.prepare(`
    SELECT appid, name, playtime_minutes AS minutes FROM owned_games
    WHERE steamid64 = ? AND playtime_minutes > 0 ORDER BY playtime_minutes DESC LIMIT 12
  `).all(steamid);
  const meta = db.prepare('SELECT fetched_at FROM owned_games_meta WHERE steamid64 = ?').get(steamid);
  return { ...totals, topGames, fetchedAt: meta?.fetched_at ?? null };
}
