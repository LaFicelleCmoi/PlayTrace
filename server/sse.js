const clients = new Map();
const MAX_STREAMS_PER_USER = 5;
const HEARTBEAT_MS = 25_000;

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Ouvre un flux SSE pour `steamid` et envoie tout de suite l'état courant (`{ événement: données }`). */
export function subscribe(req, res, steamid, initialEvents) {
  const streams = clients.get(steamid) ?? new Set();
  if (streams.size >= MAX_STREAMS_PER_USER) {
    res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Trop de flux ouverts');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 5000\n\n');
  for (const [event, data] of Object.entries(initialEvents)) send(res, event, data);

  streams.add(res);
  clients.set(steamid, streams);

  // Les proxys coupent les connexions muettes : un commentaire SSE suffit à les garder ouvertes.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);
  req.on('close', () => {
    clearInterval(heartbeat);
    streams.delete(res);
    if (streams.size === 0) clients.delete(steamid);
  });
}

/**
 * Variante sans connexion persistante (Vercel) : envoie l'état puis ferme.
 * EventSource se reconnecte tout seul après `retry` ms, ce qui revient à relire l'état toutes les 15 s.
 */
export function sendOnce(res, events) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
  });
  res.write('retry: 15000\n\n');
  for (const [event, data] of Object.entries(events)) send(res, event, data);
  res.end();
}

export function publish(steamid, event, data) {
  for (const res of clients.get(steamid) ?? []) send(res, event, data);
}

export function closeAllStreams() {
  for (const streams of clients.values()) {
    for (const res of streams) res.end();
  }
  clients.clear();
}
