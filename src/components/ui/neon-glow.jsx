import { cn } from '@/lib/utils';

const GRADIENT = 'bg-[conic-gradient(from_0deg,#22d3ee,#a78bfa,#f472b6,#f43f5e,#f472b6,#a78bfa,#22d3ee)]';

/** Halo néon arc-en-ciel qui tourne autour du parent, avec un liseré net et une lueur floue qui respire. Le parent doit être `relative` et son contenu posé par-dessus. */
export function NeonGlow({ className }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute -inset-[2px] rounded-[calc(1rem+2px)]', className)}>
      <div className="absolute inset-0 animate-pulse overflow-hidden rounded-[inherit] opacity-70 blur-xl">
        <div className={cn('absolute left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 animate-border-spin [animation-duration:6s]', GRADIENT)} />
      </div>
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className={cn('absolute left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 animate-border-spin [animation-duration:6s]', GRADIENT)} />
      </div>
    </div>
  );
}
