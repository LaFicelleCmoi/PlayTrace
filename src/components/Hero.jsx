import { motion } from 'motion/react';
import { Play, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { CountUp } from '@/components/ui/count-up';
import { formatDate, formatDuration, formatNumber } from '@/lib/format';

function Stat({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border bg-card/60 px-3 py-3 text-left backdrop-blur sm:px-4">
      <p className="text-[11px] uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-1 truncate text-base font-semibold sm:text-lg">{children}</p>
    </div>
  );
}

export function Hero({ user, stats, trackedSeconds, onPlay, onShare, sharing }) {
  const { totals, library, trackingSince, year } = stats;

  return (
    <section className="relative overflow-hidden">
      <AuroraBackground />
      <div className="container relative z-10 pb-16 pt-14 text-center sm:pb-24 sm:pt-24 lg:pb-28 lg:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-sm sm:tracking-[0.3em]"
        >
          <span className="block sm:inline">Salut {user.pseudo}</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline">ton {year} sur Steam</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 whitespace-nowrap text-[clamp(3.25rem,17vw,9rem)] font-bold leading-none tabular-nums sm:mt-6"
        >
          <CountUp value={trackedSeconds / 3600} decimals={2} className="text-gradient" />
          <span className="ml-2 text-[0.45em] text-muted-foreground sm:ml-3">h</span>
        </motion.h1>
        <p className="mx-auto mt-4 max-w-xs text-sm text-muted-foreground sm:max-w-none sm:text-base">
          de jeu suivies par PlayTrace
          {trackingSince && <> depuis le {formatDate(trackingSince)}</>}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row"
        >
          <Button size="lg" onClick={onPlay} className="group relative w-full overflow-hidden bg-white px-6 text-black hover:bg-white/90 sm:w-auto">
            <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-neon-violet/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Play className="fill-current" />
            Revivre mon {stats.year}
          </Button>
          <Button size="lg" variant="outline" onClick={onShare} disabled={sharing} className="w-full bg-background/40 px-6 backdrop-blur sm:w-auto">
            <Share2 />
            {sharing ? 'Création de l’image…' : 'Partager en image'}
          </Button>
        </motion.div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-2.5 sm:mt-12 sm:gap-3 md:grid-cols-4">
          <Stat label="Sessions">{formatNumber(totals.sessions)}</Stat>
          <Stat label="Jeux joués">{formatNumber(totals.games)}</Stat>
          <Stat label="Record de session">{totals.longest ? formatDuration(totals.longest.seconds) : '—'}</Stat>
          <Stat label="Compteur Steam">{library.gameCount ? `${formatNumber(library.totalMinutes / 60)} h` : '—'}</Stat>
        </div>
      </div>
    </section>
  );
}
