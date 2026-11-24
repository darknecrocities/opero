import React, { useEffect, useState } from 'react';
import {
  PeroMascot,
  PeroStateMascot,
  PERO_OUTFIT_PRESETS,
  type OperoAppState,
  type PeroMotionId,
} from '../../../assets/images/mascot/pero-motions/app-code';

/**
 * Curated OPERO-aligned outfits excluding AI-slop violet/neon tones.
 */
export const OPERO_CURATED_OUTFITS = PERO_OUTFIT_PRESETS.filter(
  (p) => p.id !== 'violet-ai' && p.id !== 'coral-alert',
);

export type PeroPlacementMode = 'stage' | 'perch' | 'spotlight';

export interface PeroAmbientPresenceProps {
  state?: OperoAppState;
  motion?: PeroMotionId;
  placement?: PeroPlacementMode;
  size?: number;
  capColor?: string;
  jacketColor?: string;
  speed?: number;
  reducedMotion?: boolean;
  caption?: string;
  className?: string;
}

const DEFAULT_SIZES: Record<PeroPlacementMode, number> = {
  stage: 248,
  perch: 84,
  spotlight: 312,
};

/**
 * [UI-008] Frameless, natural spatial Pero companion (zero boxed card wrappers).
 * Stands organically on open #FFFFFF canvas space using his own soft vector contact shadow,
 * or perches lightly beside active capture/prompt surfaces.
 */
export const PeroAmbientPresence: React.FC<PeroAmbientPresenceProps> = ({
  state = 'ready',
  motion,
  placement = 'stage',
  size,
  capColor = '#69BCFC',
  jacketColor = '#69BCFC',
  speed = 1,
  reducedMotion,
  caption,
  className = '',
}) => {
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedSize = size ?? DEFAULT_SIZES[placement];
  const isReduced = reducedMotion ?? osReduced;

  return (
    <div
      data-pero-placement={placement}
      className={`pero-ambient pero-ambient-${placement} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {motion ? (
        <PeroMascot
          motion={motion}
          size={resolvedSize}
          capColor={capColor}
          jacketColor={jacketColor}
          speed={speed}
          reducedMotion={isReduced}
        />
      ) : (
        <PeroStateMascot
          state={state}
          size={resolvedSize}
          capColor={capColor}
          jacketColor={jacketColor}
          speed={speed}
          reducedMotion={isReduced}
        />
      )}
      {caption && (
        <span
          style={{
            marginTop: '4px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-muted, #526071)',
            letterSpacing: '-0.01em',
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
};
