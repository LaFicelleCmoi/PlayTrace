import { useRef, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { GameImage } from '@/components/GameImage';
import { SectionTitle } from '@/components/SectionTitle';
import { useNow } from '@/hooks/useNow';
import { formatDuration } from '@/lib/format';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 8;

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** « Aujourd'hui », « Hier », sinon « samedi 17 octobre ». */
function dayLabel(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return 'Aujourd’hui';
  if (dayKey(date) === dayKey(yesterday)) return 'Hier';
  const label = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(date);
  return label[0].toUpperCase() + label.slice(1);
}

/** Sessions regroupées par jour de début, dans l'ordre reçu (plus récentes d'abord). */
function groupByDay(sessions) {
  const groups = [];
  for (const session of sessions) {
    const date = new Date(session.started_at);
    const key = dayKey(date);
    if (groups.at(-1)?.key !== key) groups.push({ key, label: dayLabel(date), sessions: [] });
    groups.at(-1).sessions.push(session);
  }
  return groups;
}

function SessionCard({ session, now }) {
  const seconds = session.live ? (now - Date.parse(session.started_at)) / 1000 : session.duration_s;
  return (
    <Link
      to={`/jeux/${session.appid}`}
      className="flex min-w-0 gap-3 rounded-xl border bg-card/80 p-2.5 backdrop-blur transition-colors hover:border-neon-violet/40 sm:p-3"
    >
      <GameImage appid={session.appid} alt={session.game_name} className="aspect-[460/215] w-20 shrink-0 rounded-md sm:w-28" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold sm:text-base">{session.game_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(session.started_at))}
        </p>
        <div className="mt-1.5 flex items-center gap-2 sm:mt-2">
          <span className="text-sm tabular-nums text-neon-cyan">{formatDuration(seconds)}</span>
          {session.live && <Badge variant="live">en cours</Badge>}
        </div>
      </div>
    </Link>
  );
}

/** Historique des sessions, en défilement alterné gauche / droite autour d'une ligne qui se remplit au scroll. */
export function SessionTimeline({ sessions }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const now = useNow(sessions.some((session) => session.live));
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const shown = sessions.slice(0, visible);
  const groups = groupByDay(shown);
  let position = 0;

  return (
    <section className="container py-12 sm:py-16">
      <SectionTitle eyebrow="Historique" title="Tes dernières sessions" />
      {sessions.length === 0 ? (
        <p className="text-muted-foreground">Aucune session enregistrée pour l’instant. Lance un jeu !</p>
      ) : (
        <>
          <div ref={ref} className="relative">
            <div className="absolute bottom-0 left-3 top-0 w-px bg-border md:left-1/2" />
            <motion.div
              style={{ scaleY: progress }}
              className="absolute bottom-0 left-3 top-0 w-px origin-top bg-gradient-to-b from-neon-cyan via-neon-violet to-neon-pink md:left-1/2"
            />
            <ol className="grid grid-cols-1 gap-4 sm:gap-6">
              {groups.map((group) => (
                <li key={group.key} className="grid grid-cols-1 gap-4 sm:gap-6">
                  {/* En-tête du jour, posé sur la ligne de temps. */}
                  <Reveal className="relative flex md:justify-center">
                    <span className="relative z-10 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-foreground/90 shadow-sm">
                      {group.label}
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        · {group.sessions.length} session{group.sessions.length > 1 ? 's' : ''}
                      </span>
                    </span>
                  </Reveal>
                  <ol className="grid grid-cols-1 gap-4 sm:gap-6">
                    {group.sessions.map((session) => {
                      const left = position % 2 === 0;
                      position += 1;
                      return (
                        <li key={session.id} className="relative grid min-w-0 grid-cols-1 md:grid-cols-2 md:gap-12">
                          <span
                            className={cn(
                              'absolute left-3 top-6 size-3 -translate-x-1/2 rounded-full border-2 border-background md:left-1/2',
                              session.live ? 'bg-neon-red shadow-[0_0_12px_#f43f5e]' : 'bg-neon-violet',
                            )}
                          />
                          <Reveal from={left ? 'left' : 'right'} className={cn('min-w-0 pl-8 md:pl-0', !left && 'md:col-start-2')}>
                            <SessionCard session={session} now={now} />
                          </Reveal>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              ))}
            </ol>
          </div>
          {visible < sessions.length && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
                <ChevronDown />
                Afficher plus ({sessions.length - visible})
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
