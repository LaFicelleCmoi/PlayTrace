import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { DeferredSection } from '@/components/DeferredSection';
import { Skeleton } from '@/components/ui/skeleton';
import { DownloadsPanel } from '@/components/DownloadsPanel';
import { GameOfTheYear } from '@/components/GameOfTheYear';
import { GamesMarquee } from '@/components/GamesMarquee';
import { Heatmap } from '@/components/Heatmap';
import { Hero } from '@/components/Hero';
import { LiveBanner } from '@/components/LiveBanner';
import { PlayerProfile } from '@/components/PlayerProfile';
import { SectionNav } from '@/components/SectionNav';
import { SessionTimeline } from '@/components/SessionTimeline';
import { isStarter, StarterCard } from '@/components/StarterCard';
import { TopGames } from '@/components/TopGames';
import { WrappedStory } from '@/components/WrappedStory';
import { YearCalendar } from '@/components/YearCalendar';
import { useNow } from '@/hooks/useNow';
import { useStats } from '@/hooks/useStats';
import { computeInsights } from '@/lib/insights';
import { renderWrappedImage, shareOrDownload } from '@/lib/shareImage';

const YEAR = new Date().getFullYear();

const SECTIONS = [
  { id: 'top', label: 'Top 5' },
  { id: 'jeu-de-l-annee', label: 'Jeu de l’année' },
  { id: 'profil', label: 'Profil' },
  { id: 'calendrier', label: 'Calendrier' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'historique', label: 'Historique' },
];

/** Page d'accueil : le Wrapped de l'année en cours. */
export function Wrapped({ user, live }) {
  const { status, downloads, connection } = live;
  const { stats, sessions, error, reload } = useStats(YEAR, `${status?.sessionId}-${status?.playing}`);
  const playing = Boolean(status?.playing);
  const now = useNow(playing);
  const insights = useMemo(() => (stats ? computeInsights(stats) : null), [stats]);
  const starter = stats && insights ? isStarter(stats, insights) : false;
  const [storyOpen, setStoryOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function share() {
    setSharing(true);
    try {
      await shareOrDownload(await renderWrappedImage({ user, stats, insights }), stats.year);
    } finally {
      setSharing(false);
    }
  }

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
      <Hero
        user={user}
        stats={stats}
        trackedSeconds={trackedSeconds}
        onPlay={() => setStoryOpen(true)}
        onShare={share}
        sharing={sharing}
      />
      <LiveBanner status={status} connection={connection} />
      <DownloadsPanel downloads={downloads} />
      {starter && <StarterCard stats={stats} insights={insights} />}
      <GamesMarquee stats={stats} />
      <SectionNav sections={SECTIONS} />
      <div id="top" className="scroll-mt-32">
        <TopGames stats={stats} />
      </div>
      <div id="jeu-de-l-annee" className="scroll-mt-32">
        <GameOfTheYear stats={stats} />
      </div>
      <DeferredSection
        id="profil"
        deferred={starter}
        eyebrow="Ton profil"
        title="Quel joueur es-tu ?"
        reason="Ta personnalité et tes badges s’affinent après 5 sessions sur 3 jours."
      >
        <PlayerProfile insights={insights} />
      </DeferredSection>
      <DeferredSection
        id="calendrier"
        deferred={starter}
        eyebrow="Calendrier"
        title={`Ton ${stats.year}, jour par jour`}
        reason="Il s’allume au fil de tes jours de jeu."
      >
        <YearCalendar year={stats.year} daily={stats.daily} trackingSince={stats.trackingSince} />
      </DeferredSection>
      <DeferredSection
        id="heatmap"
        deferred={starter}
        eyebrow="Heatmap"
        title="Quand est-ce que tu joues ?"
        reason="Tes créneaux préférés apparaissent après quelques sessions."
      >
        <Heatmap heatmap={stats.heatmap} />
      </DeferredSection>
      <div id="historique" className="scroll-mt-32">
        <SessionTimeline sessions={sessions} />
      </div>
      <AnimatePresence>
        {storyOpen && <WrappedStory user={user} stats={stats} insights={insights} onClose={() => setStoryOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
