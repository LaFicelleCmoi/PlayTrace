import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/format';

const WIDTH = 600;
const HEIGHT = 180;
const DAY_MS = 86_400_000;
// Les longues pauses sont raccourcies sur l'axe, sinon les séries de succès s'empilent sur quelques pixels.
const MAX_GAP_MS = 7 * DAY_MS;
const MIN_GAP_MS = DAY_MS / 3;

/** Courbe cumulée des succès obtenus dans le temps, un point par succès. */
export function AchievementChart({ items, total }) {
  const [active, setActive] = useState(null);

  const { points, breaks } = useMemo(() => {
    const unlocked = items
      .filter((item) => item.achieved && item.unlockedAt)
      .sort((a, b) => new Date(a.unlockedAt) - new Date(b.unlockedAt));
    if (unlocked.length < 2) return { points: [], breaks: [] };

    // Temps « compressé » : chaque écart est borné entre 8 h et 7 jours.
    const positions = [0];
    const gaps = [];
    for (let index = 1; index < unlocked.length; index += 1) {
      const gap = new Date(unlocked[index].unlockedAt) - new Date(unlocked[index - 1].unlockedAt);
      if (gap > MAX_GAP_MS) gaps.push(index);
      positions.push(positions[index - 1] + Math.min(Math.max(gap, MIN_GAP_MS), MAX_GAP_MS));
    }
    const span = positions.at(-1) || 1;
    const result = unlocked.map((item, index) => ({
      item,
      x: 2 + (positions[index] / span) * 96,
      y: 100 - ((index + 1) / total) * 100,
    }));
    return {
      points: result,
      // Une pause raccourcie est marquée à mi-chemin entre les deux succès.
      breaks: gaps.map((index) => (result[index - 1].x + result[index].x) / 2),
    };
  }, [items, total]);

  if (points.length === 0) return null;

  // Escalier : le compteur monte d'un cran à chaque succès.
  let line = `M0,${HEIGHT}`;
  for (const point of points) line += ` H${(point.x / 100) * WIDTH} V${(point.y / 100) * HEIGHT}`;
  line += ` H${WIDTH}`;
  const area = `${line} V${HEIGHT} H0 Z`;

  const monthAgo = Date.now() - 30 * DAY_MS;
  const recent = points.filter((point) => new Date(point.item.unlockedAt).getTime() >= monthAgo).length;
  const hovered = active === null ? null : points[active];

  return (
    <Card className="mb-6 bg-card/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="size-4 text-neon-violet" />
          Ta progression
        </p>
        <p className="text-xs text-muted-foreground">
          {recent ? `${recent} succès ces 30 derniers jours` : `Dernier succès le ${formatDate(points.at(-1).item.unlockedAt)}`}
        </p>
      </div>

      <div className="relative" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-40 w-full sm:h-48" aria-hidden>
          <defs>
            <linearGradient id="achievement-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="achievement-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line key={ratio} x1="0" x2={WIDTH} y1={HEIGHT * ratio} y2={HEIGHT * ratio} stroke="rgba(255,255,255,0.06)" vectorEffect="non-scaling-stroke" />
          ))}
          {breaks.map((x) => (
            <line
              key={x}
              x1={(x / 100) * WIDTH}
              x2={(x / 100) * WIDTH}
              y1="0"
              y2={HEIGHT}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <motion.path d={area} fill="url(#achievement-area)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} />
          <motion.path
            d={line}
            fill="none"
            stroke="url(#achievement-line)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        </svg>

        {/* Points en HTML : ils restent ronds quelle que soit la largeur du graphique. */}
        {points.map((point, index) => (
          <button
            key={point.item.apiName}
            type="button"
            aria-label={`${point.item.name}, obtenu le ${formatDate(point.item.unlockedAt)}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-neon-violet transition-transform hover:scale-150 focus:scale-150 focus:outline-none"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          />
        ))}

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-y-full rounded-lg border bg-background/95 p-2.5 text-xs shadow-xl backdrop-blur"
            style={{
              left: `clamp(0px, calc(${hovered.x}% - 7rem), calc(100% - 14rem))`,
              top: `calc(${hovered.y}% - 12px)`,
            }}
          >
            <div className="flex items-center gap-2">
              {hovered.item.icon && <img src={hovered.item.icon} alt="" className="size-8 rounded" referrerPolicy="no-referrer" />}
              <div className="min-w-0">
                <p className="truncate font-semibold">{hovered.item.name}</p>
                <p className="text-muted-foreground">
                  {formatDate(hovered.item.unlockedAt)} · {active + 1}/{total}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>{formatDate(points[0].item.unlockedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        {breaks.length > 0 && (
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-3 border-l border-dashed border-white/30" /> pause de plus d’une semaine
          </span>
        )}
        <span>{formatDate(points.at(-1).item.unlockedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </Card>
  );
}
