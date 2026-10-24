-- Schéma Postgres de PlayTrace (Supabase). Schéma dédié : il n'est pas exposé par l'API REST de Supabase.
CREATE SCHEMA IF NOT EXISTS playtrace;

CREATE TABLE IF NOT EXISTS playtrace.users (
  steamid64  TEXT PRIMARY KEY CHECK (steamid64 ~ '^7656119[0-9]{10}$'),
  pseudo     TEXT NOT NULL,
  avatar     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playtrace.sessions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  steamid64    TEXT NOT NULL REFERENCES playtrace.users (steamid64) ON DELETE CASCADE,
  appid        INTEGER NOT NULL,
  game_name    TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL,
  ended_at     TIMESTAMPTZ,
  duration_s   INTEGER,
  -- Dernier sondage qui a vu le jeu tourner : sert à fermer proprement après une coupure.
  last_seen_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_start_idx ON playtrace.sessions (steamid64, started_at);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_open_idx ON playtrace.sessions (steamid64) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS sessions_user_app_idx ON playtrace.sessions (steamid64, appid);

CREATE TABLE IF NOT EXISTS playtrace.owned_games (
  steamid64        TEXT NOT NULL REFERENCES playtrace.users (steamid64) ON DELETE CASCADE,
  appid            INTEGER NOT NULL,
  name             TEXT NOT NULL,
  playtime_minutes INTEGER NOT NULL DEFAULT 0,
  last_played      TIMESTAMPTZ,
  PRIMARY KEY (steamid64, appid)
);

CREATE TABLE IF NOT EXISTS playtrace.owned_games_meta (
  steamid64  TEXT PRIMARY KEY REFERENCES playtrace.users (steamid64) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ NOT NULL
);

-- Téléchargements envoyés par le client Steam local (agent ou serveur local).
CREATE TABLE IF NOT EXISTS playtrace.downloads (
  steamid64  TEXT PRIMARY KEY,
  items      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Nonces OpenID déjà utilisés, pour refuser le rejeu d'une réponse Steam.
CREATE TABLE IF NOT EXISTS playtrace.openid_nonces (
  nonce   TEXT PRIMARY KEY,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Données Steam communes à tous les joueurs (fiche Store, liste des succès, rareté mondiale).
CREATE TABLE IF NOT EXISTS playtrace.game_cache (
  appid      INTEGER NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('store', 'schema', 'rarity', 'assets')),
  data       JSONB,
  fetched_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (appid, kind)
);

-- Progression des succès par jeu (cache de GetPlayerAchievements pour la bibliothèque).
CREATE TABLE IF NOT EXISTS playtrace.achievement_progress (
  steamid64  TEXT NOT NULL REFERENCES playtrace.users (steamid64) ON DELETE CASCADE,
  appid      INTEGER NOT NULL,
  unlocked   INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (steamid64, appid)
);
