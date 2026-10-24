import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ChevronDown, CircleHelp, EyeOff, Lock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountUp } from '@/components/ui/count-up';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionTitle } from '@/components/SectionTitle';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 24;

const FILTERS = [
  { id: 'all', label: 'Tous', test: () => true },
  { id: 'unlocked', label: 'Obtenus', test: (item) => item.achieved },
  { id: 'locked', label: 'Manquants', test: (item) => !item.achieved },
];

const SORTS = [
  { id: 'rarity', label: 'Rareté', compare: (a, b) => (a.percent ?? 101) - (b.percent ?? 101) },
  { id: 'date', label: 'Date', compare: (a, b) => new Date(b.unlockedAt ?? 0) - new Date(a.unlockedAt ?? 0) },
  { id: 'name', label: 'Nom', compare: (a, b) => a.name.localeCompare(b.name, 'fr') },
];

/** Paliers de rareté selon le pourcentage mondial de joueurs ayant le succès. */
function rarityOf(percent) {
  if (percent === null) return null;
  if (percent <= 5) return { label: 'Ultra rare', className: 'text-neon-pink', bar: 'bg-neon-pink' };
  if (percent <= 15) return { label: 'Rare', className: 'text-neon-violet', bar: 'bg-neon-violet' };
  if (percent <= 40) return { label: 'Peu commun', className: 'text-neon-cyan', bar: 'bg-neon-cyan' };
  return { label: 'Commun', className: 'text-muted-foreground', bar: 'bg-muted-foreground/60' };
}

function formatPercent(percent) {
  return `${formatNumber(percent, percent < 10 ? 1 : 0)} %`;
}

function SegmentedControl({ options, value, onChange, label, layoutId }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 [scrollbar-width:none]" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            'relative shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
            value === option.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {value === option.id && (
            <motion.span layoutId={layoutId} className="absolute inset-0 rounded-md bg-secondary" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
          )}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// Trois états bien distincts : obtenu (couleur, halo, date), manquant (gris, pointillés), inconnu (profil privé).
function AchievementCard({ item, known }) {
  const [revealed, setRevealed] = useState(false);
  const rarity = rarityOf(item.percent);
  const state = !known ? 'unknown' : item.achieved ? 'unlocked' : 'locked';
  const secret = item.hidden && state !== 'unlocked' && !revealed;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative rounded-xl',
        // Obtenu : liseré dégradé néon tout autour de la carte.
        state === 'unlocked' &&
          'bg-gradient-to-br from-neon-lime/70 via-neon-cyan/40 to-neon-violet/60 p-px shadow-[0_0_30px_-12px_rgba(163,230,53,0.7)]',
      )}
    >
      <div
        className={cn(
          'relative flex h-full gap-3 overflow-hidden rounded-xl p-3 transition duration-300',
          state === 'unlocked' && 'rounded-[11px] bg-background',
          state === 'locked' && 'border border-dashed border-white/10 bg-transparent opacity-60 hover:opacity-100',
          state === 'unknown' && 'border bg-card/70',
        )}
        style={state === 'unlocked' ? { backgroundImage: 'linear-gradient(135deg, rgba(163, 230, 53, 0.1), rgba(167, 139, 250, 0.06) 55%, transparent)' } : undefined}
      >
        {state === 'unlocked' && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
        )}

        <div className="relative shrink-0 self-start">
          {state === 'unlocked' && <span aria-hidden className="absolute -inset-1 rounded-xl bg-neon-lime/30 blur-md" />}
          {item.icon ? (
            <img
              src={state === 'locked' ? item.iconGray : item.icon}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className={cn(
                'relative size-12 rounded-lg sm:size-14',
                state === 'unlocked' && 'ring-2 ring-neon-lime/70',
                state === 'locked' && 'border border-white/10 brightness-75 grayscale',
                state === 'unknown' && 'border',
              )}
            />
          ) : (
            <div className="relative flex size-12 items-center justify-center rounded-lg border bg-secondary sm:size-14">
              <Trophy className="size-5 text-muted-foreground" />
            </div>
          )}
          {state === 'unlocked' && <CheckCircle2 className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-background text-neon-lime" />}
          {state === 'locked' && <Lock className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-background p-0.5 text-muted-foreground" />}
          {state === 'unknown' && <CircleHelp className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-background text-muted-foreground" />}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-semibold leading-snug', state === 'locked' ? 'text-muted-foreground' : 'text-foreground')}>
              {item.name}
            </p>
            {rarity && (
              <span className={cn('shrink-0 text-[11px] font-semibold', state === 'locked' ? 'text-muted-foreground' : rarity.className)}>
                {formatPercent(item.percent)}
              </span>
            )}
          </div>

          {secret ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <EyeOff className="size-3.5" />
              Succès caché · révéler
            </button>
          ) : (
            item.description && (
              <p className={cn('mt-0.5 text-xs leading-relaxed', state === 'locked' ? 'text-muted-foreground/80' : 'text-muted-foreground')}>
                {item.description}
              </p>
            )
          )}

          {rarity && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className={cn('h-full rounded-full', state === 'locked' ? 'bg-muted-foreground/40' : rarity.bar)}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(2, item.percent)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className={cn('shrink-0 text-[10px] uppercase tracking-wide', state === 'locked' ? 'text-muted-foreground' : rarity.className)}>
                {rarity.label}
              </span>
            </div>
          )}

          {state === 'unlocked' && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-neon-lime/10 px-2 py-0.5 text-[11px] font-medium text-neon-lime">
              <CheckCircle2 className="size-3" />
              Obtenu{item.unlockedAt ? ` le ${formatDate(item.unlockedAt)}` : ''}
            </p>
          )}
          {state === 'locked' && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-white/10 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Lock className="size-3" />
              Pas encore obtenu
            </p>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function PrivateNotice() {
  return (
    <Card className="mb-6 flex flex-col gap-3 border-neon-violet/30 bg-neon-violet/[0.06] p-4 sm:flex-row sm:items-center sm:p-5">
      <Lock className="size-6 shrink-0 text-neon-violet" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Tes succès sont privés sur Steam</p>
        <p className="mt-1 text-muted-foreground">
          Voici les succès du jeu et leur rareté, mais pas lesquels tu as obtenus. Pour les voir : Steam → ton profil →
          Modifier le profil → Paramètres de confidentialité → <strong>Mon profil : Public</strong> et{' '}
          <strong>Détails des jeux : Public</strong>.
        </p>
      </div>
      <a
        href="https://steamcommunity.com/my/edit/settings"
        target="_blank"
        rel="noreferrer noopener"
        className="shrink-0 rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-secondary"
      >
        Ouvrir les réglages
      </a>
    </Card>
  );
}

/** Succès d'un jeu : progression, rareté mondiale, obtenus et manquants. */
export function Achievements({ achievements }) {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('rarity');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const known = achievements.status === 'ok';

  const items = useMemo(() => {
    const test = FILTERS.find((option) => option.id === filter).test;
    return achievements.items.filter(test).sort(SORTS.find((option) => option.id === sort).compare);
  }, [achievements.items, filter, sort]);

  if (achievements.status === 'none') {
    return (
      <section className="py-10 sm:py-12">
        <SectionTitle eyebrow="Succès" title="Pas de succès" description="Ce jeu ne propose pas de succès Steam." />
      </section>
    );
  }

  const progress = achievements.total ? achievements.unlocked / achievements.total : 0;
  const rarest = achievements.items
    .filter((item) => item.achieved && item.percent !== null)
    .sort((a, b) => a.percent - b.percent)[0];
  const lastUnlocked = achievements.items
    .filter((item) => item.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))[0];

  return (
    <section className="py-10 sm:py-12">
      <SectionTitle eyebrow="Succès" title="Tes trophées" />

      {achievements.status === 'private' && <PrivateNotice />}
      {achievements.status === 'unavailable' && (
        <p className="mb-6 text-sm text-muted-foreground">Steam ne répond pas pour tes succès : seule la liste du jeu est affichée.</p>
      )}

      {known && (
        <Card className="mb-6 flex flex-col items-center gap-5 bg-card/80 p-5 text-center sm:flex-row sm:p-6 sm:text-left">
          <ProgressRing value={progress} size={128}>
            <span className="text-2xl font-bold tabular-nums">
              <CountUp value={progress * 100} /> %
            </span>
            <span className="text-[11px] text-muted-foreground">complété</span>
          </ProgressRing>
          <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Obtenus</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {achievements.unlocked}
                <span className="text-base text-muted-foreground"> / {achievements.total}</span>
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Le plus rare</p>
              <p className="mt-1 truncate font-semibold">{rarest ? rarest.name : '—'}</p>
              {rarest && <p className="text-xs text-neon-pink">{formatPercent(rarest.percent)} des joueurs</p>}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Dernier obtenu</p>
              <p className="mt-1 truncate font-semibold">{lastUnlocked ? lastUnlocked.name : '—'}</p>
              {lastUnlocked && <p className="text-xs text-muted-foreground">{formatDate(lastUnlocked.unlockedAt)}</p>}
            </div>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {known ? (
          <SegmentedControl
            label="Filtrer les succès"
            layoutId="achievements-filter"
            value={filter}
            onChange={(id) => {
              setFilter(id);
              setVisible(PAGE_SIZE);
            }}
            options={FILTERS.map((option) => ({
              ...option,
              label: `${option.label} (${achievements.items.filter(option.test).length})`,
            }))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{achievements.total} succès dans ce jeu</p>
        )}
        <SegmentedControl
          label="Trier les succès"
          layoutId="achievements-sort"
          value={sort}
          onChange={setSort}
          options={known ? SORTS : SORTS.filter((option) => option.id !== 'date')}
        />
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {filter === 'locked' ? 'Tout est débloqué. Respect.' : 'Aucun succès obtenu pour l’instant.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.slice(0, visible).map((item) => (
              <AchievementCard key={item.apiName} item={item} known={known} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {visible < items.length && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            <ChevronDown />
            Afficher plus ({items.length - visible})
          </Button>
        </div>
      )}
    </section>
  );
}
