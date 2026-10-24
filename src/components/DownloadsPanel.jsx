import { AnimatePresence, motion } from 'motion/react';
import { Download, Hourglass, Pause, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GameImage } from '@/components/GameImage';
import { formatBytes, formatDuration, formatSpeed } from '@/lib/format';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

const STATES = {
  downloading: { label: 'Téléchargement', icon: Download, className: 'border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan' },
  installing: { label: 'Installation', icon: PackageCheck, className: 'border-neon-violet/40 bg-neon-violet/15 text-neon-violet' },
  paused: { label: 'En pause', icon: Pause, className: 'border-border bg-secondary text-muted-foreground' },
  queued: { label: 'En attente', icon: Hourglass, className: 'border-border bg-secondary text-muted-foreground' },
};

function progressOf(download) {
  if (download.state === 'installing' && download.bytesToStage > 0) return download.bytesStaged / download.bytesToStage;
  return download.bytesToDownload > 0 ? download.bytesDownloaded / download.bytesToDownload : 0;
}

function DownloadRow({ download }) {
  const { label, icon: Icon, className } = STATES[download.state];
  const progress = Math.min(1, progressOf(download));
  const active = download.state === 'downloading';
  const remaining = download.bytesToDownload - download.bytesDownloaded;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 rounded-xl border bg-card/80 p-3 backdrop-blur sm:gap-4"
    >
      <Link to={`/jeux/${download.appid}`} className="shrink-0 rounded-md">
        <GameImage appid={download.appid} alt={download.name} className="aspect-[460/215] w-16 rounded-md sm:w-28" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <Link to={`/jeux/${download.appid}`} className="min-w-0 truncate text-sm font-semibold hover:underline sm:text-base">
            {download.name}
          </Link>
          <Badge className={cn('shrink-0', className)}>
            <Icon className="size-3" />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </Badge>
        </div>
        <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={cn(
              'h-full rounded-full',
              active || download.state === 'installing'
                ? 'bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink'
                : 'bg-muted-foreground/40',
            )}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {active && (
            <motion.div
              aria-hidden
              className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ left: ['-25%', '100%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap justify-between gap-x-4 text-xs tabular-nums text-muted-foreground">
          <span>
            {formatBytes(download.bytesDownloaded)} / {formatBytes(download.bytesToDownload)} · {Math.floor(progress * 100)} %
          </span>
          {active && download.speed > 0 && (
            <span className="text-neon-cyan">
              {formatSpeed(download.speed)} · ~{formatDuration(remaining / download.speed)} restantes
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}

/** Jeux que le client Steam de ce PC télécharge, met à jour ou installe. Masqué quand il n'y a rien. */
export function DownloadsPanel({ downloads }) {
  const activeCount = downloads.filter((download) => download.state === 'downloading').length;

  return (
    <AnimatePresence>
      {downloads.length > 0 && (
        <motion.section
          key="downloads"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="container overflow-hidden"
          aria-label="Téléchargements en cours"
        >
          <div className="pt-5 sm:pt-6">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:text-sm sm:tracking-[0.2em]">
              <Download className={cn('size-4', activeCount > 0 && 'animate-bounce text-neon-cyan')} />
              Téléchargements en cours
              <span className="text-xs normal-case tracking-normal">({downloads.length})</span>
            </h2>
            <ul className="grid grid-cols-1 gap-2">
              <AnimatePresence initial={false}>
                {downloads.map((download) => (
                  <DownloadRow key={download.appid} download={download} />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
