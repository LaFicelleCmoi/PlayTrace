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
    <section className="container py-12 sm:py-16">
      <Reveal>
        <SpotlightCard className="rounded-2xl sm:rounded-3xl" color="rgba(34, 211, 238, 0.15)">
          <div className="absolute inset-0">
            <GameImage appid={game.appid} kind="hero" alt="" className="h-full w-full opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/20" />
          </div>
          <div className="relative grid justify-items-center gap-6 p-5 text-center sm:p-10 md:grid-cols-[auto_1fr] md:items-end md:justify-items-start md:gap-8 md:text-left">
            <GameImage appid={game.appid} kind="capsule" alt={game.name} className="aspect-[2/3] w-32 rounded-xl shadow-2xl sm:w-44 lg:w-52" />
            <div className="min-w-0">
              <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neon-pink sm:text-sm sm:tracking-[0.3em] md:justify-start">
                <Trophy className="size-4 shrink-0" />
                {tracked ? `Jeu de l’année ${stats.year}` : 'Ton jeu le plus joué sur Steam'}
              </p>
              <h2 className="mt-3 break-words text-[clamp(2rem,8vw,3.75rem)] font-black leading-[1.05]">{game.name}</h2>
              <div className="mt-6 grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:gap-8">
                <div>
                  <p className="text-[clamp(1.5rem,6vw,2.25rem)] font-bold tabular-nums text-gradient">
                    <CountUp value={game.seconds / 3600} decimals={1} /> h
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">de jeu</p>
                </div>
                {tracked && (
                  <>
                    <div>
                      <p className="text-[clamp(1.5rem,6vw,2.25rem)] font-bold tabular-nums">
                        <CountUp value={tracked.share * 100} /> %
                      </p>
                      <p className="text-xs text-muted-foreground sm:text-sm">de ton temps de jeu</p>
                    </div>
                    <div>
                      <p className="text-[clamp(1.5rem,6vw,2.25rem)] font-bold tabular-nums">{formatNumber(tracked.sessions)}</p>
                      <p className="text-xs text-muted-foreground sm:text-sm">sessions</p>
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
