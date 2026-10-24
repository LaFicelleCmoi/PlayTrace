import { Trophy } from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';
import { CountUp } from '@/components/ui/count-up';
import { Reveal } from '@/components/ui/reveal';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { GameImage } from '@/components/GameImage';
import { formatNumber } from '@/lib/format';

export function GameOfTheYear({ stats }) {
  const tracked = stats.gameOfTheYear;
  const fallback = stats.library.topGames[0];
  const game = tracked ?? (fallback && { appid: fallback.appid, name: fallback.name, seconds: fallback.minutes * 60 });
  if (!game) return null;

  return (
    <section className="container py-16">
      <Reveal>
        <SpotlightCard className="rounded-3xl" color="rgba(34, 211, 238, 0.15)">
          <div className="absolute inset-0">
            <GameImage appid={game.appid} kind="hero" alt="" className="h-full w-full opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/20" />
          </div>
          <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-end">
            <GameImage appid={game.appid} kind="capsule" alt={game.name} className="aspect-[2/3] w-40 rounded-xl shadow-2xl sm:w-52" />
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-neon-pink">
                <Trophy className="size-4" />
                {tracked ? `Jeu de l’année ${stats.year}` : 'Ton jeu le plus joué sur Steam'}
              </p>
              <h2 className="mt-3 text-4xl font-black sm:text-6xl">{game.name}</h2>
              <div className="mt-6 flex flex-wrap gap-8">
                <div>
                  <p className="text-4xl font-bold tabular-nums text-gradient">
                    <CountUp value={game.seconds / 3600} decimals={1} /> h
                  </p>
                  <p className="text-sm text-muted-foreground">de jeu</p>
                </div>
                {tracked && (
                  <>
                    <div>
                      <p className="text-4xl font-bold tabular-nums">
                        <CountUp value={tracked.share * 100} /> %
                      </p>
                      <p className="text-sm text-muted-foreground">de ton temps de jeu</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold tabular-nums">{formatNumber(tracked.sessions)}</p>
                      <p className="text-sm text-muted-foreground">sessions</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <BorderBeam width={2} />
        </SpotlightCard>
      </Reveal>
    </section>
  );
}
