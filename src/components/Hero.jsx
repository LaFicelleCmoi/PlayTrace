import { motion } from 'motion/react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { CountUp } from '@/components/ui/count-up';
import { formatDate, formatDuration, formatNumber } from '@/lib/format';

function Stat({ label, children }) {
  return (
    <div className="rounded-xl border bg-card/60 px-4 py-3 text-left backdrop-blur">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold">{children}</p>
    </div>
  );
}

export function Hero({ user, stats, trackedSeconds }) {
  const { totals, library, trackingSince, year } = stats;

  return (
    <section className="relative overflow-hidden">
      <AuroraBackground />
      <div className="container relative z-10 py-20 text-center sm:py-28">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground"
        >
          Salut {user.pseudo} · ton {year} sur Steam
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-6xl font-bold tabular-nums sm:text-8xl"
        >
          <CountUp value={trackedSeconds / 3600} decimals={2} className="text-gradient" />
          <span className="ml-3 text-3xl text-muted-foreground sm:text-5xl">h</span>
        </motion.h1>
        <p className="mt-3 text-muted-foreground">
          de jeu suivies par PlayTrace
          {trackingSince && <> depuis le {formatDate(trackingSince)}</>}
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Sessions">{formatNumber(totals.sessions)}</Stat>
          <Stat label="Jeux joués">{formatNumber(totals.games)}</Stat>
          <Stat label="Plus longue session">{totals.longest ? formatDuration(totals.longest.seconds) : '—'}</Stat>
          <Stat label="Compteur Steam">{library.gameCount ? `${formatNumber(library.totalMinutes / 60)} h` : '—'}</Stat>
        </div>
      </div>
    </section>
  );
}
