import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { SectionTitle } from '@/components/SectionTitle';
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
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export function Heatmap({ heatmap }) {
  const max = Math.max(1, ...heatmap.flat());
  const empty = heatmap.flat().every((seconds) => seconds === 0);

  return (
    <section className="container py-16">
      <SectionTitle
        eyebrow="Heatmap"
        title="Quand est-ce que tu joues ?"
        description="Temps de jeu par jour de la semaine et heure de début de session."
      />
      <Reveal>
        <Card className="overflow-x-auto bg-card/80 p-4 sm:p-6">
          <div className="min-w-[640px]">
            <div className="ml-10 grid gap-1 text-[10px] text-muted-foreground" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {HOURS.map((hour) => (
                <span key={hour} className="text-center">{hour % 3 === 0 ? `${hour}h` : ''}</span>
              ))}
            </div>
            <div className="mt-1 grid gap-1">
              {DAYS.map((day, row) => (
                <div key={day.index} className="flex items-center gap-1">
                  <span className="w-9 shrink-0 text-xs text-muted-foreground">{day.label}</span>
                  <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                    {HOURS.map((hour) => {
                      const seconds = heatmap[day.index][hour];
                      const intensity = seconds / max;
                      return (
                        <motion.div
                          key={hour}
                          title={`${day.label} ${hour}h : ${formatDuration(seconds)}`}
                          initial={{ opacity: 0, scale: 0.4 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: (row * 24 + hour) * 0.004, duration: 0.3 }}
                          className="aspect-square rounded-[4px] border border-white/5"
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
          </div>
          {empty && <p className="mt-4 text-sm text-muted-foreground">La heatmap se remplira au fil de tes sessions.</p>}
        </Card>
      </Reveal>
    </section>
  );
}
