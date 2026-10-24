import { Reveal } from '@/components/ui/reveal';

export function SectionTitle({ eyebrow, title, description }) {
  return (
    <Reveal className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon-cyan">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
    </Reveal>
  );
}
