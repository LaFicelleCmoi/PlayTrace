import { db, transaction } from './db.js';

const OPEN_SESSION_SQL = `
  SELECT id, steamid64, appid, game_name, started_at, last_seen_at
  FROM sessions WHERE steamid64 = ? AND ended_at IS NULL
`;

export function getOpenSession(steamid) {
  return db.prepare(OPEN_SESSION_SQL).get(steamid);
}

function openSession(steamid, game, iso) {
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO sessions (steamid64, appid, game_name, started_at, last_seen_at) VALUES (?, ?, ?, ?, ?)
  `).run(steamid, game.appid, game.name, iso, iso);
  return { id: Number(lastInsertRowid), steamid64: steamid, appid: game.appid, game_name: game.name, started_at: iso };
}

function closeSession(session, endIso) {
  const duration = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(session.started_at)) / 1000));
  db.prepare('UPDATE sessions SET ended_at = ?, duration_s = ? WHERE id = ?').run(endIso, duration, session.id);
  return { ...session, ended_at: endIso, duration_s: duration };
}

/**
 * Applique un résultat de sondage : `game` vaut `{ appid, name }` ou `null` si le joueur ne joue pas.
 * Ferme la session ouverte si le jeu a changé et en ouvre une nouvelle si besoin.
 */
export function recordPresence(steamid, game, now = new Date()) {
  const iso = now.toISOString();
  return transaction(() => {
    const open = getOpenSession(steamid);
    if (open && game && open.appid === game.appid) {
      db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(iso, open.id);
      return { changed: false, ended: null, started: null };
    }
    const ended = open ? closeSession(open, iso) : null;
    const started = game ? openSession(steamid, game, iso) : null;
    return { changed: Boolean(ended || started), ended, started };
  });
}

/**
 * Ferme les sessions que plus aucun sondage n'a confirmées depuis `maxAgeMs`
 * (serveur arrêté, profil passé en privé…). La fin retenue est le dernier sondage positif.
 */
export function closeStaleSessions(maxAgeMs, now = new Date()) {
  const limit = new Date(now.getTime() - maxAgeMs).toISOString();
  return transaction(() => {
    const stale = db.prepare(`
      SELECT id, steamid64, appid, game_name, started_at, last_seen_at
      FROM sessions WHERE ended_at IS NULL AND last_seen_at < ?
    `).all(limit);
    return stale.map((session) => closeSession(session, session.last_seen_at));
  });
}

/** État diffusé en direct au front. */
export function getLiveStatus(steamid) {
  const open = getOpenSession(steamid);
  return {
    playing: Boolean(open),
    sessionId: open?.id ?? null,
    appid: open?.appid ?? null,
    gameName: open?.game_name ?? null,
    startedAt: open?.started_at ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export function getRecentSessions(steamid, limit) {
  return db.prepare(`
    SELECT id, appid, game_name, started_at, ended_at, duration_s
    FROM sessions WHERE steamid64 = ? ORDER BY started_at DESC LIMIT ?
  `).all(steamid, limit).map((row) => ({ ...row, live: row.ended_at === null }));
}
