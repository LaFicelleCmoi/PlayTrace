import { db } from './db.js';

export function getUser(steamid) {
  return db.prepare('SELECT steamid64, pseudo, avatar, created_at FROM users WHERE steamid64 = ?').get(steamid);
}

export function listUserIds() {
  return db.prepare('SELECT steamid64 FROM users').all().map((row) => row.steamid64);
}

export function upsertUser(steamid, profile) {
  db.prepare(`
    INSERT INTO users (steamid64, pseudo, avatar, created_at) VALUES (?, ?, ?, ?)
    ON CONFLICT (steamid64) DO UPDATE SET pseudo = excluded.pseudo, avatar = COALESCE(excluded.avatar, users.avatar)
  `).run(steamid, profile?.personaname ?? steamid, profile?.avatarfull ?? null, new Date().toISOString());
}

export function updateProfile(player) {
  db.prepare('UPDATE users SET pseudo = ?, avatar = ? WHERE steamid64 = ?')
    .run(player.personaname, player.avatarfull ?? null, player.steamid);
}
