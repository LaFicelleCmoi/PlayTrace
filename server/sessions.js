import { sql } from './db.js';

async function getOpenSession(steamid, db = sql) {
  const [open] = await db`
    SELECT id, steamid64, appid, game_name, started_at, last_seen_at
    FROM playtrace.sessions WHERE steamid64 = ${steamid} AND ended_at IS NULL
  `;
  return open ?? null;
}

async function openSession(db, steamid, game, now) {
  // Deux sondages simultanés (cron + connexion) ne doivent pas ouvrir deux sessions : l'index unique tranche.
  const [started] = await db`
    INSERT INTO playtrace.sessions (steamid64, appid, game_name, started_at, last_seen_at)
    VALUES (${steamid}, ${game.appid}, ${game.name}, ${now}, ${now})
    ON CONFLICT (steamid64) WHERE ended_at IS NULL DO NOTHING
    RETURNING id, steamid64, appid, game_name, started_at
  `;
  return started ?? null;
}

async function closeSession(db, session, end) {
  const duration = Math.max(0, Math.round((end.getTime() - new Date(session.started_at).getTime()) / 1000));
  await db`UPDATE playtrace.sessions SET ended_at = ${end}, duration_s = ${duration} WHERE id = ${session.id}`;
  return { ...session, ended_at: end, duration_s: duration };
}

/**
 * Applique un résultat de sondage : `game` vaut `{ appid, name }` ou `null` si le joueur ne joue pas.
 * Ferme la session ouverte si le jeu a changé et en ouvre une nouvelle si besoin.
 */
export async function recordPresence(steamid, game, now = new Date()) {
  return sql.begin(async (tx) => {
    const open = await getOpenSession(steamid, tx);
    if (open && game && open.appid === game.appid) {
      await tx`UPDATE playtrace.sessions SET last_seen_at = ${now} WHERE id = ${open.id}`;
      return { changed: false, ended: null, started: null };
    }
    const ended = open ? await closeSession(tx, open, now) : null;
    const started = game ? await openSession(tx, steamid, game, now) : null;
    return { changed: Boolean(ended || started), ended, started };
  });
}

/**
 * Ferme les sessions que plus aucun sondage n'a confirmées depuis `maxAgeMs`
 * (serveur arrêté, profil passé en privé…). La fin retenue est le dernier sondage positif.
 */
export async function closeStaleSessions(maxAgeMs, now = new Date()) {
  const limit = new Date(now.getTime() - maxAgeMs);
  return sql`
    UPDATE playtrace.sessions
    SET ended_at = last_seen_at,
        duration_s = GREATEST(0, ROUND(EXTRACT(EPOCH FROM last_seen_at - started_at)))::int
    WHERE ended_at IS NULL AND last_seen_at < ${limit}
    RETURNING steamid64
  `;
}

/** État diffusé en direct au front. */
export async function getLiveStatus(steamid) {
  const open = await getOpenSession(steamid);
  return {
    playing: Boolean(open),
    sessionId: open ? Number(open.id) : null,
    appid: open?.appid ?? null,
    gameName: open?.game_name ?? null,
    startedAt: open?.started_at ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export async function getRecentSessions(steamid, limit) {
  const rows = await sql`
    SELECT id, appid, game_name, started_at, ended_at, duration_s
    FROM playtrace.sessions WHERE steamid64 = ${steamid} ORDER BY started_at DESC LIMIT ${limit}
  `;
  return rows.map((row) => ({ ...row, id: Number(row.id), live: row.ended_at === null }));
}
