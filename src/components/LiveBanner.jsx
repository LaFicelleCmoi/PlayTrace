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
    <div className="container -mt-8 relative z-20">
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
            <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <GameImage appid={status.appid} alt={status.gameName} className="aspect-[460/215] w-full rounded-lg sm:w-48" />
              <div className="min-w-0 flex-1">
                <Badge variant="live">
                  <PulseDot />
                  EN DIRECT
                </Badge>
                <p className="mt-3 text-sm text-muted-foreground">En train de jouer à…</p>
                <motion.h2
                  animate={{ opacity: [1, 0.75, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="truncate text-2xl font-bold sm:text-3xl"
                >
                  {status.gameName}
                </motion.h2>
                <p className="mt-1 text-xs text-muted-foreground">Session lancée {formatDateTime(status.startedAt)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Session en cours</p>
                <p className="font-mono text-3xl font-semibold tabular-nums text-neon-cyan sm:text-4xl">{formatClock(elapsed)}</p>
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
            className="flex items-center gap-4 rounded-2xl border bg-card/80 p-5 backdrop-blur"
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
