import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { sql } from './db.js';

const OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const IDENTIFIER_SELECT = `${OPENID_NS}/identifier_select`;
const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;
const STEAMID_RE = /^7656119\d{10}$/;
const REQUIRED_SIGNED = ['op_endpoint', 'claimed_id', 'identity', 'return_to', 'response_nonce', 'assoc_handle'];
const NONCE_MAX_AGE_MS = 5 * 60 * 1000;

const SESSION_COOKIE = 'pt_session';
const STATE_COOKIE = 'pt_oidc_state';
const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

const returnUrl = `${config.baseUrl}/auth/steam/return`;
const secureCookies = config.baseUrl.startsWith('https://');

export function isValidSteamId(value) {
  return typeof value === 'string' && STEAMID_RE.test(value);
}

// --- Cookies -----------------------------------------------------------------

function serializeCookie(name, value, { maxAge, path = '/' } = {}) {
  const parts = [`${name}=${value}`, `Path=${path}`, 'HttpOnly', 'SameSite=Lax'];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (secureCookies) parts.push('Secure');
  return parts.join('; ');
}

export function readCookie(req, name) {
  for (const pair of (req.headers.cookie ?? '').split(';')) {
    const index = pair.indexOf('=');
    if (index !== -1 && pair.slice(0, index).trim() === name) return pair.slice(index + 1).trim();
  }
  return null;
}

function sign(value) {
  return createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Cookie de session signé (HMAC) : `steamid.expiration.signature`, rien n'est stocké côté serveur. */
export function sessionCookie(steamid) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_S;
  const payload = `${steamid}.${expires}`;
  return serializeCookie(SESSION_COOKIE, `${payload}.${sign(payload)}`, { maxAge: SESSION_MAX_AGE_S });
}

export function clearSessionCookie() {
  return serializeCookie(SESSION_COOKIE, '', { maxAge: 0 });
}

/** SteamID64 de la requête si le cookie est valide et non expiré, sinon `null`. */
export function readSession(req) {
  const [steamid, expires, signature] = (readCookie(req, SESSION_COOKIE) ?? '').split('.');
  if (!isValidSteamId(steamid) || !/^\d+$/.test(expires ?? '') || !signature) return null;
  if (!safeEqual(signature, sign(`${steamid}.${expires}`))) return null;
  if (Number(expires) * 1000 < Date.now()) return null;
  return steamid;
}

// --- Steam OpenID 2.0 --------------------------------------------------------

/** URL de connexion Steam + cookie anti-CSRF qui l'accompagne. */
export function startLogin() {
  const state = randomBytes(16).toString('base64url');
  const params = new URLSearchParams({
    'openid.ns': OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${returnUrl}?state=${state}`,
    'openid.realm': config.baseUrl,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT,
  });
  return {
    location: `${OPENID_ENDPOINT}?${params}`,
    cookie: serializeCookie(STATE_COOKIE, state, { maxAge: 600, path: '/auth' }),
  };
}

export function clearStateCookie() {
  return serializeCookie(STATE_COOKIE, '', { maxAge: 0, path: '/auth' });
}

export function readState(req) {
  return readCookie(req, STATE_COOKIE);
}

/** Enregistre le nonce en base (partagé entre toutes les instances) ; `false` s'il a déjà servi. */
async function rememberNonce(nonce) {
  await sql`DELETE FROM playtrace.openid_nonces WHERE seen_at < ${new Date(Date.now() - 2 * NONCE_MAX_AGE_MS)}`;
  const inserted = await sql`
    INSERT INTO playtrace.openid_nonces (nonce) VALUES (${nonce}) ON CONFLICT (nonce) DO NOTHING RETURNING nonce
  `;
  return inserted.length === 1;
}

/**
 * Vérifie la réponse de Steam côté serveur et renvoie le SteamID64, ou `null`.
 * La signature est validée par Steam lui-même (`check_authentication`).
 */
export async function verifyLogin(query, expectedState) {
  if (!expectedState || !safeEqual(query.get('state') ?? '', expectedState)) return null;
  if (query.get('openid.mode') !== 'id_res') return null;
  if (query.get('openid.op_endpoint') !== OPENID_ENDPOINT) return null;
  if (query.get('openid.return_to') !== `${returnUrl}?state=${expectedState}`) return null;

  const claimedId = query.get('openid.claimed_id') ?? '';
  const steamid = CLAIMED_ID_RE.exec(claimedId)?.[1];
  if (!isValidSteamId(steamid) || query.get('openid.identity') !== claimedId) return null;

  const signed = (query.get('openid.signed') ?? '').split(',');
  if (!REQUIRED_SIGNED.every((field) => signed.includes(field))) return null;

  const nonce = query.get('openid.response_nonce') ?? '';
  const issuedAt = Date.parse(nonce.slice(0, 20));
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > NONCE_MAX_AGE_MS) return null;
  if (!(await rememberNonce(nonce))) return null;

  const body = new URLSearchParams();
  for (const [key, value] of query) {
    if (key.startsWith('openid.')) body.set(key, value);
  }
  body.set('openid.mode', 'check_authentication');

  const res = await fetch(OPENID_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const text = await res.text();
  return /^is_valid\s*:\s*true$/m.test(text) ? steamid : null;
}
