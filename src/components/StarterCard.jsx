import { motion } from 'motion/react';
import { CheckCircle2, Rocket } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

const HOUR = 3600;

/** Le Wrapped est encore jeune : on montre ce qui va se débloquer plutôt que des graphiques vides. */
export function isStarter(stats, insights) {
  return stats.totals.sessions < 5 || insights.activeDays < 3;
}

export function StarterCard({ stats, insights }) {
  const { totals } = stats;
  const milestones = [
    { label: 'Première session suivie', detail: 'Le suivi est en place.', progress: totals.sessions / 1 },
    { label: '5 sessions', detail: 'Ton profil de joueur devient fiable.', progress: totals.sessions / 5, count: `${totals.sessions} / 5` },
    {
      label: '3 jours de jeu différents',
      detail: 'Le calendrier et tes créneaux préférés prennent forme.',
      progress: insights.activeDays / 3,
      count: `${insights.activeDays} / 3`,
    },
    {
      label: '10 heures suivies',
      detail: 'Ton vrai jeu de l’année se dessine.',
      progress: totals.trackedSeconds / (10 * HOUR),
      count: `${formatDuration(totals.trackedSeconds)} / 10 h`,
    },
  ].map((milestone) => ({ ...milestone, progress: Math.min(1, milestone.progress), done: milestone.progress >= 1 }));
  const overall = milestones.reduce((sum, milestone) => sum + milestone.progress, 0) / milestones.length;

  return (
    <section className="container pt-8 sm:pt-10">
      <Reveal>
        <SpotlightCard className="rounded-2xl p-5 sm:p-7" color="rgba(34, 211, 238, 0.16)">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
            <div className="lg:w-2/5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-neon-cyan">
                <Rocket className="size-4" />
                Ton Wrapped démarre
              </p>
              <h2 className="mt-2 text-[clamp(1.5rem,5vw,2.25rem)] font-bold leading-tight">Chaque partie le rend plus riche</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Le suivi tourne même onglet fermé. Les sections encore vides sont repliées en attendant tes prochaines sessions.
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.round(overall * 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{Math.round(overall * 100)} % du chemin vers un Wrapped complet</p>
            </div>

            <ol className="grid flex-1 gap-2.5 sm:grid-cols-2">
              {milestones.map((milestone, index) => (
                <motion.li
                  key={milestone.label}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className={cn(
                    'rounded-xl border p-3',
                    milestone.done ? 'border-neon-lime/40 bg-neon-lime/[0.06]' : 'border-dashed border-white/10',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {milestone.done ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon-lime" />
                    ) : (
                      <span className="mt-1 size-3 shrink-0 rounded-full border-2 border-muted-foreground/50" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-semibold', !milestone.done && 'text-foreground/85')}>{milestone.label}</p>
                      <p className="text-xs text-muted-foreground">{milestone.detail}</p>
                      {!milestone.done && milestone.count && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${Math.round(milestone.progress * 100)}%` }} />
                          </div>
                          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{milestone.count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
}
