import { useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Texte géant en contour qui s'illumine en dégradé néon autour du curseur (inspiré d'Aceternity UI).
 * Sans souris (mobile), le halo balaie le texte tout seul.
 */
export function TextHoverEffect({ text, className }) {
  const ref = useRef(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  // useId renvoie « :r0: » : les deux-points cassent les références url(#…) en SVG.
  const id = useId().replace(/:/g, '');

  function handleMove(event) {
    const rect = ref.current.getBoundingClientRect();
    setCursor({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  const textProps = {
    x: '50%',
    y: '54%',
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    textLength: 560,
    lengthAdjust: 'spacingAndGlyphs',
    className: 'font-sans font-black',
    style: { fontSize: 96 },
    // Épaisseur de trait constante à l'écran : sinon le contour devient invisible sur mobile.
    vectorEffect: 'non-scaling-stroke',
  };

  const knockout = { paintOrder: 'stroke', style: { ...textProps.style, fill: 'hsl(var(--background))' } };

  return (
    <svg
      ref={ref}
      viewBox="0 0 600 130"
      aria-hidden
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMove}
    >
      <defs>
        <linearGradient id={`${id}-neon`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="600" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <motion.radialGradient
          id={`${id}-spot`}
          gradientUnits="userSpaceOnUse"
          r="22%"
          initial={{ cx: '50%', cy: '50%' }}
          animate={
            hovered || reduceMotion
              ? { cx: `${cursor.x}%`, cy: `${cursor.y}%` }
              : { cx: ['8%', '92%', '8%'], cy: ['40%', '60%', '40%'] }
          }
          transition={hovered ? { duration: 0.25, ease: 'easeOut' } : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id={`${id}-mask`}>
          <rect x="0" y="0" width="600" height="130" fill={`url(#${id}-spot)`} />
        </mask>
      </defs>

      {/*
        Les polices variables gardent des contours qui se chevauchent : dessiner le trait d'abord
        (paint-order: stroke) puis remplir avec la couleur du fond masque ces traits intérieurs.
      */}
      <text {...textProps} {...knockout} stroke="rgba(255,255,255,0.12)" strokeWidth="2">
        {text}
      </text>

      {/* Contour qui se dessine à l'apparition. */}
      <motion.text
        {...textProps}
        {...knockout}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="2"
        initial={{ strokeDashoffset: 1200, strokeDasharray: 1200 }}
        whileInView={{ strokeDashoffset: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 3.5, ease: 'easeInOut' }}
      >
        {text}
      </motion.text>

      {/* Couche néon, révélée seulement autour du curseur. */}
      <g mask={`url(#${id}-mask)`} style={{ filter: 'drop-shadow(0 0 6px rgba(232, 121, 249, 0.55))' }}>
        <text {...textProps} {...knockout} stroke={`url(#${id}-neon)`} strokeWidth="3">
          {text}
        </text>
        <text {...textProps} fill={`url(#${id}-neon)`} fillOpacity="0.16">
          {text}
        </text>
      </g>
    </svg>
  );
}
