import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { detectOwner, findSteamRoot } from './downloads.js';
import { parseBinaryVdf } from './vdf.js';

// L'API Web Steam ne signale pas les raccourcis non-Steam : on lit sur le PC celui que le client Steam a lancé.
// Le délai reste bien en dessous des 3 minutes au-delà desquelles une session sans nouvelles est fermée.
const SCAN_INTERVAL_MS = 20_000;
const REG_TIMEOUT_MS = 5000;
const STEAM_REGISTRY_KEY = 'HKCU\\Software\\Valve\\Steam';
const STEAMID_BASE = 76561197960265728n;
// Les raccourcis ont le bit de poids fort de leur identifiant à 1, jamais les jeux Steam.
const FIRST_SHORTCUT_ID = 0x80000000;
const FALLBACK_NAME = 'Jeu non-Steam';

const run = promisify(execFile);
let timer = null;

/** Identifiant de l'app lancée par le client Steam (registre Windows, aussi joignable depuis WSL), 0 sinon. */
async function runningAppId() {
  try {
    const { stdout } = await run('reg.exe', ['query', STEAM_REGISTRY_KEY, '/v', 'RunningAppID'], { timeout: REG_TIMEOUT_MS });
    const match = /RunningAppID\s+REG_DWORD\s+0x([0-9a-f]+)/i.exec(stdout);
    return match ? Number.parseInt(match[1], 16) : 0;
  } catch {
    return 0;
  }
}

async function shortcutName(steamRoot, owner, appid) {
  const account = String(BigInt(owner) - STEAMID_BASE);
  try {
    const file = await readFile(join(steamRoot, 'userdata', account, 'config', 'shortcuts.vdf'));
    const { shortcuts = {} } = parseBinaryVdf(file);
    return Object.values(shortcuts).find((shortcut) => shortcut.appid === appid)?.appname?.trim() || FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
}

/** Nom du raccourci en cours, ou `null` si le client Steam n'en a lancé aucun. */
export async function readRunningShortcut(steamRoot, owner) {
  const appid = await runningAppId();
  return appid >= FIRST_SHORTCUT_ID ? shortcutName(steamRoot, owner, appid) : null;
}

/**
 * Appelle `report(owner, name)` à chaque relecture tant qu'un raccourci tourne (pour confirmer la session),
 * puis une fois avec `name = null` quand il s'arrête. Un envoi raté est retenté à la relecture suivante.
 */
export function startShortcutWatcher(report) {
  const steamRoot = findSteamRoot();
  if (!steamRoot) return;

  let running = false;
  // `undefined` : au démarrage, on signale aussi l'absence de jeu pour fermer une session laissée ouverte.
  let last;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const owner = await detectOwner(steamRoot);
      const name = owner ? await readRunningShortcut(steamRoot, owner) : null;
      if (owner && (name || last !== null)) {
        await report(owner, name);
        if (name !== last) console.log(name ? `[shortcuts] jeu non-Steam en cours : ${name}` : '[shortcuts] aucun jeu non-Steam en cours');
        last = name;
      }
    } catch (error) {
      console.error('[shortcuts]', error.message);
    } finally {
      running = false;
    }
  };

  tick();
  timer = setInterval(tick, SCAN_INTERVAL_MS);
}

export function stopShortcutWatcher() {
  clearInterval(timer);
  timer = null;
}
