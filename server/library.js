import { sql } from './db.js';
import { getOwnedGames } from './steam.js';

const CACHE_TTL_MS = 60 * 60 * 1000;
const INSERT_CHUNK = 1000;
const refreshing = new Map();

async function refresh(steamid) {
  const games = await getOwnedGames(steamid);
  const rows = games.map((game) => ({
    steamid64: steamid,
    appid: game.appid,
    name: game.name ?? `App ${game.appid}`,
    playtime_minutes: game.playtime_forever ?? 0,
    last_played: game.rtime_last_played ? new Date(game.rtime_last_played * 1000) : null,
  }));

  await sql.begin(async (tx) => {
    await tx`DELETE FROM playtrace.owned_games WHERE steamid64 = ${steamid}`;
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      await tx`INSERT INTO playtrace.owned_games ${tx(rows.slice(i, i + INSERT_CHUNK))}`;
    }
    await tx`
      INSERT INTO playtrace.owned_games_meta (steamid64, fetched_at) VALUES (${steamid}, now())
      ON CONFLICT (steamid64) DO UPDATE SET fetched_at = excluded.fetched_at
    `;
  });
}

/** Rafraîchit le cache `GetOwnedGames` s'il a plus d'une heure. Une seule requête Steam à la fois par joueur. */
export async function ensureLibrary(steamid) {
  const [meta] = await sql`SELECT fetched_at FROM playtrace.owned_games_meta WHERE steamid64 = ${steamid}`;
  if (meta && Date.now() - new Date(meta.fetched_at).getTime() < CACHE_TTL_MS) return;

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

export async function getGameName(steamid, appid) {
  const [game] = await sql`SELECT name FROM playtrace.owned_games WHERE steamid64 = ${steamid} AND appid = ${appid}`;
  return game?.name ?? null;
}

export async function getLibrarySummary(steamid) {
  const [[totals], topGames, [meta]] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS "gameCount", COALESCE(SUM(playtime_minutes), 0)::int AS "totalMinutes"
      FROM playtrace.owned_games WHERE steamid64 = ${steamid}
    `,
    sql`
      SELECT appid, name, playtime_minutes AS minutes FROM playtrace.owned_games
      WHERE steamid64 = ${steamid} AND playtime_minutes > 0 ORDER BY playtime_minutes DESC LIMIT 12
    `,
    sql`SELECT fetched_at FROM playtrace.owned_games_meta WHERE steamid64 = ${steamid}`,
  ]);
  return { ...totals, topGames, fetchedAt: meta?.fetched_at ?? null };
}
