import { sql } from './db.js';

/** Sessions de l'année ; pour la session en cours, durée écoulée jusqu'à `now`. */
function yearSessions(steamid, from, to, now) {
  return sql`
    WITH s AS (
      SELECT appid, btrim(game_name) AS game_name, started_at,
             COALESCE(duration_s, GREATEST(0, EXTRACT(EPOCH FROM ${now}::timestamptz - started_at))::int) AS dur
      FROM playtrace.sessions
      WHERE steamid64 = ${steamid} AND started_at >= ${from} AND started_at < ${to}
    )
  `;
}

/**
 * Stats « Wrapped » d'une année. `tzOffset` est `Date#getTimezoneOffset()` du navigateur,
 * pour que la heatmap soit dans l'heure locale du joueur.
 */
export async function getYearStats(steamid, year, tzOffset) {
  const now = new Date();
  const s = yearSessions(steamid, new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1)), now);

  const [[totals], topGames, [longest], cells, daily, [{ trackingSince }]] = await Promise.all([
    sql`${s} SELECT COALESCE(SUM(dur), 0)::int AS "trackedSeconds", COUNT(*)::int AS sessions, COUNT(DISTINCT appid)::int AS games FROM s`,
    sql`${s}
      SELECT appid, MAX(game_name) AS name, SUM(dur)::int AS seconds, COUNT(*)::int AS sessions
      FROM s GROUP BY appid ORDER BY seconds DESC LIMIT 5
    `,
    sql`${s} SELECT appid, game_name AS name, dur AS seconds, started_at AS "startedAt" FROM s ORDER BY dur DESC LIMIT 1`,
    sql`${s}
      SELECT EXTRACT(DOW FROM local)::int AS dow, EXTRACT(HOUR FROM local)::int AS hour, SUM(dur)::int AS seconds
      FROM (SELECT dur, (started_at AT TIME ZONE 'UTC') - make_interval(mins => ${tzOffset}::int) AS local FROM s) t
      GROUP BY 1, 2
    `,
    // Temps et sessions par jour, en date locale du joueur (calendrier de l'année, séries).
    sql`${s}
      SELECT to_char(local, 'YYYY-MM-DD') AS day, SUM(dur)::int AS seconds, COUNT(*)::int AS sessions
      FROM (SELECT dur, (started_at AT TIME ZONE 'UTC') - make_interval(mins => ${tzOffset}::int) AS local FROM s) t
      GROUP BY 1 ORDER BY 1
    `,
    sql`SELECT MIN(started_at) AS "trackingSince" FROM playtrace.sessions WHERE steamid64 = ${steamid}`,
  ]);

  // heatmap[jour][heure] en secondes, jour 0 = dimanche.
  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const cell of cells) heatmap[cell.dow][cell.hour] = cell.seconds;

  const goty = topGames[0] ?? null;
  return {
    year,
    generatedAt: now.toISOString(),
    trackingSince,
    totals: { ...totals, longest: longest ?? null },
    topGames,
    gameOfTheYear: goty && { ...goty, share: totals.trackedSeconds ? goty.seconds / totals.trackedSeconds : 0 },
    heatmap,
    daily,
  };
}
