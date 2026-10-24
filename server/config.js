import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..');

const envFile = resolve(ROOT, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const isProduction = process.env.NODE_ENV === 'production';
// Sur Vercel, chaque requête est une fonction éphémère : pas de sondage ni de flux SSE persistant.
const serverless = Boolean(process.env.VERCEL);

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

function resolveBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:5173';
}

const steamApiKey = process.env.STEAM_API_KEY ?? '';
if (!/^[A-F0-9]{32}$/i.test(steamApiKey)) {
  throw new Error('STEAM_API_KEY manquante ou invalide (32 caractères hexadécimaux attendus) : vérifie ton .env');
}

const databaseUrl = process.env.DATABASE_URL ?? '';
if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
  throw new Error('DATABASE_URL manquante : chaîne de connexion Postgres attendue (voir .env.example)');
}

const localSteamId = process.env.STEAM_LOCAL_STEAMID || null;
if (localSteamId && !/^7656119\d{10}$/.test(localSteamId)) {
  throw new Error('STEAM_LOCAL_STEAMID invalide (SteamID64 de 17 chiffres attendu)');
}

const baseUrl = resolveBaseUrl().replace(/\/+$/, '');

export const config = Object.freeze({
  isProduction,
  serverless,
  steamApiKey,
  databaseUrl,
  port: int('PORT', 3000),
  host: process.env.HOST ?? '127.0.0.1',
  baseUrl,
  sessionSecret: resolveSessionSecret(),
  // En dessous de 30 s, le quota quotidien de l'API Steam fond trop vite.
  pollIntervalMs: Math.max(30_000, int('POLL_INTERVAL_MS', 60_000)),
  trustProxy: serverless || process.env.TRUST_PROXY === '1',
  // Jeton du cron qui déclenche le sondage sur Vercel (GET /api/cron/poll).
  cronSecret: process.env.CRON_SECRET || null,
  // Jeton partagé avec l'agent local qui envoie les téléchargements Steam.
  agentToken: process.env.AGENT_TOKEN || null,
  agentUrl: (process.env.AGENT_URL || baseUrl).replace(/\/+$/, ''),
  // Client Steam local, pour les téléchargements en cours (détecté automatiquement si vide).
  steamPath: process.env.STEAM_PATH || null,
  localSteamId,
});
