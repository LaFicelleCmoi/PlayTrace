import { cn } from '@/lib/utils';

/** Défilement horizontal infini (inspiré de Magic UI). Le contenu est dupliqué pour boucler sans saut. */
export function Marquee({ className, duration = 40, gap = '1rem', reverse = false, children }) {
  return (
    <div
      className={cn('group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]', className)}
      style={{ '--duration': `${duration}s`, '--gap': gap, gap }}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            'flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]',
          )}
          style={{ gap }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
