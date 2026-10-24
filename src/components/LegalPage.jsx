import { useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/** Mise en page des pages légales : sommaire collant et sections ancrées. */
export function LegalPage({ eyebrow, title, intro, updatedAt, sections }) {
  useEffect(() => {
    document.title = `${title} · PlayTrace`;
    // Arrivée par une ancre (#contact) : on y descend une fois la page affichée.
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
  }, [title]);

  return (
    <div className="container py-10 sm:py-14">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon-cyan">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(2rem,6vw,3rem)] font-black leading-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{intro}</p>
        <p className="mt-2 text-xs text-muted-foreground">Dernière mise à jour : {updatedAt}</p>
      </motion.header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Sommaire" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1 border-l border-white/10 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="-ml-px block border-l border-transparent py-1 pl-4 text-muted-foreground transition-colors hover:border-neon-violet hover:text-foreground">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold sm:text-2xl">{section.title}</h2>
              <div
                className={cn(
                  'mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]',
                  '[&_a]:text-neon-cyan [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:text-foreground',
                  '[&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5',
                  '[&_table]:w-full [&_table]:text-left [&_td]:border-t [&_td]:border-white/10 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-3 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-foreground/70',
                )}
              >
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
