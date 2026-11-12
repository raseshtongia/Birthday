import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './PartyPoppers.module.css';

const COLORS = ['#f43f5e', '#facc15', '#22c55e', '#38bdf8', '#c084fc', '#fb923c'];

function PartyPoppers() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(false), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  if (!active) return null;

  return (
    <div className={styles.burst} aria-hidden="true" data-celebration="party-poppers">
      {Array.from({ length: 48 }, (_, index) => {
        const side = index < 24 ? 1 : -1;
        const particle = index % 24;
        return (
          <span key={index} className={styles.particle} style={{
            left: side === 1 ? '8%' : '92%',
            '--color': COLORS[particle % COLORS.length],
            '--drift': `${side * (40 + (particle * 37) % 280)}px`,
            '--rise': `${-120 - (particle * 23) % 220}px`,
            '--spin': `${side * (180 + particle * 31)}deg`,
            '--delay': `${(particle % 6) * 18}ms`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}

export default PartyPoppers;
