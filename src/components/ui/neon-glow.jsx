import { cn } from '@/lib/utils';

const GRADIENT =
  'bg-[conic-gradient(from_0deg,transparent_0deg,#22d3ee_60deg,transparent_120deg,transparent_180deg,#a78bfa_240deg,transparent_300deg)]';

const CORNERS = [
  '-left-1.5 -top-1.5 border-l-2 border-t-2 rounded-tl-[inherit]',
  '-right-1.5 -top-1.5 border-r-2 border-t-2 rounded-tr-[inherit]',
  '-bottom-1.5 -left-1.5 border-b-2 border-l-2 rounded-bl-[inherit]',
  '-bottom-1.5 -right-1.5 border-b-2 border-r-2 rounded-br-[inherit]',
];

/** Cadre façon HUD de jeu vidéo : liseré néon discret qui tourne, lueur légère et coins de visée. Le parent doit être `relative` et son contenu posé par-dessus. */
export function NeonGlow({ className }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute -inset-px rounded-[calc(1rem+1px)]', className)}>
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] opacity-30 blur-lg">
        <div className={cn('absolute left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 animate-border-spin [animation-duration:10s]', GRADIENT)} />
      </div>
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white/5">
        <div className={cn('absolute left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 animate-border-spin opacity-60 [animation-duration:10s]', GRADIENT)} />
      </div>
      {CORNERS.map((corner) => (
        <span key={corner} className={cn('absolute size-4 animate-pulse border-neon-cyan/80 sm:size-5', corner)} />
      ))}
    </div>
  );
}
