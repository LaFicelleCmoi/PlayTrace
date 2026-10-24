import { cn } from '@/lib/utils';

/** Faisceau lumineux qui tourne sur la bordure du parent (inspiré de Magic UI). Le parent doit être `relative`. */
export function BorderBeam({ className, width = 1.5 }) {
  return (
    <div
      aria-hidden
      className={cn('mask-border pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]', className)}
      style={{ padding: width }}
    >
      <div className="absolute left-1/2 top-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full animate-border-spin bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,#22d3ee_300deg,#f472b6_340deg,transparent_360deg)]" />
      </div>
    </div>
  );
}
