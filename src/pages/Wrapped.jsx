import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DownloadsPanel } from '@/components/DownloadsPanel';
import { GameOfTheYear } from '@/components/GameOfTheYear';
import { GamesMarquee } from '@/components/GamesMarquee';
import { Heatmap } from '@/components/Heatmap';
import { Hero } from '@/components/Hero';
import { LiveBanner } from '@/components/LiveBanner';
import { SessionTimeline } from '@/components/SessionTimeline';
import { TopGames } from '@/components/TopGames';
import { useNow } from '@/hooks/useNow';
import { useStats } from '@/hooks/useStats';

const YEAR = new Date().getFullYear();

/** Page d'accueil : le Wrapped de l'année en cours. */
export function Wrapped({ user, live }) {
  const { status, downloads, connection } = live;
  const { stats, sessions, error, reload } = useStats(YEAR, `${status?.sessionId}-${status?.playing}`);
  const playing = Boolean(status?.playing);
  const now = useNow(playing);

  if (error) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Impossible de charger tes stats : {error.message}</p>
        <Button onClick={reload}>Réessayer</Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container space-y-6 pt-14 sm:pt-20">
        <Skeleton className="mx-auto h-24 w-full max-w-md" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Les stats sont calculées à `generatedAt` : on y ajoute le temps écoulé depuis pour la session en cours.
  const liveFrom = playing ? Math.max(Date.parse(stats.generatedAt), Date.parse(status.startedAt)) : now;
  const trackedSeconds = stats.totals.trackedSeconds + Math.max(0, (now - liveFrom) / 1000);

  return (
    <>
      <Hero user={user} stats={stats} trackedSeconds={trackedSeconds} />
      <LiveBanner status={status} connection={connection} />
      <DownloadsPanel downloads={downloads} />
      <GamesMarquee stats={stats} />
      <TopGames stats={stats} />
      <GameOfTheYear stats={stats} />
      <Heatmap heatmap={stats.heatmap} />
      <SessionTimeline sessions={sessions} />
    </>
  );
}
