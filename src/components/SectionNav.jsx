import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/** Pastilles collantes vers chaque section du Wrapped ; celle à l'écran est mise en avant. */
export function SectionNav({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);
  const bar = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      // Une section est « active » quand elle traverse le haut de l'écran.
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const { id } of sections) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections]);

  // Sur mobile la barre défile : la pastille active reste visible.
  useEffect(() => {
    const chip = bar.current?.querySelector(`[data-section="${active}"]`);
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  return (
    <nav
      aria-label="Sections du Wrapped"
      className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-40 border-b border-white/5 bg-background/75 backdrop-blur-lg"
    >
      <div ref={bar} className="container flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            data-section={id}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            aria-current={active === id ? 'true' : undefined}
            className={cn(
              'relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              active === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active === id && (
              <motion.span layoutId="section-pill" className="absolute inset-0 rounded-full bg-secondary" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
            )}
            <span className="relative">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
