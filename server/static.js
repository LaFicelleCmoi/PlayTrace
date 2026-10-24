import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { ROOT } from './config.js';

const DIST = resolve(ROOT, 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

async function fileInfo(path) {
  try {
    const info = await stat(path);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Introuvable');
}

/** Sert le build Vite (`dist/`), avec repli sur `index.html` pour les routes du front. */
export async function serveStatic(req, res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return notFound(res);
  }

  let path = resolve(DIST, `.${decoded}`);
  // Empêche toute sortie du dossier dist (../, chemins absolus encodés…).
  if (path !== DIST && !path.startsWith(DIST + sep)) return notFound(res);

  let info = await fileInfo(path);
  if (!info) {
    if (extname(decoded)) return notFound(res);
    path = resolve(DIST, 'index.html');
    info = await fileInfo(path);
    if (!info) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Front non buildé : lance « npm run build » (ou « npm run dev » en développement).');
    }
  }

  const immutable = path.startsWith(resolve(DIST, 'assets') + sep);
  res.writeHead(200, {
    'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(path).pipe(res);
}
