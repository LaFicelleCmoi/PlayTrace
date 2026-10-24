import { useState } from 'react';
import { gameArt } from '@/lib/format';
import { cn } from '@/lib/utils';

// Tous les jeux n'ont pas chaque visuel : on retombe sur le suivant, puis sur un dégradé.
const FALLBACKS = {
  capsule: ['capsule', 'header'],
  hero: ['hero', 'header'],
  header: ['header'],
};

export function GameImage({ appid, kind = 'header', alt, className }) {
  const [index, setIndex] = useState(0);
  const chain = FALLBACKS[kind];

  if (index >= chain.length) {
    return <div aria-hidden className={cn('bg-gradient-to-br from-neon-violet/30 via-secondary to-neon-cyan/20', className)} />;
  }
  return (
    <img
      src={gameArt(appid, chain[index])}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIndex((value) => value + 1)}
      className={cn('object-cover', className)}
    />
  );
}
