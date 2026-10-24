import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isValidSteamId } from './auth.js';
import { config } from './config.js';
import { sql } from './db.js';
import { parseVdf } from './vdf.js';

// L'API Web Steam ne dit rien des téléchargements : on lit les fichiers du client Steam installé sur cette machine
// (serveur local ou agent), puis on les range en base pour que le site, même sur Vercel, puisse les afficher.
const SCAN_INTERVAL_MS = 3000;
// Même sans changement, l'état est renvoyé régulièrement : sans nouvelles, le site considère le client Steam éteint.
const HEARTBEAT_MS = 15_000;
const STALE_AFTER_MS = 45_000;
// Au-delà, sans nouvel octet écrit dans le manifeste, on n'affiche plus de vitesse.
const SPEED_STALE_MS = 30_000;

// Drapeaux EAppState du client Steam (champ StateFlags des appmanifest).
const UPDATE_REQUIRED = 2;
const UPDATE_RUNNING = 256;
const UPDATE_PAUSED = 512;
const UPDATE_STARTED = 1024;
const PREALLOCATING = 1 << 19;
const DOWNLOADING = 1 << 20;
const STAGING = 1 << 21;
const COMMITTING = 1 << 22;
const ACTIVE = UPDATE_RUNNING | UPDATE_STARTED | PREALLOCATING | DOWNLOADING;
const INSTALLING = STAGING | COMMITTING;

const STATE_ORDER = { downloading: 0, installing: 1, paused: 2, queued: 3 };
const MANIFEST_RE = /^appmanifest_\d+\.acf$/;

const samples = new Map();
let current = { owner: null, downloads: [] };
let timer = null;

function steamCandidates() {
  if (config.steamPath) return [config.steamPath];
  const home = homedir();
  if (process.platform === 'win32') return ['C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam'];
  if (process.platform === 'darwin') return [join(home, 'Library/Application Support/Steam')];
  // /mnt/c : Steam installé sous Windows, vu depuis WSL.
  return [
    '/mnt/c/Program Files (x86)/Steam',
    '/mnt/c/Program Files/Steam',
    join(home, '.steam/steam'),
    join(home, '.local/share/Steam'),
  ];
}

/** `D:\SteamLibrary` → `/mnt/d/SteamLibrary` quand le serveur tourne sous WSL. */
function toLocalPath(path) {
  const drive = /^([A-Za-z]):[\\/](.*)$/.exec(path);
  if (process.platform === 'win32' || !drive) return path;
  return `/mnt/${drive[1].toLowerCase()}/${drive[2].replaceAll('\\', '/')}`;
}

async function readVdf(path) {
  return parseVdf(await readFile(path, 'utf8'));
}

async function libraryDirs(steamRoot) {
  const dirs = new Set([join(steamRoot, 'steamapps')]);
  try {
    const { libraryfolders = {} } = await readVdf(join(steamRoot, 'steamapps', 'libraryfolders.vdf'));
    for (const library of Object.values(libraryfolders)) {
      if (library?.path) dirs.add(join(toLocalPath(library.path), 'steamapps'));
    }
  } catch {
    // Pas de libraryfolders.vdf : seule la bibliothèque par défaut est lue.
  }
  return [...dirs];
}

/** Compte connecté au client Steam local : c'est le seul joueur qui verra ces téléchargements. */
async function detectOwner(steamRoot) {
  if (config.localSteamId) return config.localSteamId;
  try {
    const { users = {} } = await readVdf(join(steamRoot, 'config', 'loginusers.vdf'));
    const accounts = Object.entries(users).filter(([steamid]) => isValidSteamId(steamid));
    const recent = accounts.find(([, user]) => user.mostrecent === '1')
      ?? accounts.sort(([, a], [, b]) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0))[0];
    return recent?.[0] ?? null;
  } catch {
    return null;
  }
}

function classify(flags, bytesDownloaded, bytesToDownload) {
  if (flags & ACTIVE && bytesDownloaded < bytesToDownload) return 'downloading';
  if (flags & (ACTIVE | INSTALLING)) return 'installing';
  if (flags & UPDATE_PAUSED) return 'paused';
  if (flags & UPDATE_REQUIRED) return 'queued';
  return null;
}

/** Vitesse déduite de l'évolution de BytesDownloaded entre deux lectures du manifeste. */
function measureSpeed(appid, bytes, now) {
  const previous = samples.get(appid);
  if (!previous || bytes < previous.bytes) {
    samples.set(appid, { bytes, at: now, speed: 0 });
    return 0;
  }
  if (bytes > previous.bytes) {
    const speed = Math.round((bytes - previous.bytes) / ((now - previous.at) / 1000));
    samples.set(appid, { bytes, at: now, speed });
    return speed;
  }
  return now - previous.at > SPEED_STALE_MS ? 0 : previous.speed;
}

async function readDownloads(steamappsDir, now) {
  let files;
  try {
    files = (await readdir(steamappsDir)).filter((file) => MANIFEST_RE.test(file));
  } catch {
    return [];
  }

  const downloads = await Promise.all(files.map(async (file) => {
    try {
      const { appstate: app } = await readVdf(join(steamappsDir, file));
      const appid = Number(app?.appid);
      if (!Number.isSafeInteger(appid)) return null;

      const bytesDownloaded = Number(app.bytesdownloaded ?? 0);
      const bytesToDownload = Number(app.bytestodownload ?? 0);
      const state = classify(Number(app.stateflags ?? 0), bytesDownloaded, bytesToDownload);
      if (!state) return null;

      return {
        appid,
        name: app.name?.trim() || `App ${appid}`,
        state,
        bytesDownloaded,
        bytesToDownload,
        bytesStaged: Number(app.bytesstaged ?? 0),
        bytesToStage: Number(app.bytestostage ?? 0),
        speed: state === 'downloading' ? measureSpeed(appid, bytesDownloaded, now) : 0,
      };
    } catch {
      return null;
    }
  }));
  return downloads.filter(Boolean);
}

async function scan(steamRoot) {
  const now = Date.now();
  const [owner, dirs] = await Promise.all([detectOwner(steamRoot), libraryDirs(steamRoot)]);
  const downloads = (await Promise.all(dirs.map((dir) => readDownloads(dir, now))))
    .flat()
    .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.name.localeCompare(b.name));

  for (const appid of samples.keys()) {
    if (!downloads.some((download) => download.appid === appid && download.state === 'downloading')) samples.delete(appid);
  }
  return { owner, downloads };
}

export async function saveDownloads(steamid, items) {
  await sql`
    INSERT INTO playtrace.downloads (steamid64, items, updated_at) VALUES (${steamid}, ${sql.json(items)}, now())
    ON CONFLICT (steamid64) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at
  `;
}

/** Téléchargements de `steamid`, ou liste vide si son client Steam ne s'est pas manifesté récemment. */
export async function getDownloads(steamid) {
  const [row] = await sql`SELECT items, updated_at FROM playtrace.downloads WHERE steamid64 = ${steamid}`;
  if (!row || Date.now() - new Date(row.updated_at).getTime() > STALE_AFTER_MS) return [];
  return row.items;
}

/**
 * Relit les manifestes toutes les 3 s et appelle `onChange(next, previous)` quand quelque chose bouge,
 * ou toutes les 15 s au minimum pour signaler que le client Steam est toujours là.
 */
export function startDownloadWatcher(onChange) {
  const steamRoot = steamCandidates().find((path) => existsSync(path));
  if (!steamRoot) {
    console.log('[downloads] client Steam introuvable : suivi des téléchargements désactivé (voir STEAM_PATH)');
    return;
  }
  console.log(`[downloads] client Steam : ${steamRoot}`);

  let running = false;
  let lastJson = JSON.stringify(current);
  let lastEmit = 0;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const next = await scan(steamRoot);
      const json = JSON.stringify(next);
      if (json !== lastJson || Date.now() - lastEmit >= HEARTBEAT_MS) {
        const previous = current;
        current = next;
        lastJson = json;
        lastEmit = Date.now();
        await onChange(next, previous);
      }
    } catch (error) {
      console.error('[downloads]', error.message);
    } finally {
      running = false;
    }
  };

  tick();
  timer = setInterval(tick, SCAN_INTERVAL_MS);
}

export function stopDownloadWatcher() {
  clearInterval(timer);
  timer = null;
}
