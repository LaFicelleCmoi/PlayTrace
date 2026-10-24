import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, Radio, X } from 'lucide-react';
import { Link } from '@/lib/router';
import { dismiss, useToasts } from '@/lib/toast';
import { cn } from '@/lib/utils';

const TONES = {
  live: { icon: Radio, className: 'text-neon-red', ring: 'border-neon-red/30' },
  done: { icon: CheckCircle2, className: 'text-neon-lime', ring: 'border-neon-lime/30' },
  info: { icon: Info, className: 'text-neon-cyan', ring: 'border-neon-cyan/30' },
};

export function Toaster() {
  const toasts = useToasts();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => {
          const tone = TONES[item.tone] ?? TONES.info;
          const Icon = tone.icon;
          const body = (
            <>
              <Icon className={cn('mt-0.5 size-5 shrink-0', tone.className)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
              </div>
            </>
          );
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-card/95 p-3.5 shadow-2xl backdrop-blur',
                tone.ring,
              )}
            >
              {item.to ? (
                <Link to={item.to} onClick={() => dismiss(item.id)} className="flex min-w-0 flex-1 items-start gap-3">
                  {body}
                </Link>
              ) : (
                <div className="flex min-w-0 flex-1 items-start gap-3">{body}</div>
              )}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Fermer la notification"
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
