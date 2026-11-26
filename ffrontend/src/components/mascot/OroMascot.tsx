import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PeroMascot, type PeroMotionId } from '../../assets/mascot';
import { playOroChildVoice, stopOroVoice } from '../../utils/oroVoice';

export interface OroMascotProps {
  motionId?: PeroMotionId;
  size?: number;
  interactive?: boolean;
  cueText?: string;
  whispers?: readonly string[];
  onInteract?: () => void;
  className?: string;
}

const INTERACT_CYCLE: readonly PeroMotionId[] = [
  'wave-hello',
  'thumbs-up',
  'monocle-inspect',
  'jump-cheer',
];

const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export const OroMascot: React.FC<OroMascotProps> = ({
  motionId = 'idle-breathe',
  size = 160,
  interactive = false,
  cueText,
  whispers,
  onInteract,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [tapCount, setTapCount] = useState(0);
  const [spokenCaption, setSpokenCaption] = useState<string | null>(null);

  const activeMotion: PeroMotionId =
    interactive && tapCount > 0
      ? INTERACT_CYCLE[(tapCount - 1) % INTERACT_CYCLE.length]
      : motionId;

  const displayedCue =
    spokenCaption ??
    (whispers && whispers.length > 0 ? whispers[0] : cueText);

  useEffect(() => () => stopOroVoice(), []);

  const handleTap = () => {
    if (!interactive) return;
    setTapCount((c) => c + 1);
    const clip = playOroChildVoice();
    setSpokenCaption(clip.caption);
    onInteract?.();
  };

  const inner = (
    <div className="relative inline-flex items-center justify-center">
      {interactive && tapCount > 0 && !prefersReducedMotion && (
        <span key={`sparks-${tapCount}`} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {SPARK_ANGLES.map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const dist = size * 0.52;
            return (
              <motion.span
                key={deg}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
                animate={{
                  opacity: 0,
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  scale: 1.15,
                }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-1/2 left-1/2 -ml-[3.5px] -mt-[3.5px] w-[7px] h-[7px] rounded-full"
                style={{
                  backgroundColor: i % 3 === 0 ? '#247BFA' : i % 2 === 0 ? '#69BCFC' : '#172334',
                }}
              />
            );
          })}
        </span>
      )}

      <motion.div
        key={tapCount}
        animate={
          prefersReducedMotion
            ? undefined
            : tapCount > 0
              ? { scale: [1, 1.1, 0.95, 1], y: [0, -10, 2, 0] }
              : { y: [0, -5, 0] }
        }
        transition={
          tapCount > 0
            ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
            : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
        }
        className="inline-flex flex-col items-center select-none"
      >
        <PeroMascot
          motion={activeMotion}
          size={size}
          capColor="#247BFA"
          jacketColor="#69BCFC"
          reducedMotion={Boolean(prefersReducedMotion)}
        />
      </motion.div>
    </div>
  );

  if (!interactive) {
    return (
      <div className={`inline-flex flex-col items-center ${className}`.trim()}>
        {inner}
        {displayedCue && (
          <span className="opero-hand-cue mt-1 text-base text-[#68778B]">{displayedCue}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`.trim()}>
      <button
        type="button"
        onClick={handleTap}
        aria-label="Interact with Pero, the OPERO mascot"
        className="inline-flex flex-col items-center bg-transparent border-0 p-1 cursor-pointer"
      >
        {inner}
      </button>
      {displayedCue && (
        <motion.span
          key={displayedCue}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="opero-hand-cue mt-1 text-[18px] leading-snug text-[#68778B] text-center max-w-[30ch] select-none"
        >
          {displayedCue}
        </motion.span>
      )}
    </div>
  );
};
