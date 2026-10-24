import { config } from './config.js';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.steamstatic.com https://*.akamaihd.net",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function applySecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (config.baseUrl.startsWith('https://')) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

export function clientIp(req) {
  if (config.trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/** Limiteur à fenêtre fixe, en mémoire, par IP. */
export function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now >= entry.resetAt) hits.delete(ip);
    }
  }, windowMs);
  cleanup.unref();

  return {
    /** `true` si la requête passe, sinon le nombre de secondes à attendre. */
    hit(ip) {
      const now = Date.now();
      let entry = hits.get(ip);
      if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(ip, entry);
      }
      entry.count += 1;
      return entry.count <= max ? true : Math.ceil((entry.resetAt - now) / 1000);
    },
  };
}

/** Bloque les POST venus d'une autre origine (en plus du SameSite des cookies). */
export function isSameOrigin(req) {
  const origin = req.headers.origin;
  return !origin || origin === new URL(config.baseUrl).origin;
}
