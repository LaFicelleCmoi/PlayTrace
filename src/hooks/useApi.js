import { useCallback, useEffect, useState } from 'react';
import { request } from '@/lib/api';

/** Charge `path` (relancé quand il change). */
export function useApi(path) {
  const [state, setState] = useState({ path, data: null, error: null });

  const load = useCallback(async () => {
    try {
      const data = await request(path);
      setState({ path, data, error: null });
    } catch (error) {
      setState({ path, data: null, error });
    }
  }, [path]);

  useEffect(() => {
    setState({ path, data: null, error: null });
    load();
  }, [path, load]);

  // Tant que la réponse correspond à un ancien chemin, on ne l'affiche pas.
  const current = state.path === path;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current || (!state.data && !state.error),
    reload: load,
  };
}
