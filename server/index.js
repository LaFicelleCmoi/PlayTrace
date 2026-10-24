import { createServer } from 'node:http';
import { config } from './config.js';
import {
  clearSessionCookie,
  clearStateCookie,
  readSession,
  readState,
  sessionCookie,
  startLogin,
  verifyLogin,
} from './auth.js';
import { db } from './db.js';
import { getDownloads, startDownloadWatcher, stopDownloadWatcher } from './downloads.js';
import { ensureLibrary, getLibrarySummary } from './library.js';
import { pollOnce, startPoller, stopPoller } from './poller.js';
import { applySecurityHeaders, clientIp, createRateLimiter, isSameOrigin } from './security.js';
import { getLiveStatus, getRecentSessions } from './sessions.js';
import { closeAllStreams, publish, subscribe } from './sse.js';
import { serveStatic } from './static.js';
import { getYearStats } from './stats.js';
import { getPlayerSummaries } from './steam.js';
import { getUser, upsertUser } from './users.js';

const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

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

function requireUser(req, res) {
  const steamid = readSession(req);
  const user = steamid && getUser(steamid);
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

// --- Routes ------------------------------------------------------------------

const routes = {
  'GET /api/health': (req, res) => sendJson(res, 200, { ok: true }),

  'GET /api/me': (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    sendJson(res, 200, { steamid: user.steamid64, pseudo: user.pseudo, avatar: user.avatar, createdAt: user.created_at });
  },

  'GET /api/stats': async (req, res, url) => {
    const user = requireUser(req, res);
    if (!user) return;
    const year = intParam(url, 'year', { min: 2003, max: 2100, fallback: new Date().getUTCFullYear() });
    const tz = intParam(url, 'tz', { min: -840, max: 840, fallback: 0 });
    if (year === null || tz === null) return sendJson(res, 400, { error: 'Paramètres invalides' });

    await ensureLibrary(user.steamid64);
    sendJson(res, 200, { ...getYearStats(user.steamid64, year, tz), library: getLibrarySummary(user.steamid64) });
  },

  'GET /api/sessions': (req, res, url) => {
    const user = requireUser(req, res);
    if (!user) return;
    const limit = intParam(url, 'limit', { min: 1, max: 100, fallback: 20 });
    if (limit === null) return sendJson(res, 400, { error: 'Paramètres invalides' });
    sendJson(res, 200, { sessions: getRecentSessions(user.steamid64, limit) });
  },

  'GET /api/live': (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    subscribe(req, res, user.steamid64, {
      status: getLiveStatus(user.steamid64),
      downloads: getDownloads(user.steamid64),
    });
  },

  'GET /auth/steam': (req, res) => {
    const { location, cookie } = startLogin();
    redirect(res, location, [cookie]);
  },

  'GET /auth/steam/return': async (req, res, url) => {
    const steamid = await verifyLogin(url.searchParams, readState(req));
    if (!steamid) return redirect(res, '/?login=failed', [clearStateCookie()]);

    const [profile] = await getPlayerSummaries([steamid]).catch(() => []);
    upsertUser(steamid, profile);
    // Premier sondage immédiat pour que le bandeau live soit juste dès l'arrivée sur le dashboard.
    pollOnce([steamid]).catch((error) => console.error('[poller]', error.message));
    redirect(res, '/', [clearStateCookie(), sessionCookie(steamid)]);
  },

  'POST /auth/logout': (req, res) => {
    if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Origine refusée' });
    res.setHeader('Set-Cookie', clearSessionCookie());
    sendJson(res, 200, { ok: true });
  },
};

async function handle(req, res) {
  applySecurityHeaders(res);
  const url = new URL(req.url ?? '/', 'http://localhost');
  const isAuth = url.pathname.startsWith('/auth/');

  if (url.pathname.startsWith('/api/') || isAuth) {
    const allowed = (isAuth ? authLimiter : apiLimiter).hit(clientIp(req));
    if (allowed !== true) {
      res.setHeader('Retry-After', String(allowed));
      return sendJson(res, 429, { error: 'Trop de requêtes, réessaie dans un instant' });
    }
    const route = routes[`${req.method} ${url.pathname}`];
    if (!route) return sendJson(res, 404, { error: 'Introuvable' });
    return route(req, res, url);
  }

  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, url.pathname);
  sendJson(res, 405, { error: 'Méthode non autorisée' });
}

const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error('[http]', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'Erreur serveur' });
    else res.end();
  });
});

server.listen(config.port, config.host, () => {
  console.log(`PlayTrace écoute sur http://${config.host}:${config.port} (front : ${config.baseUrl})`);
  startPoller();
  startDownloadWatcher((next, previous) => {
    // Changement de compte sur le client Steam : l'ancien compte ne doit plus voir ces téléchargements.
    if (previous.owner && previous.owner !== next.owner) publish(previous.owner, 'downloads', []);
    if (next.owner) publish(next.owner, 'downloads', next.downloads);
  });
});

function shutdown() {
  stopPoller();
  stopDownloadWatcher();
  closeAllStreams();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
