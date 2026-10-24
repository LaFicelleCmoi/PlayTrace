import { config } from './config.js';
import { startDownloadWatcher } from './downloads.js';

// Agent à lancer sur le PC qui a Steam (npm run agent) : envoie les téléchargements au site déployé.
if (!config.agentToken) {
  console.error('[agent] AGENT_TOKEN manquant dans .env : il doit être identique à celui configuré sur Vercel');
  process.exit(1);
}

const endpoint = `${config.agentUrl}/api/agent/downloads`;
console.log(`[agent] envoi des téléchargements vers ${endpoint}`);

async function send(owner, downloads) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.agentToken}` },
    body: JSON.stringify({ owner, downloads }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

startDownloadWatcher(async (next, previous) => {
  try {
    if (previous.owner && previous.owner !== next.owner) await send(previous.owner, []);
    if (next.owner) await send(next.owner, next.downloads);
  } catch (error) {
    console.error('[agent]', error.message);
  }
});
