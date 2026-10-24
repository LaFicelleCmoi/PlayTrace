import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    steamid64  TEXT PRIMARY KEY,
    pseudo     TEXT NOT NULL,
    avatar     TEXT,
    created_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    steamid64    TEXT NOT NULL REFERENCES users(steamid64) ON DELETE CASCADE,
    appid        INTEGER NOT NULL,
    game_name    TEXT NOT NULL,
    started_at   DATETIME NOT NULL,
    ended_at     DATETIME,
    duration_s   INTEGER,
    -- Dernier sondage qui a vu le jeu tourner : sert à fermer proprement après une coupure du serveur.
    last_seen_at DATETIME NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user_start ON sessions(steamid64, started_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_open ON sessions(steamid64) WHERE ended_at IS NULL;

  CREATE TABLE IF NOT EXISTS owned_games (
    steamid64        TEXT NOT NULL REFERENCES users(steamid64) ON DELETE CASCADE,
    appid            INTEGER NOT NULL,
    name             TEXT NOT NULL,
    playtime_minutes INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (steamid64, appid)
  );

  CREATE TABLE IF NOT EXISTS owned_games_meta (
    steamid64  TEXT PRIMARY KEY REFERENCES users(steamid64) ON DELETE CASCADE,
    fetched_at DATETIME NOT NULL
  );
`);

export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
