import { motion } from 'motion/react';
import { CalendarDays, Clock3, Flame, Hourglass, Lock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { SectionTitle } from '@/components/SectionTitle';
import { formatDuration, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

function Fact({ icon: Icon, label, value, hint, delay }) {
  return (
    <Reveal delay={delay}>
      <Card className="h-full bg-card/70 p-4">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
          <Icon className="size-3.5 shrink-0" />
          {label}
        </p>
        <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </Card>
    </Reveal>
  );
}

// Teinte de la couleur du badge, sans dépendre des opacités Tailwind (incompatibles avec une variable CSS).
function tint(color, percent) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function Badge({ badge, index }) {
  const Icon = badge.icon;
  return (
    <motion.li
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      style={badge.earned ? { '--badge': badge.color, borderColor: tint(badge.color, 40), backgroundColor: tint(badge.color, 7) } : undefined}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition duration-300',
        badge.earned ? 'hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_var(--badge)]' : 'bg-card/50',
      )}
    >
      <div
        style={badge.earned ? { borderColor: tint(badge.color, 50), backgroundColor: tint(badge.color, 15) } : undefined}
        className={cn('relative flex size-14 items-center justify-center rounded-2xl border', !badge.earned && 'border-border bg-secondary')}
      >
        {badge.earned && <span aria-hidden className="absolute inset-0 rounded-2xl opacity-20 blur-xl" style={{ backgroundColor: badge.color }} />}
        <Icon className={cn('relative size-6', !badge.earned && 'text-muted-foreground/60')} style={badge.earned ? { color: badge.color } : undefined} />
        {!badge.earned && <Lock className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-background p-0.5 text-muted-foreground" />}
      </div>
      <p className={cn('text-sm font-semibold', !badge.earned && 'text-foreground/70')}>{badge.title}</p>
      <p className="text-[11px] leading-snug text-muted-foreground">{badge.rule}</p>
      {!badge.earned && (
        <div className="mt-auto w-full pt-1">
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: badge.color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.round(badge.progress * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
            />
          </div>
          <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">{Math.round(badge.progress * 100)} %</p>
        </div>
      )}
    </motion.li>
  );
}

/** Personnalité de joueur, faits marquants et badges PlayTrace. */
export function PlayerProfile({ insights }) {
  const { persona, earned, badges } = insights;
  const hour = insights.favoriteHour;

  return (
    <section className="container py-12 sm:py-16">
      <SectionTitle eyebrow="Ton profil" title="Quel joueur es-tu ?" />

      <Reveal>
        <SpotlightCard className="rounded-2xl p-6 sm:p-8" color="rgba(167, 139, 250, 0.2)">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-neon-violet">
                <Sparkles className="size-4" />
                Ta personnalité
              </p>
              <p className="mt-2 text-[clamp(1.75rem,6vw,3rem)] font-black leading-tight text-gradient">{persona.title}</p>
              <p className="mt-1 text-muted-foreground">{persona.text}</p>
            </div>
            <p className="shrink-0 text-sm text-muted-foreground">
              <span className="text-3xl font-bold text-foreground">{earned.length}</span> / {badges.length} badges
            </p>
          </div>
        </SpotlightCard>
      </Reveal>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Fact
          icon={CalendarDays}
          label="Jour préféré"
          value={insights.favoriteDay ? insights.favoriteDay[0].toUpperCase() + insights.favoriteDay.slice(1) : '—'}
          hint={insights.weekendShare ? `${Math.round(insights.weekendShare * 100)} % le week-end` : undefined}
          delay={0}
        />
        <Fact
          icon={Clock3}
          label="Heure de pointe"
          value={hour === null ? '—' : `${hour} h – ${(hour + 1) % 24} h`}
          hint={insights.nightShare ? `${Math.round(insights.nightShare * 100)} % après minuit` : undefined}
          delay={0.05}
        />
        <Fact
          icon={Flame}
          label="Série record"
          value={`${insights.longestStreak} jour${insights.longestStreak > 1 ? 's' : ''}`}
          hint={insights.currentStreak ? `${insights.currentStreak} en cours` : `${formatNumber(insights.activeDays)} jours joués`}
          delay={0.1}
        />
        <Fact
          icon={Hourglass}
          label="Session moyenne"
          value={insights.averageSession ? formatDuration(insights.averageSession) : '—'}
          hint={insights.busiestDay ? `record : ${formatDuration(insights.busiestDay.seconds)} en un jour` : undefined}
          delay={0.15}
        />
      </div>

      <h3 className="mt-10 text-lg font-bold sm:text-xl">Badges PlayTrace</h3>
      <p className="mt-1 text-sm text-muted-foreground">Ils se débloquent tout seuls, au fil de tes parties.</p>
      <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {badges.map((badge, index) => (
          <Badge key={badge.id} badge={badge} index={index} />
        ))}
      </ul>
    </section>
  );
}
