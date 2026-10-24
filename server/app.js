import { createHash, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import {
  clearSessionCookie,
  clearStateCookie,
  isValidSteamId,
  readSession,
  readState,
  sessionCookie,
  startLogin,
  verifyLogin,
} from './auth.js';
import { getDownloads, saveDownloads } from './downloads.js';
import { ART_KINDS, getArtUrl, getGameDetail, getLibraryGames } from './games.js';
import { ensureLibrary, getLibrarySummary } from './library.js';
import { pollOnce } from './poller.js';
import { applySecurityHeaders, clientIp, createRateLimiter, isSameOrigin } from './security.js';
import { getLiveStatus, getRecentSessions } from './sessions.js';
import { sendOnce, subscribe } from './sse.js';
import { serveStatic } from './static.js';
import { getYearStats } from './stats.js';
import { getPlayerSummaries } from './steam.js';
import { getUser, upsertUser } from './users.js';

const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
// Une grille de jaquettes déclenche des dizaines de requêtes d'images d'un coup.
const artLimiter = createRateLimiter({ windowMs: 60_000, max: 600 });
const MAX_AGENT_BODY = 64 * 1024;
const DOWNLOAD_STATES = new Set(['downloading', 'installing', 'paused', 'queued']);

// --- Helpers HTTP ------------------------------------------------------------

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function redirect(res, location, cookies = []) {
  res.writeHead(302, { Location: location, 'Set-Cookie': cookies, 'Cache-Control': 'no-store' });
  res.end();
}

async function requireUser(req, res) {
  const steamid = readSession(req);
  const user = steamid && (await getUser(steamid));
  if (!user) sendJson(res, 401, { error: 'Non connecté' });
  return user || null;
}

function intParam(url, name, { min, max, fallback }) {
  const raw = url.searchParams.get(name);
  if (raw === null) return fallback;
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}

/** Compare un en-tête `Authorization: Bearer …` à un secret, en temps constant. */
function hasBearer(req, secret) {
  if (!secret) return false;
  const digest = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(req.headers.authorization ?? ''), digest(`Bearer ${secret}`));
}

async function readJsonBody(req, limit) {
  // Sur Vercel, le corps peut déjà avoir été lu et parsé par le runtime.
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('Corps trop volumineux');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sanitizeDownload(item) {
  const bytes = (value) => (Number.isSafeInteger(value) && value >= 0 ? value : 0);
  if (!item || !Number.isSafeInteger(item.appid) || !DOWNLOAD_STATES.has(item.state)) return null;
  return {
    appid: item.appid,
    name: String(item.name ?? `App ${item.appid}`).slice(0, 200),
    state: item.state,
    bytesDownloaded: bytes(item.bytesDownloaded),
    bytesToDownload: bytes(item.bytesToDownload),
    bytesStaged: bytes(item.bytesStaged),
    bytesToStage: bytes(item.bytesToStage),
    speed: bytes(item.speed),
  };
}

// --- Routes ------------------------------------------------------------------

const routes = {
  'GET /api/health': (req, res) => sendJson(res, 200, { ok: true }),

  'GET /api/me': async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    sendJson(res, 200, { steamid: user.steamid64, pseudo: user.pseudo, avatar: user.avatar, createdAt: user.created_at });
  },

  'GET /api/stats': async (req, res, url) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const year = intParam(url, 'year', { min: 2003, max: 2100, fallback: new Date().getUTCFullYear() });
    const tz = intParam(url, 'tz', { min: -840, max: 840, fallback: 0 });
    if (year === null || tz === null) return sendJson(res, 400, { error: 'Paramètres invalides' });

    await ensureLibrary(user.steamid64);
    const [stats, library] = await Promise.all([getYearStats(user.steamid64, year, tz), getLibrarySummary(user.steamid64)]);
    sendJson(res, 200, { ...stats, library });
  },

  'GET /api/sessions': async (req, res, url) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const limit = intParam(url, 'limit', { min: 1, max: 100, fallback: 20 });
    if (limit === null) return sendJson(res, 400, { error: 'Paramètres invalides' });
    sendJson(res, 200, { sessions: await getRecentSessions(user.steamid64, limit) });
  },

  'GET /api/games': async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    sendJson(res, 200, { games: await getLibraryGames(user.steamid64) });
  },

  'GET /api/live': async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const events = {
      status: await getLiveStatus(user.steamid64),
      downloads: await getDownloads(user.steamid64),
    };
    // Une fonction Vercel ne peut pas garder un flux ouvert : on envoie l'état et le navigateur se reconnecte.
    if (config.serverless) return sendOnce(res, events);
    subscribe(req, res, user.steamid64, events);
  },

  // Appelé chaque minute par le cron Supabase (pg_cron) quand l'app tourne sur Vercel.
  'GET /api/cron/poll': async (req, res) => {
    if (!hasBearer(req, config.cronSecret)) return sendJson(res, 401, { error: 'Non autorisé' });
    sendJson(res, 200, await pollOnce());
  },

  // L'agent local (npm run agent) y envoie les téléchargements de son client Steam.
  'POST /api/agent/downloads': async (req, res) => {
    if (!hasBearer(req, config.agentToken)) return sendJson(res, 401, { error: 'Non autorisé' });
    let body;
    try {
      body = await readJsonBody(req, MAX_AGENT_BODY);
    } catch {
      return sendJson(res, 400, { error: 'JSON invalide' });
    }
    if (!isValidSteamId(body?.owner) || !Array.isArray(body.downloads) || body.downloads.length > 200) {
      return sendJson(res, 400, { error: 'Données invalides' });
    }
    await saveDownloads(body.owner, body.downloads.map(sanitizeDownload).filter(Boolean));
    sendJson(res, 200, { ok: true });
  },

  'GET /auth/steam': (req, res) => {
    const { location, cookie } = startLogin();
    redirect(res, location, [cookie]);
  },

  'GET /auth/steam/return': async (req, res, url) => {
    const steamid = await verifyLogin(url.searchParams, readState(req));
    if (!steamid) return redirect(res, '/?login=failed', [clearStateCookie()]);

    const [profile] = await getPlayerSummaries([steamid]).catch(() => []);
    await upsertUser(steamid, profile);
    // Premier sondage immédiat pour que le bandeau live soit juste dès l'arrivée sur le dashboard.
    await pollOnce([steamid]).catch((error) => console.error('[poller]', error.message));
    redirect(res, '/', [clearStateCookie(), sessionCookie(steamid)]);
  },

  'POST /auth/logout': (req, res) => {
    if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Origine refusée' });
    res.setHeader('Set-Cookie', clearSessionCookie());
    sendJson(res, 200, { ok: true });
  },
};

// Routes à paramètre : [méthode, motif, gestionnaire(req, res, url, ...captures)].
const patternRoutes = [
  [
    'GET',
    /^\/api\/art\/(\d{1,10})\/([a-z]+)$/,
    async (req, res, url, rawAppid, kind) => {
      const appid = Number(rawAppid);
      if (appid < 1 || appid > 0x7fffffff || !ART_KINDS.includes(kind)) return sendJson(res, 404, { error: 'Introuvable' });
      // Données publiques : le navigateur et le CDN de Vercel gardent la redirection en cache.
      res.writeHead(302, {
        Location: await getArtUrl(appid, kind),
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      });
      res.end();
    },
  ],
  [
    'GET',
    /^\/api\/games\/(\d{1,10})$/,
    async (req, res, url, rawAppid) => {
      const user = await requireUser(req, res);
      if (!user) return;
      const appid = Number(rawAppid);
      if (appid < 1 || appid > 0x7fffffff) return sendJson(res, 400, { error: 'Jeu invalide' });
      const game = await getGameDetail(user.steamid64, appid);
      if (!game) return sendJson(res, 404, { error: 'Jeu introuvable' });
      sendJson(res, 200, game);
    },
  ],
];

function findRoute(method, pathname) {
  const exact = routes[`${method} ${pathname}`];
  if (exact) return exact;
  for (const [routeMethod, pattern, routeHandler] of patternRoutes) {
    const match = routeMethod === method && pattern.exec(pathname);
    if (match) return (req, res, url) => routeHandler(req, res, url, ...match.slice(1));
  }
  return null;
}

/** Chemin demandé ; sur Vercel, les rewrites de vercel.json le transmettent dans `__path`. */
function requestUrl(req) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const forwarded = url.searchParams.get('__path');
  if (config.serverless && forwarded !== null) {
    url.pathname = `/${forwarded.replace(/^\/+/, '')}`;
    url.searchParams.delete('__path');
  }
  return url;
}

async function handle(req, res) {
  applySecurityHeaders(res);
  const url = requestUrl(req);
  const isAuth = url.pathname.startsWith('/auth/');

  if (url.pathname.startsWith('/api/') || isAuth) {
    const limiter = isAuth ? authLimiter : url.pathname.startsWith('/api/art/') ? artLimiter : apiLimiter;
    const allowed = limiter.hit(clientIp(req));
    if (allowed !== true) {
      res.setHeader('Retry-After', String(allowed));
      return sendJson(res, 429, { error: 'Trop de requêtes, réessaie dans un instant' });
    }
    const route = findRoute(req.method, url.pathname);
    if (!route) return sendJson(res, 404, { error: 'Introuvable' });
    return route(req, res, url);
  }

  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, url.pathname);
  sendJson(res, 405, { error: 'Méthode non autorisée' });
}

/** Gestionnaire HTTP commun au serveur Node local et à la fonction Vercel. */
export async function handler(req, res) {
  try {
    await handle(req, res);
  } catch (error) {
    console.error('[http]', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'Erreur serveur' });
    else res.end();
  }
}
