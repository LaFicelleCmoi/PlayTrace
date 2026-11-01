import { config } from './config.js';
import { startDownloadWatcher } from './downloads.js';
import { startShortcutWatcher } from './shortcuts.js';

// Agent à lancer sur le PC qui a Steam (npm run agent) : envoie les téléchargements au site déployé.
if (!config.agentToken) {
  console.error('[agent] AGENT_TOKEN manquant dans .env : il doit être identique à celui configuré sur Vercel');
  process.exit(1);
}

console.log(`[agent] envoi des téléchargements et des jeux non-Steam vers ${config.agentUrl}`);

async function post(path, body) {
  const res = await fetch(`${config.agentUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.agentToken}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${path} : HTTP ${res.status}`);
}

const send = (owner, downloads) => post('/api/agent/downloads', { owner, downloads });

startDownloadWatcher(async (next, previous) => {
  try {
    if (previous.owner && previous.owner !== next.owner) await send(previous.owner, []);
    if (next.owner) await send(next.owner, next.downloads);
  } catch (error) {
    console.error('[agent]', error.message);
  }
});

startShortcutWatcher(async (owner, name) => {
  await post('/api/agent/game', { owner, name });
});
