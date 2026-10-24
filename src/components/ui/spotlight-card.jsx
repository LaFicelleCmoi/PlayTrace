import { useRef } from 'react';
import { cn } from '@/lib/utils';

/** Carte avec halo qui suit la souris, dans l'esprit des spotlight d'Aceternity UI. */
export function SpotlightCard({ className, color = 'rgba(232, 121, 249, 0.18)', children, ...props }) {
  const ref = useRef(null);

  function handleMove(event) {
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    ref.current.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn('group relative overflow-hidden rounded-xl border bg-card/80 backdrop-blur', className)}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--spot-x) var(--spot-y), ${color}, transparent 70%)` }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
