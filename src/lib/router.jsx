import { useSyncExternalStore } from 'react';

// Routeur minimal basé sur l'API History : trois pages ne justifient pas une dépendance.
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

export function navigate(to) {
  if (to === window.location.pathname + window.location.search) return;
  window.history.pushState(null, '', to);
  for (const listener of listeners) listener();
  window.scrollTo({ top: 0 });
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

/** Page correspondant à l'URL. */
export function matchRoute(pathname) {
  if (pathname === '/') return { page: 'wrapped' };
  if (/^\/jeux\/?$/.test(pathname)) return { page: 'library' };
  if (/^\/defis\/?$/.test(pathname)) return { page: 'challenges' };
  const game = /^\/jeux\/(\d{1,10})\/?$/.exec(pathname);
  if (game) return { page: 'game', appid: Number(game[1]) };
  const player = /^\/joueur\/(7656119\d{10})\/?$/.exec(pathname);
  if (player) return { page: 'public', steamid: player[1] };
  const duel = /^\/duel\/(7656119\d{10})\/?$/.exec(pathname);
  if (duel) return { page: 'duel', steamid: duel[1] };
  return { page: 'notfound' };
}

/** Lien interne : navigation sans rechargement, mais ctrl/cmd + clic ouvre toujours un nouvel onglet. */
export function Link({ to, onClick, ...props }) {
  function handleClick(event) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={handleClick} {...props} />;
}
