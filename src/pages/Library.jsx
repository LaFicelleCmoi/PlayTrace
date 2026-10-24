import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Radio, Search, Trophy, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GameImage } from '@/components/GameImage';
import { useApi } from '@/hooks/useApi';
import { request } from '@/lib/api';
import { formatDuration, formatNumber, formatRelative } from '@/lib/format';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;

// Part des succès obtenus, ou -1 si le jeu n'en a pas (ou pas encore chargés).
const ratio = (game) => (game.achievements ? game.achievements.unlocked / game.achievements.total : -1);

const SORTS = [
  { id: 'playtime', label: 'Temps de jeu', compare: (a, b) => b.minutes - a.minutes },
  { id: 'recent', label: 'Récents', compare: (a, b) => new Date(b.lastPlayed ?? 0) - new Date(a.lastPlayed ?? 0) },
  { id: 'achievements', label: 'Succès', compare: (a, b) => ratio(b) - ratio(a) || b.minutes - a.minutes },
  { id: 'tracked', label: 'Suivi', compare: (a, b) => b.trackedSeconds - a.trackedSeconds || b.minutes - a.minutes },
  { id: 'name', label: 'A → Z', compare: (a, b) => a.name.localeCompare(b.name, 'fr') },
];

const FILTERS = [
  { id: 'all', label: 'Tous', test: () => true },
  { id: 'progress', label: 'En cours', test: (game) => game.minutes > 0 && ratio(game) < 1 },
  { id: 'complete', label: 'Complétés', test: (game) => ratio(game) === 1 },
  { id: 'never', label: 'Jamais lancés', test: (game) => game.minutes === 0 && game.trackedSeconds === 0 },
];

/** Charge la progression des succès par lots (le serveur en rafraîchit 40 par appel). */
function useAchievementProgress(enabled) {
  const [state, setState] = useState({ status: 'loading', progress: {} });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    (async () => {
      for (let round = 0; round < 10 && !cancelled; round += 1) {
        try {
          const result = await request('/api/games/achievements');
          if (cancelled) return;
          setState({ status: result.status, progress: result.progress });
          if (!result.pending) return;
        } catch {
          if (!cancelled) setState((previous) => ({ ...previous, status: 'error' }));
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}

function SegmentedControl({ options, value, onChange, label, layoutId }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 [scrollbar-width:none]" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            'relative shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
            value === option.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {value === option.id && (
            <motion.span layoutId={layoutId} className="absolute inset-0 rounded-md bg-secondary" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
          )}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// Recherche insensible aux accents et à la casse : « elden » trouve « ELDEN RING ».
function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function AchievementBar({ achievements }) {
  const complete = achievements.unlocked === achievements.total;
  const percent = Math.round((achievements.unlocked / achievements.total) * 100);
  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pb-2 pt-6">
      <div className="flex items-center justify-between gap-1 text-[10px] font-semibold">
        <span className={cn('flex items-center gap-1', complete ? 'text-yellow-300' : 'text-white/90')}>
          <Trophy className="size-3" />
          {achievements.unlocked}/{achievements.total}
        </span>
        <span className={complete ? 'text-yellow-300' : 'text-white/70'}>{percent} %</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
        <div
          className={cn('h-full rounded-full', complete ? 'bg-yellow-300' : 'bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function GameCard({ game, playing }) {
  const complete = game.achievements && game.achievements.unlocked === game.achievements.total;
  return (
    <Link
      to={`/jeux/${game.appid}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-card shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:border-neon-violet/50 group-hover:shadow-[0_12px_40px_-12px_rgba(167,139,250,0.5)]',
          complete && 'border-yellow-300/60 shadow-[0_0_24px_-8px_rgba(253,224,71,0.6)]',
        )}
      >
        <GameImage appid={game.appid} kind="capsule" alt="" className="aspect-[2/3] w-full transition duration-500 group-hover:scale-105" />
        {game.achievements && <AchievementBar achievements={game.achievements} />}
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
  const [filter, setFilter] = useState('all');
  const progress = useAchievementProgress(Boolean(data));
  const [visible, setVisible] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const playingAppid = live.status?.playing ? live.status.appid : null;

  const allGames = useMemo(
    () => (data?.games ?? []).map((game) => ({ ...game, achievements: progress.progress[game.appid] ?? null })),
    [data, progress.progress],
  );

  const games = useMemo(() => {
    const needle = normalize(deferredQuery.trim());
    const test = FILTERS.find((option) => option.id === filter).test;
    const list = allGames.filter((game) => test(game) && (!needle || normalize(game.name).includes(needle)));
    return list.sort(SORTS.find((option) => option.id === sort).compare);
  }, [allGames, deferredQuery, sort, filter]);

  useEffect(() => setVisible(PAGE_SIZE), [deferredQuery, sort, filter]);

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
        <SegmentedControl options={SORTS} value={sort} onChange={setSort} label="Trier par" layoutId="library-sort" />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          options={FILTERS.map((option) => ({ ...option, label: `${option.label} (${allGames.filter(option.test).length})` }))}
          value={filter}
          onChange={setFilter}
          label="Filtrer"
          layoutId="library-filter"
        />
        {progress.status === 'loading' && data && <p className="text-xs text-muted-foreground">Chargement des succès…</p>}
        {progress.status === 'private' && <p className="text-xs text-muted-foreground">Succès privés sur Steam : progression indisponible.</p>}
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
