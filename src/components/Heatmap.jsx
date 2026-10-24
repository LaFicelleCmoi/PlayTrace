import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { SectionTitle } from '@/components/SectionTitle';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatDuration } from '@/lib/format';

// Le serveur renvoie dimanche en premier ; on affiche du lundi au dimanche.
const DAYS = [
  { index: 1, label: 'Lun' },
  { index: 2, label: 'Mar' },
  { index: 3, label: 'Mer' },
  { index: 4, label: 'Jeu' },
  { index: 5, label: 'Ven' },
  { index: 6, label: 'Sam' },
  { index: 0, label: 'Dim' },
];

/** Regroupe les 24 heures par tranches de `size` heures (8 colonnes de 3 h sur mobile). */
function bucketize(row, size) {
  return Array.from({ length: 24 / size }, (_, bucket) =>
    row.slice(bucket * size, bucket * size + size).reduce((sum, seconds) => sum + seconds, 0),
  );
}

function hourLabel(hour, size) {
  return size === 1 ? `${hour}h` : `${hour}-${hour + size}h`;
}

export function Heatmap({ heatmap }) {
  // Sur petit écran, 24 colonnes deviennent illisibles : on passe à des tranches de 3 h.
  const size = useMediaQuery('(min-width: 640px)') ? 1 : 3;
  const rows = DAYS.map((day) => ({ ...day, cells: bucketize(heatmap[day.index], size) }));
  const columns = 24 / size;
  const max = Math.max(1, ...rows.flatMap((row) => row.cells));
  const empty = heatmap.flat().every((seconds) => seconds === 0);
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };

  return (
    <section className="container py-12 sm:py-16">
      <SectionTitle
        eyebrow="Heatmap"
        title="Quand est-ce que tu joues ?"
        description="Temps de jeu par jour de la semaine et heure de début de session."
      />
      <Reveal>
        <Card className="bg-card/80 p-3 sm:p-6">
          <div className="grid gap-1">
            <div className="flex items-end gap-1.5 sm:gap-2">
              <span className="w-7 shrink-0 sm:w-9" />
              <div className="grid min-w-0 flex-1 gap-1 text-[9px] text-muted-foreground sm:text-[10px]" style={grid}>
                {Array.from({ length: columns }, (_, column) => {
                  const hour = column * size;
                  return (
                    <span key={hour} className="truncate text-center">
                      {size === 3 || hour % 3 === 0 ? `${hour}h` : ''}
                    </span>
                  );
                })}
              </div>
            </div>
            {rows.map((day, row) => (
              <div key={day.index} className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-7 shrink-0 text-[10px] text-muted-foreground sm:w-9 sm:text-xs">{day.label}</span>
                <div className="grid min-w-0 flex-1 gap-1" style={grid}>
                  {day.cells.map((seconds, column) => {
                    const intensity = seconds / max;
                    return (
                      <motion.div
                        key={`${size}-${column}`}
                        title={`${day.label} ${hourLabel(column * size, size)} : ${formatDuration(seconds)}`}
                        initial={{ opacity: 0, scale: 0.4 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: (row * columns + column) * (size === 1 ? 0.004 : 0.012), duration: 0.3 }}
                        className="aspect-square rounded-[3px] border border-white/5 sm:rounded-[4px]"
                        style={{
                          backgroundColor: seconds ? `rgba(232, 121, 249, ${0.15 + intensity * 0.85})` : 'hsl(var(--secondary))',
                          boxShadow: intensity > 0.6 ? '0 0 12px rgba(232, 121, 249, 0.6)' : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{empty ? 'La heatmap se remplira au fil de tes sessions.' : size === 3 ? 'Tranches de 3 heures' : 'Une case par heure'}</span>
            <span className="flex items-center gap-1.5">
              Moins
              {[0.15, 0.4, 0.7, 1].map((alpha) => (
                <span key={alpha} className="size-3 rounded-[3px]" style={{ backgroundColor: `rgba(232, 121, 249, ${alpha})` }} />
              ))}
              Plus
            </span>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
