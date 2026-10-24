import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { formatNumber } from '@/lib/format';

/** Compteur animé façon React Bits : part de 0 à l'entrée dans l'écran puis suit `value` en douceur. */
export function CountUp({ value, decimals = 0, duration = 2, className }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(
    () =>
      spring.on('change', (latest) => {
        if (ref.current) ref.current.textContent = formatNumber(latest, decimals);
      }),
    [spring, decimals],
  );

  return (
    <span ref={ref} className={className}>
      {formatNumber(0, decimals)}
    </span>
  );
}
