import { motion } from 'motion/react';

const OFFSETS = {
  up: { y: 40 },
  left: { x: -40 },
  right: { x: 40 },
};

/** Fait apparaître son contenu au défilement (Motion `whileInView`). */
export function Reveal({ from = 'up', delay = 0, className, children }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: 'blur(8px)', ...OFFSETS[from] }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
