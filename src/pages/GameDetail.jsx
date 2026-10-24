import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CalendarDays, Clock, ExternalLink, Gamepad2, History, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Achievements } from '@/components/Achievements';
import { GameImage } from '@/components/GameImage';
import { SectionTitle } from '@/components/SectionTitle';
import { useApi } from '@/hooks/useApi';
import { useNow } from '@/hooks/useNow';
import { formatClock, formatDate, formatDateTime, formatDuration, formatRelative } from '@/lib/format';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

function StatTile({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card/70 p-3 backdrop-blur sm:p-4">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className={cn('mt-1.5 truncate text-lg font-bold tabular-nums sm:text-xl', accent)}>{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container space-y-6 py-8">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-64 w-full rounded-2xl sm:h-80" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function GameSessions({ sessions, now }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Pas encore de session suivie par PlayTrace pour ce jeu.</p>;
  }
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {sessions.map((session) => {
        const seconds = session.live ? (now - Date.parse(session.started_at)) / 1000 : session.duration_s;
        return (
          <li key={session.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card/70 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize">{formatDateTime(session.started_at)}</p>
              <p className="text-xs text-muted-foreground">{formatRelative(session.started_at)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {session.live && <Badge variant="live">en cours</Badge>}
              <span className="text-sm tabular-nums text-neon-cyan">{formatDuration(seconds)}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Fiche d'un jeu : infos Store, temps de jeu, sessions et succès. */
export function GameDetail({ appid, live }) {
  const { data: game, error, loading, reload } = useApi(`/api/games/${appid}`);
  const playingThis = Boolean(live.status?.playing && live.status.appid === appid);
  const now = useNow(playingThis || Boolean(game?.sessions.some((session) => session.live)));

  useEffect(() => {
    if (game) document.title = `${game.name} · PlayTrace`;
  }, [game]);

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="container flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <Gamepad2 className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          {error.status === 404 ? 'Ce jeu est introuvable.' : `Impossible de charger ce jeu : ${error.message}`}
        </p>
        <div className="flex gap-2">
          {error.status !== 404 && <Button onClick={reload}>Réessayer</Button>}
          <Link to="/jeux" className={buttonVariants({ variant: 'outline' })}>Mes jeux</Link>
        </div>
      </div>
    );
  }

  const { store, tracked } = game;
  const liveSeconds = playingThis ? (now - Date.parse(live.status.startedAt)) / 1000 : 0;
  const credits = [
    store?.developers?.length && store.developers.join(', '),
    store?.releaseDate && `Sortie ${store.releaseDate}`,
  ].filter(Boolean);

  return (
    <div className="container py-6 sm:py-8">
      <Link to="/jeux" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Mes jeux
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-4 overflow-hidden rounded-2xl border sm:rounded-3xl"
      >
        <div className="absolute inset-0">
          <GameImage appid={appid} kind="hero" alt="" className="h-full w-full opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
        </div>

        <div className="relative flex flex-col items-center gap-5 p-5 pt-10 text-center sm:flex-row sm:items-end sm:gap-8 sm:p-8 sm:pt-24 sm:text-left lg:p-10 lg:pt-32">
          <GameImage appid={appid} kind="capsule" alt={game.name} className="aspect-[2/3] w-32 shrink-0 rounded-xl border shadow-2xl sm:w-40 lg:w-48" />
          <div className="min-w-0 flex-1">
            {playingThis && (
              <Badge variant="live" className="mb-3">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-neon-red" />
                  <span className="relative inline-flex size-2 rounded-full bg-neon-red" />
                </span>
                En jeu · {formatClock(liveSeconds)}
              </Badge>
            )}
            <h1 className="break-words text-[clamp(1.9rem,7vw,3.75rem)] font-black leading-[1.05]">{game.name}</h1>
            {credits.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{credits.join(' · ')}</p>}
            {store?.genres?.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {store.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">{genre}</Badge>
                ))}
                {store.metacritic && (
                  <Badge variant="outline" className="border-neon-lime/40 text-neon-lime">
                    <Star className="size-3" />
                    Metacritic {store.metacritic}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <a
            href={`https://store.steampowered.com/app/${appid}/`}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0 bg-background/60 backdrop-blur')}
          >
            Page Steam
            <ExternalLink />
          </a>
        </div>
      </motion.section>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 md:grid-cols-4">
        <StatTile icon={Clock} label="Temps total Steam" value={game.playtimeMinutes ? formatDuration(game.playtimeMinutes * 60) : '—'} />
        <StatTile
          icon={History}
          label="Suivi PlayTrace"
          value={tracked.totalSeconds ? formatDuration(tracked.totalSeconds) : '—'}
          hint={tracked.firstSession ? `depuis le ${formatDate(tracked.firstSession, { day: 'numeric', month: 'short' })}` : 'pas encore suivi'}
          accent="text-neon-cyan"
        />
        <StatTile
          icon={Gamepad2}
          label="Sessions"
          value={tracked.sessions || '—'}
          hint={tracked.longestSeconds ? `record ${formatDuration(tracked.longestSeconds)}` : undefined}
        />
        <StatTile
          icon={CalendarDays}
          label="Dernière partie"
          value={playingThis ? 'Maintenant' : game.lastPlayed ? formatRelative(game.lastPlayed) : 'Jamais'}
          hint={!playingThis && game.lastPlayed ? formatDate(game.lastPlayed) : undefined}
        />
      </div>

      {store?.shortDescription && (
        <Reveal>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:mt-8 sm:text-base">{store.shortDescription}</p>
        </Reveal>
      )}

      <Achievements achievements={game.achievements} />

      <section className="pb-4">
        <SectionTitle eyebrow="Historique" title="Tes sessions sur ce jeu" />
        <GameSessions sessions={game.sessions} now={now} />
      </section>
    </div>
  );
}
