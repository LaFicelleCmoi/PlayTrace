import { createServer } from 'node:http';
import { handler } from './app.js';
import { config } from './config.js';
import { sql } from './db.js';
import { saveDownloads, startDownloadWatcher, stopDownloadWatcher } from './downloads.js';
import { startPoller, stopPoller } from './poller.js';
import { closeAllStreams, publish } from './sse.js';

// Serveur Node local : sondage en continu et flux SSE ouverts. Sur Vercel, c'est api/index.js qui sert les requêtes.
const server = createServer(handler);

server.listen(config.port, config.host, () => {
  console.log(`PlayTrace écoute sur http://${config.host}:${config.port} (front : ${config.baseUrl})`);
  startPoller();
  startDownloadWatcher(async (next, previous) => {
    try {
      // Changement de compte sur le client Steam : l'ancien compte ne doit plus voir ces téléchargements.
      if (previous.owner && previous.owner !== next.owner) {
        await saveDownloads(previous.owner, []);
        publish(previous.owner, 'downloads', []);
      }
      if (next.owner) {
        await saveDownloads(next.owner, next.downloads);
        publish(next.owner, 'downloads', next.downloads);
      }
    } catch (error) {
      console.error('[downloads]', error.message);
    }
  });
});

function shutdown() {
  stopPoller();
  stopDownloadWatcher();
  closeAllStreams();
  server.close(() => {
    sql.end().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
