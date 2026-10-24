import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { GameImage } from '@/components/GameImage';
import { SectionTitle } from '@/components/SectionTitle';
import { formatDuration } from '@/lib/format';

const RANK_COLORS = ['text-neon-pink', 'text-neon-violet', 'text-neon-cyan', 'text-muted-foreground', 'text-muted-foreground'];

export function TopGames({ stats }) {
  // Tant que le suivi n'a rien enregistré, on montre le temps total de la bibliothèque Steam.
  const fromLibrary = stats.topGames.length === 0;
  const games = fromLibrary
    ? stats.library.topGames.slice(0, 5).map((game) => ({ appid: game.appid, name: game.name, seconds: game.minutes * 60 }))
    : stats.topGames;
  const max = games[0]?.seconds || 1;

  return (
    <section className="container py-12 sm:py-16">
      <SectionTitle
        eyebrow="Top 5"
        title="Tes jeux les plus joués"
        description={fromLibrary ? 'Le suivi démarre : en attendant, voici ton temps total enregistré par Steam.' : `Temps suivi en ${stats.year}.`}
      />
      {games.length === 0 ? (
        <p className="text-muted-foreground">Aucun jeu à afficher pour l’instant.</p>
      ) : (
        <ol className="grid grid-cols-1 gap-2.5 sm:gap-3">
          {games.map((game, index) => (
            <Reveal key={game.appid} delay={index * 0.08}>
              <SpotlightCard>
                <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <span className={`w-6 shrink-0 text-center text-xl font-black tabular-nums sm:w-8 sm:text-2xl ${RANK_COLORS[index]}`}>{index + 1}</span>
                <GameImage appid={game.appid} alt={game.name} className="aspect-[460/215] w-20 shrink-0 rounded-md sm:w-36" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <p className="truncate text-sm font-semibold sm:text-base">{game.name}</p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-sm">{formatDuration(game.seconds)}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(game.seconds / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  {game.sessions && (
                    <Badge variant="secondary" className="mt-2 hidden sm:inline-flex">
                      {game.sessions} session{game.sessions > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </ol>
      )}
    </section>
  );
}
