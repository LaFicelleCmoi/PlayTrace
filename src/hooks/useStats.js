import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const REFRESH_MS = 5 * 60 * 1000;

/**
 * Stats de l'année et sessions récentes. Recharge quand `sessionKey` change
 * (une session commence ou se termine) et toutes les 5 minutes.
 */
export function useStats(year, sessionKey) {
  const [data, setData] = useState({ stats: null, sessions: [] });
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [stats, { sessions }] = await Promise.all([api.stats(year), api.sessions(30)]);
      setData({ stats, sessions });
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load, sessionKey]);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { ...data, loading: !data.stats && !error, error, reload: load };
}
