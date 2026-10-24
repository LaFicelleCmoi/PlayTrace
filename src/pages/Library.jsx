import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Radio, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GameImage } from '@/components/GameImage';
import { useApi } from '@/hooks/useApi';
import { formatDuration, formatNumber, formatRelative } from '@/lib/format';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;

const SORTS = [
  { id: 'playtime', label: 'Temps de jeu', compare: (a, b) => b.minutes - a.minutes },
  { id: 'recent', label: 'Récents', compare: (a, b) => new Date(b.lastPlayed ?? 0) - new Date(a.lastPlayed ?? 0) },
  { id: 'tracked', label: 'Suivi', compare: (a, b) => b.trackedSeconds - a.trackedSeconds || b.minutes - a.minutes },
  { id: 'name', label: 'A → Z', compare: (a, b) => a.name.localeCompare(b.name, 'fr') },
];

// Recherche insensible aux accents et à la casse : « elden » trouve « ELDEN RING ».
function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function GameCard({ game, playing }) {
  return (
    <Link
      to={`/jeux/${game.appid}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative overflow-hidden rounded-xl border bg-card shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:border-neon-violet/50 group-hover:shadow-[0_12px_40px_-12px_rgba(167,139,250,0.5)]">
        <GameImage appid={game.appid} kind="capsule" alt="" className="aspect-[2/3] w-full transition duration-500 group-hover:scale-105" />
        {playing && (
          <Badge variant="live" className="absolute left-2 top-2 bg-background/80 backdrop-blur">
            <Radio className="size-3" />
            En jeu
          </Badge>
        )}
        {game.trackedSeconds > 0 && !playing && (
          <span className="absolute right-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold text-neon-cyan backdrop-blur">
            Suivi
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{game.name}</p>
      <p className="text-xs text-muted-foreground">
        {game.minutes > 0 ? formatDuration(game.minutes * 60) : 'Jamais lancé'}
        {game.lastPlayed && game.minutes > 0 && <span className="hidden sm:inline"> · {formatRelative(game.lastPlayed)}</span>}
      </p>
    </Link>
  );
}

/** Toute la bibliothèque Steam, avec recherche et tris. */
export function Library({ live }) {
  const { data, error, loading, reload } = useApi('/api/games');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('playtime');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const playingAppid = live.status?.playing ? live.status.appid : null;

  const games = useMemo(() => {
    const needle = normalize(deferredQuery.trim());
    const list = (data?.games ?? []).filter((game) => !needle || normalize(game.name).includes(needle));
    return list.sort(SORTS.find((option) => option.id === sort).compare);
  }, [data, deferredQuery, sort]);

  useEffect(() => setVisible(PAGE_SIZE), [deferredQuery, sort]);

  const totalMinutes = (data?.games ?? []).reduce((sum, game) => sum + game.minutes, 0);

  return (
    <section className="container py-10 sm:py-14">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-cyan sm:tracking-[0.3em]">Bibliothèque</p>
        <h1 className="text-[clamp(1.75rem,6vw,2.75rem)] font-bold leading-tight">Mes jeux</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {formatNumber(data.games.length)} jeux · {formatNumber(totalMinutes / 60)} h au compteur Steam
          </p>
        )}
      </div>

      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 mt-6 flex flex-col gap-3 border-b border-white/5 bg-background/80 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:flex-row sm:items-center sm:rounded-xl sm:border sm:px-3">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un jeu</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un jeu…"
            className="h-10 w-full rounded-lg border bg-card pl-9 pr-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-neon-violet/60 focus:ring-2 focus:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 [scrollbar-width:none]" role="group" aria-label="Trier par">
          {SORTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSort(option.id)}
              aria-pressed={sort === option.id}
              className={cn(
                'relative shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                sort === option.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {sort === option.id && (
                <motion.span layoutId="library-sort" className="absolute inset-0 rounded-md bg-secondary" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">Impossible de charger ta bibliothèque : {error.message}</p>
          <Button onClick={reload}>Réessayer</Button>
        </div>
      )}

      {loading && !error && (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {data && games.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          {query ? `Aucun jeu ne correspond à « ${query} ».` : 'Aucun jeu visible : les détails de tes jeux sont peut-être privés sur Steam.'}
        </p>
      )}

      {data && games.length > 0 && (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {games.slice(0, visible).map((game, index) => (
              <motion.li
                key={game.appid}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index % PAGE_SIZE, 12) * 0.03 }}
              >
                <GameCard game={game} playing={game.appid === playingAppid} />
              </motion.li>
            ))}
          </ul>
          {visible < games.length && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
                <ChevronDown />
                Afficher plus ({games.length - visible})
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
