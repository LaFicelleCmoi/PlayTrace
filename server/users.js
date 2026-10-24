import { sql } from './db.js';

export async function getUser(steamid) {
  const [user] = await sql`
    SELECT steamid64, pseudo, avatar, created_at, public_profile FROM playtrace.users WHERE steamid64 = ${steamid}
  `;
  return user ?? null;
}

export async function setPublicProfile(steamid, enabled) {
  await sql`UPDATE playtrace.users SET public_profile = ${enabled} WHERE steamid64 = ${steamid}`;
}

export async function listUserIds() {
  const rows = await sql`SELECT steamid64 FROM playtrace.users`;
  return rows.map((row) => row.steamid64);
}

export async function upsertUser(steamid, profile) {
  await sql`
    INSERT INTO playtrace.users (steamid64, pseudo, avatar)
    VALUES (${steamid}, ${profile?.personaname ?? steamid}, ${profile?.avatarfull ?? null})
    ON CONFLICT (steamid64) DO UPDATE
      SET pseudo = excluded.pseudo, avatar = COALESCE(excluded.avatar, playtrace.users.avatar)
  `;
}

export async function updateProfile(player) {
  await sql`
    UPDATE playtrace.users SET pseudo = ${player.personaname}, avatar = ${player.avatarfull ?? null}
    WHERE steamid64 = ${player.steamid}
  `;
}
