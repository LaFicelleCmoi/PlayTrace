import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Hourglass } from 'lucide-react';

/** Section repliée tant qu'elle n'a pas assez de données, avec un aperçu à la demande. */
export function DeferredSection({ id, eyebrow, title, reason, deferred, children }) {
  const [open, setOpen] = useState(false);
  if (!deferred) return <div id={id} className="scroll-mt-32">{children}</div>;

  return (
    <div id={id} className="scroll-mt-32">
      <div className="container pt-6">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-white/10 p-4 text-left transition-colors hover:border-white/20 hover:bg-card/40 sm:p-5"
        >
          <Hourglass className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-neon-cyan">{eyebrow}</p>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{reason}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {open ? 'Replier' : 'Aperçu'}
            <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
