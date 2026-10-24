import { useEffect, useState } from 'react';

const RETRY_MS = 10_000;

/**
 * Abonnement SSE à `/api/live` : jeu en cours et téléchargements Steam. EventSource se reconnecte seul après une coupure réseau ;
 * s'il abandonne (réponse 401, 429…), on relance nous-mêmes après un délai.
 */
export function useLiveStatus(enabled = true) {
  const [status, setStatus] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [connection, setConnection] = useState('connecting');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const source = new EventSource('/api/live');
    let retry = null;

    const listen = (name, setter) =>
      source.addEventListener(name, (event) => {
        try {
          setter(JSON.parse(event.data));
        } catch {
          // Message mal formé : on garde le dernier état connu.
        }
      });
    listen('status', setStatus);
    listen('downloads', setDownloads);
    source.onopen = () => setConnection('open');
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setConnection('closed');
        retry = setTimeout(() => setAttempt((value) => value + 1), RETRY_MS);
      } else {
        setConnection('connecting');
      }
    };

    return () => {
      clearTimeout(retry);
      source.close();
    };
  }, [enabled, attempt]);

  return { status, downloads, connection };
}
