import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CornerDownLeft, LibraryBig, Search, Sparkles, Swords } from 'lucide-react';
import { GameImage } from '@/components/GameImage';
import { request } from '@/lib/api';
import { formatDuration } from '@/lib/format';
import { navigate } from '@/lib/router';
import { cn } from '@/lib/utils';

const PAGES = [
  { id: 'page-wrapped', label: 'Wrapped', hint: 'Ton année sur Steam', icon: Sparkles, to: '/' },
  { id: 'page-library', label: 'Mes jeux', hint: 'Toute ta bibliothèque', icon: LibraryBig, to: '/jeux' },
  { id: 'page-challenges', label: 'Défis', hint: 'Profil public et duels entre amis', icon: Swords, to: '/defis' },
];

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Ouvre la palette avec Ctrl/Cmd + K, ou « / » hors d'un champ de saisie. */
export function useCommandPaletteShortcut(setOpen) {
  useEffect(() => {
    function onKey(event) {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);
}

/** Recherche rapide : pages et jeux, au clavier. */
export function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [games, setGames] = useState(null);
  const [cursor, setCursor] = useState(0);
  const list = useRef(null);

  // La bibliothèque n'est chargée qu'à la première ouverture.
  useEffect(() => {
    if (!open || games) return;
    request('/api/games')
      .then((data) => setGames(data.games))
      .catch(() => setGames([]));
  }, [open, games]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const needle = normalize(query.trim());
    const pages = PAGES.filter((page) => !needle || normalize(page.label).includes(needle)).map((page) => ({ ...page, type: 'page' }));
    const matches = (games ?? [])
      .filter((game) => !needle || normalize(game.name).includes(needle))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, needle ? 8 : 6)
      .map((game) => ({ ...game, id: `game-${game.appid}`, type: 'game', to: `/jeux/${game.appid}` }));
    return [...pages, ...matches];
  }, [games, query]);

  useEffect(() => setCursor(0), [query]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  function go(result) {
    onClose();
    navigate(result.to);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((value) => Math.max(value - 1, 0));
    } else if (event.key === 'Enter' && results[cursor]) {
      event.preventDefault();
      go(results[cursor]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche rapide"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border bg-card/95 shadow-[0_30px_80px_-20px_rgba(167,139,250,0.45)] backdrop-blur-xl"
          >
            <label className="flex items-center gap-3 border-b px-4">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <span className="sr-only">Rechercher un jeu ou une page</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Rechercher un jeu ou une page…"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-results"
                aria-activedescendant={results[cursor] ? `command-${results[cursor].id}` : undefined}
                className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Échap</kbd>
            </label>

            <ul id="command-results" ref={list} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {games ? `Aucun résultat pour « ${query} ».` : 'Chargement de ta bibliothèque…'}
                </li>
              )}
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <li
                    key={result.id}
                    id={`command-${result.id}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === cursor}
                    onMouseMove={() => setCursor(index)}
                    onClick={() => go(result)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                      index === cursor ? 'bg-secondary' : 'hover:bg-secondary/50',
                    )}
                  >
                    {result.type === 'page' ? (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                        <Icon className="size-4 text-neon-cyan" />
                      </span>
                    ) : (
                      <GameImage appid={result.appid} alt="" className="aspect-[460/215] w-16 shrink-0 rounded-md" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{result.type === 'page' ? result.label : result.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {result.type === 'page' ? result.hint : result.minutes ? formatDuration(result.minutes * 60) : 'Jamais lancé'}
                      </p>
                    </div>
                    {index === cursor && <CornerDownLeft className="size-4 shrink-0 text-muted-foreground" />}
                  </li>
                );
              })}
            </ul>

            <div className="hidden items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground sm:flex">
              <span><kbd className="rounded border px-1">↑</kbd> <kbd className="rounded border px-1">↓</kbd> naviguer</span>
              <span><kbd className="rounded border px-1">Entrée</kbd> ouvrir</span>
              <span><kbd className="rounded border px-1">Ctrl</kbd> + <kbd className="rounded border px-1">K</kbd> ouvrir / fermer</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
