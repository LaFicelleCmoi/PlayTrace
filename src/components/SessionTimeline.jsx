import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { GameImage } from '@/components/GameImage';
import { SectionTitle } from '@/components/SectionTitle';
import { useNow } from '@/hooks/useNow';
import { formatDateTime, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

function SessionCard({ session, now }) {
  const seconds = session.live ? (now - Date.parse(session.started_at)) / 1000 : session.duration_s;
  return (
    <div className="flex gap-3 rounded-xl border bg-card/80 p-3 backdrop-blur">
      <GameImage appid={session.appid} alt={session.game_name} className="aspect-[460/215] w-28 shrink-0 rounded-md" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{session.game_name}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(session.started_at)}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm tabular-nums text-neon-cyan">{formatDuration(seconds)}</span>
          {session.live && <Badge variant="live">en cours</Badge>}
        </div>
      </div>
    </div>
  );
}

/** Historique des sessions, en défilement alterné gauche / droite autour d'une ligne qui se remplit au scroll. */
export function SessionTimeline({ sessions }) {
  const ref = useRef(null);
  const now = useNow(sessions.some((session) => session.live));
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section className="container py-16">
      <SectionTitle eyebrow="Historique" title="Tes dernières sessions" />
      {sessions.length === 0 ? (
        <p className="text-muted-foreground">Aucune session enregistrée pour l’instant. Lance un jeu !</p>
      ) : (
        <div ref={ref} className="relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-border md:left-1/2" />
          <motion.div
            style={{ scaleY: progress }}
            className="absolute bottom-0 left-4 top-0 w-px origin-top bg-gradient-to-b from-neon-cyan via-neon-violet to-neon-pink md:left-1/2"
          />
          <ol className="grid gap-6">
            {sessions.map((session, index) => {
              const left = index % 2 === 0;
              return (
                <li key={session.id} className="relative grid md:grid-cols-2 md:gap-12">
                  <span
                    className={cn(
                      'absolute left-4 top-6 size-3 -translate-x-1/2 rounded-full border-2 border-background md:left-1/2',
                      session.live ? 'bg-neon-red shadow-[0_0_12px_#f43f5e]' : 'bg-neon-violet',
                    )}
                  />
                  <Reveal from={left ? 'left' : 'right'} className={cn('pl-10 md:pl-0', !left && 'md:col-start-2')}>
                    <SessionCard session={session} now={now} />
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
