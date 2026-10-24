import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const BLOBS = [
  { className: 'left-[-10%] top-[-20%] h-[28rem] w-[28rem] bg-neon-violet/30', x: [0, 80, 0], y: [0, 40, 0] },
  { className: 'right-[-10%] top-[10%] h-[24rem] w-[24rem] bg-neon-cyan/25', x: [0, -60, 0], y: [0, 60, 0] },
  { className: 'bottom-[-20%] left-[30%] h-[26rem] w-[26rem] bg-neon-pink/25', x: [0, 50, 0], y: [0, -50, 0] },
];

/** Fond animé : halos néon flous qui dérivent lentement sur une grille. */
export function AuroraBackground({ className }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      {BLOBS.map((blob, index) => (
        <motion.div
          key={index}
          className={cn('absolute rounded-full blur-3xl', blob.className)}
          animate={{ x: blob.x, y: blob.y }}
          transition={{ duration: 18 + index * 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
