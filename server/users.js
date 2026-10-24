import { sql } from './db.js';

export async function getUser(steamid) {
  const [user] = await sql`
    SELECT steamid64, pseudo, avatar, created_at, public_profile, last_login_at, tracking_paused, session_version
    FROM playtrace.users WHERE steamid64 = ${steamid}
  `;
  return user ?? null;
}

export async function setPublicProfile(steamid, enabled) {
  await sql`UPDATE playtrace.users SET public_profile = ${enabled} WHERE steamid64 = ${steamid}`;
}

/** Joueurs à sonder : ceux qui n'ont pas mis le suivi en pause. */
export async function listUserIds() {
  const rows = await sql`SELECT steamid64 FROM playtrace.users WHERE NOT tracking_paused`;
  return rows.map((row) => row.steamid64);
}

export async function setTrackingPaused(steamid, paused) {
  await sql.begin(async (tx) => {
    await tx`UPDATE playtrace.users SET tracking_paused = ${paused} WHERE steamid64 = ${steamid}`;
    // Mise en pause : la partie en cours est close tout de suite.
    if (paused) {
      await tx`
        UPDATE playtrace.sessions
        SET ended_at = now(), duration_s = GREATEST(0, EXTRACT(EPOCH FROM now() - started_at))::int
        WHERE steamid64 = ${steamid} AND ended_at IS NULL
      `;
    }
  });
}

/** Révoque toutes les sessions ouvertes (tous appareils). */
export async function revokeSessions(steamid) {
  await sql`UPDATE playtrace.users SET session_version = session_version + 1 WHERE steamid64 = ${steamid}`;
}

/** Droit à l'effacement : le compte et tout ce qui s'y rattache. */
export async function deleteUser(steamid) {
  await sql.begin(async (tx) => {
    await tx`DELETE FROM playtrace.downloads WHERE steamid64 = ${steamid}`;
    // sessions, bibliothèque, progression des succès : supprimées en cascade.
    await tx`DELETE FROM playtrace.users WHERE steamid64 = ${steamid}`;
  });
}

/** Droit d'accès et à la portabilité : toutes les données du joueur, dans un format lisible. */
export async function exportUserData(steamid) {
  const [[user], sessions, library, achievements, downloads] = await Promise.all([
    sql`
      SELECT steamid64, pseudo, avatar, created_at, last_login_at, public_profile, tracking_paused
      FROM playtrace.users WHERE steamid64 = ${steamid}
    `,
    sql`
      SELECT appid, game_name, started_at, ended_at, duration_s FROM playtrace.sessions
      WHERE steamid64 = ${steamid} ORDER BY started_at
    `,
    sql`SELECT appid, name, playtime_minutes, last_played FROM playtrace.owned_games WHERE steamid64 = ${steamid} ORDER BY name`,
    sql`SELECT appid, unlocked, total, fetched_at FROM playtrace.achievement_progress WHERE steamid64 = ${steamid} ORDER BY appid`,
    sql`SELECT items, updated_at FROM playtrace.downloads WHERE steamid64 = ${steamid}`,
  ]);
  return {
    exportedAt: new Date().toISOString(),
    service: 'PlayTrace',
    account: user ?? null,
    sessions,
    library,
    achievementProgress: achievements,
    downloads: downloads[0] ?? null,
  };
}

/** Crée ou met à jour le joueur à la connexion ; renvoie `{ session_version, tracking_paused }`. */
export async function upsertUser(steamid, profile) {
  const [user] = await sql`
    INSERT INTO playtrace.users (steamid64, pseudo, avatar, last_login_at)
    VALUES (${steamid}, ${profile?.personaname ?? steamid}, ${profile?.avatarfull ?? null}, now())
    ON CONFLICT (steamid64) DO UPDATE
      SET pseudo = excluded.pseudo, avatar = COALESCE(excluded.avatar, playtrace.users.avatar), last_login_at = now()
    RETURNING session_version, tracking_paused
  `;
  return user;
}

export async function updateProfile(player) {
  await sql`
    UPDATE playtrace.users SET pseudo = ${player.personaname}, avatar = ${player.avatarfull ?? null}
    WHERE steamid64 = ${player.steamid}
  `;
}
