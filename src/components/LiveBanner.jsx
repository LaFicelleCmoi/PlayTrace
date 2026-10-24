import { AnimatePresence, motion } from 'motion/react';
import { Moon, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/ui/border-beam';
import { GameImage } from '@/components/GameImage';
import { useNow } from '@/hooks/useNow';
import { formatClock, formatDateTime } from '@/lib/format';

function PulseDot() {
  return (
    <span className="relative flex size-3">
      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-neon-red" />
      <span className="relative inline-flex size-3 rounded-full bg-neon-red" />
    </span>
  );
}

export function LiveBanner({ status, connection }) {
  const playing = Boolean(status?.playing);
  const now = useNow(playing);
  const elapsed = playing ? (now - Date.parse(status.startedAt)) / 1000 : 0;

  return (
    <div className="container relative z-20 -mt-6 sm:-mt-8">
      <AnimatePresence mode="wait">
        {playing ? (
          <motion.div
            key={status.sessionId}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_0_60px_-15px_rgba(244,114,182,0.5)]"
          >
            <div className="absolute inset-0 opacity-25">
              <GameImage appid={status.appid} kind="hero" alt="" className="h-full w-full blur-sm" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/40" />
            <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4 p-4 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <GameImage appid={status.appid} alt={status.gameName} className="aspect-[460/215] w-24 rounded-lg sm:w-40 lg:w-48" />
              <div className="min-w-0">
                <Badge variant="live">
                  <PulseDot />
                  EN DIRECT
                </Badge>
                <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm">En train de jouer à…</p>
                <motion.h2
                  animate={{ opacity: [1, 0.75, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="line-clamp-2 break-words text-lg font-bold leading-tight sm:text-2xl lg:text-3xl"
                >
                  {status.gameName}
                </motion.h2>
                <p className="mt-1 hidden text-xs text-muted-foreground sm:block">Session lancée {formatDateTime(status.startedAt)}</p>
              </div>
              <div className="col-span-2 flex items-baseline justify-between gap-3 border-t border-white/5 pt-3 md:col-span-1 md:block md:border-0 md:pt-0 md:text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Session en cours</p>
                <p className="font-mono text-2xl font-semibold tabular-nums text-neon-cyan sm:text-3xl lg:text-4xl">{formatClock(elapsed)}</p>
              </div>
            </div>
            <BorderBeam width={2} />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-3 rounded-2xl border bg-card/80 p-4 backdrop-blur sm:gap-4 sm:p-5"
          >
            {connection === 'closed' ? (
              <WifiOff className="size-6 shrink-0 text-destructive" />
            ) : (
              <Moon className="size-6 shrink-0 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">{connection === 'closed' ? 'Connexion au direct perdue' : 'Aucun jeu détecté'}</p>
              <p className="text-sm text-muted-foreground">
                {connection === 'closed'
                  ? 'Nouvelle tentative dans quelques secondes…'
                  : 'Lance un jeu sur Steam : il apparaîtra ici en moins d’une minute.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
