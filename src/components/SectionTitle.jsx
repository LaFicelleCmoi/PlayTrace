import { Reveal } from '@/components/ui/reveal';

export function SectionTitle({ eyebrow, title, description }) {
  return (
    <Reveal className="mb-6 sm:mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-cyan sm:tracking-[0.3em]">{eyebrow}</p>
      <h2 className="mt-2 text-[clamp(1.6rem,6vw,2.5rem)] font-bold leading-tight">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
    </Reveal>
  );
}
