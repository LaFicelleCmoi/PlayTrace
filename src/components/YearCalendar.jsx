import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { SectionTitle } from '@/components/SectionTitle';
import { formatDate, formatDuration, formatNumber } from '@/lib/format';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const ROW_LABELS = ['Lun', '', 'Mer', '', 'Ven', '', 'Dim'];

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Semaines (lundi → dimanche) qui couvrent l'année, avec la colonne où commence chaque mois. */
function buildWeeks(year) {
  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(year, 11, 31);
  const weeks = [];
  const months = [];
  for (const cursor = new Date(start); cursor <= end; ) {
    const week = [];
    for (let day = 0; day < 7; day += 1) {
      const inYear = cursor.getFullYear() === year;
      if (inYear && cursor.getDate() === 1) months.push({ label: MONTHS[cursor.getMonth()], column: weeks.length });
      week.push(inYear ? { key: dayKey(cursor), date: new Date(cursor) } : null);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return { weeks, months };
}

/** Calendrier de l'année, une case par jour, intensité selon le temps joué. */
export function YearCalendar({ year, daily, trackingSince }) {
  const scroller = useRef(null);
  const { weeks, months } = useMemo(() => buildWeeks(year), [year]);
  const byDay = useMemo(() => new Map(daily.map((day) => [day.day, day])), [daily]);
  const max = Math.max(1, ...daily.map((day) => day.seconds));
  const today = dayKey(new Date());
  const since = trackingSince ? dayKey(new Date(trackingSince)) : null;
  const best = daily.reduce((top, day) => (!top || day.seconds > top.seconds ? day : top), null);
  const activeDays = daily.filter((day) => day.seconds > 0).length;

  // Sur mobile le calendrier défile : on se place sur la semaine en cours.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const todayCell = element.querySelector('[data-today]');
    if (todayCell) element.scrollLeft = todayCell.offsetLeft - element.clientWidth / 2;
  }, []);

  return (
    <section className="container py-12 sm:py-16">
      <SectionTitle
        eyebrow="Calendrier"
        title={`Ton ${year}, jour par jour`}
        description={
          activeDays
            ? `${formatNumber(activeDays)} jour${activeDays > 1 ? 's' : ''} de jeu${best ? ` · record le ${formatDate(`${best.day}T12:00:00`, { day: 'numeric', month: 'long' })} avec ${formatDuration(best.seconds)}` : ''}.`
            : 'Chaque jour joué viendra s’allumer ici.'
        }
      />
      <Reveal>
        <Card className="bg-card/80 p-3 sm:p-5">
          <div ref={scroller} className="overflow-x-auto pb-2 [scrollbar-width:thin]">
            <div className="min-w-[720px]">
              <div className="ml-8 grid gap-[3px] text-[10px] text-muted-foreground" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
                {weeks.map((_, column) => (
                  <span key={column} className="h-4 whitespace-nowrap">
                    {months.find((month) => month.column === column)?.label ?? ''}
                  </span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                <div className="grid w-7 shrink-0 grid-rows-7 gap-[3px] pr-1 text-[10px] text-muted-foreground">
                  {ROW_LABELS.map((label, row) => (
                    <span key={row} className="flex items-center leading-none">{label}</span>
                  ))}
                </div>
                <div
                  className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px]"
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
                >
                  {weeks.flatMap((week, column) =>
                    week.map((day, row) => {
                      if (!day) return <span key={`${column}-${row}`} />;
                      const entry = byDay.get(day.key);
                      const future = day.key > today;
                      const untracked = since && day.key < since;
                      const intensity = entry ? entry.seconds / max : 0;
                      const label = `${formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })} : ${
                        entry ? `${formatDuration(entry.seconds)} (${entry.sessions} session${entry.sessions > 1 ? 's' : ''})` : future ? 'à venir' : 'pas de jeu'
                      }`;
                      return (
                        <motion.span
                          key={day.key}
                          title={label}
                          data-today={day.key === today ? '' : undefined}
                          initial={{ opacity: 0, scale: 0.3 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: column * 0.012, duration: 0.25 }}
                          className="aspect-square rounded-[3px]"
                          style={{
                            backgroundColor: entry
                              ? `rgba(232, 121, 249, ${0.2 + intensity * 0.8})`
                              : future || untracked
                                ? 'transparent'
                                : 'hsl(var(--secondary))',
                            border: future || untracked ? '1px dashed hsl(var(--border))' : undefined,
                            boxShadow: [
                              intensity > 0.6 ? '0 0 10px rgba(232, 121, 249, 0.6)' : null,
                              day.key === today ? '0 0 0 1.5px #22d3ee' : null,
                            ]
                              .filter(Boolean)
                              .join(', ') || undefined,
                          }}
                        />
                      );
                    }),
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] ring-[1.5px] ring-neon-cyan" /> aujourd’hui
              <span className="ml-3 size-3 rounded-[3px] border border-dashed border-border" /> avant le suivi / à venir
            </span>
            <span className="flex items-center gap-1.5">
              Moins
              {[0.2, 0.45, 0.7, 1].map((alpha) => (
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
