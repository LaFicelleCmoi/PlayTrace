import { db } from './db.js';

// Durée d'une session ; pour la session en cours, temps écoulé jusqu'à $now.
const DURATION = `COALESCE(duration_s, MAX(0, CAST(strftime('%s', $now) AS INTEGER) - CAST(strftime('%s', started_at) AS INTEGER)))`;

const YEAR_SESSIONS = `
  WITH s AS (
    SELECT appid, game_name, started_at, ${DURATION} AS dur
    FROM sessions
    WHERE steamid64 = $steamid AND started_at >= $from AND started_at < $to
  )
`;

/**
 * Stats « Wrapped » d'une année. `tzOffset` est `Date#getTimezoneOffset()` du navigateur,
 * pour que la heatmap soit dans l'heure locale du joueur.
 */
export function getYearStats(steamid, year, tzOffset) {
  const now = new Date().toISOString();
  const params = {
    steamid,
    now,
    from: new Date(Date.UTC(year, 0, 1)).toISOString(),
    to: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
  };

  const totals = db.prepare(`${YEAR_SESSIONS}
    SELECT COALESCE(SUM(dur), 0) AS trackedSeconds, COUNT(*) AS sessions, COUNT(DISTINCT appid) AS games FROM s
  `).get(params);

  const topGames = db.prepare(`${YEAR_SESSIONS}
    SELECT appid, MAX(game_name) AS name, SUM(dur) AS seconds, COUNT(*) AS sessions
    FROM s GROUP BY appid ORDER BY seconds DESC LIMIT 5
  `).all(params);

  const longest = db.prepare(`${YEAR_SESSIONS}
    SELECT appid, game_name AS name, dur AS seconds, started_at AS startedAt FROM s ORDER BY dur DESC LIMIT 1
  `).get(params) ?? null;

  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  const shift = `${-tzOffset} minutes`;
  const cells = db.prepare(`${YEAR_SESSIONS}
    SELECT CAST(strftime('%w', started_at, $shift) AS INTEGER) AS dow,
           CAST(strftime('%H', started_at, $shift) AS INTEGER) AS hour,
           SUM(dur) AS seconds
    FROM s GROUP BY dow, hour
  `).all({ ...params, shift });
  for (const cell of cells) heatmap[cell.dow][cell.hour] = cell.seconds;

  const { trackingSince } = db.prepare('SELECT MIN(started_at) AS trackingSince FROM sessions WHERE steamid64 = ?').get(steamid);

  const goty = topGames[0] ?? null;
  return {
    year,
    generatedAt: now,
    trackingSince,
    totals: { ...totals, longest },
    topGames,
    gameOfTheYear: goty && { ...goty, share: totals.trackedSeconds ? goty.seconds / totals.trackedSeconds : 0 },
    // heatmap[jour][heure] en secondes, jour 0 = dimanche.
    heatmap,
  };
}
