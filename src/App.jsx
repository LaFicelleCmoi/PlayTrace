import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DownloadsPanel } from '@/components/DownloadsPanel';
import { GameOfTheYear } from '@/components/GameOfTheYear';
import { GamesMarquee } from '@/components/GamesMarquee';
import { Heatmap } from '@/components/Heatmap';
import { Hero } from '@/components/Hero';
import { LiveBanner } from '@/components/LiveBanner';
import { Login } from '@/components/Login';
import { SessionTimeline } from '@/components/SessionTimeline';
import { TopGames } from '@/components/TopGames';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { useNow } from '@/hooks/useNow';
import { useStats } from '@/hooks/useStats';
import { api } from '@/lib/api';

const YEAR = new Date().getFullYear();

function Header({ user }) {
  async function logout() {
    await api.logout().catch(() => {});
    window.location.assign('/');
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/60 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2 font-bold">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span>
            Play<span className="text-gradient">Trace</span>
          </span>
        </a>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {user.avatar && <img src={user.avatar} alt="" className="size-8 shrink-0 rounded-full border" referrerPolicy="no-referrer" />}
          <span className="hidden max-w-[12rem] truncate text-sm sm:inline">{user.pseudo}</span>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Se déconnecter">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ user }) {
  const { status, downloads, connection } = useLiveStatus();
  const { stats, sessions, error, reload } = useStats(YEAR, `${status?.sessionId}-${status?.playing}`);
  const playing = Boolean(status?.playing);
  const now = useNow(playing);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Impossible de charger tes stats : {error.message}</p>
        <Button onClick={reload}>Réessayer</Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container space-y-6 pt-28 sm:pt-32">
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
    <main className="pt-[calc(3.5rem+env(safe-area-inset-top))]">
      <Hero user={user} stats={stats} trackedSeconds={trackedSeconds} />
      <LiveBanner status={status} connection={connection} />
      <DownloadsPanel downloads={downloads} />
      <GamesMarquee stats={stats} />
      <TopGames stats={stats} />
      <GameOfTheYear stats={stats} />
      <Heatmap heatmap={stats.heatmap} />
      <SessionTimeline sessions={sessions} />
      <footer className="container py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground sm:py-12">
        PlayTrace · l’historique précis commence à l’activation du suivi.
      </footer>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="min-h-dvh" />;
  if (!user) return <Login />;
  return (
    <>
      <Header user={user} />
      <Dashboard user={user} />
    </>
  );
}
