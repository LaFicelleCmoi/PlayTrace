import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..');

const envFile = resolve(ROOT, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const isProduction = process.env.NODE_ENV === 'production';

function int(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function resolveSessionSecret() {
  const secret = process.env.SESSION_SECRET ?? '';
  if (secret.length >= 32) return secret;
  if (isProduction) throw new Error('SESSION_SECRET doit contenir au moins 32 caractères');
  console.warn('[config] SESSION_SECRET trop court : secret aléatoire utilisé, les sessions ne survivront pas au redémarrage');
  return randomBytes(32).toString('hex');
}

const steamApiKey = process.env.STEAM_API_KEY ?? '';
if (!/^[A-F0-9]{32}$/i.test(steamApiKey)) {
  throw new Error('STEAM_API_KEY manquante ou invalide (32 caractères hexadécimaux attendus) : vérifie ton .env');
}

const localSteamId = process.env.STEAM_LOCAL_STEAMID || null;
if (localSteamId && !/^7656119\d{10}$/.test(localSteamId)) {
  throw new Error('STEAM_LOCAL_STEAMID invalide (SteamID64 de 17 chiffres attendu)');
}

export const config = Object.freeze({
  isProduction,
  steamApiKey,
  port: int('PORT', 3000),
  host: process.env.HOST ?? '127.0.0.1',
  baseUrl: (process.env.BASE_URL ?? 'http://localhost:5173').replace(/\/+$/, ''),
  sessionSecret: resolveSessionSecret(),
  // En dessous de 30 s, le quota quotidien de l'API Steam fond trop vite.
  pollIntervalMs: Math.max(30_000, int('POLL_INTERVAL_MS', 60_000)),
  dbPath: resolve(ROOT, process.env.DB_PATH ?? 'data/playtrace.db'),
  trustProxy: process.env.TRUST_PROXY === '1',
  // Client Steam local, pour les téléchargements en cours (détecté automatiquement si vide).
  steamPath: process.env.STEAM_PATH || null,
  localSteamId,
});
