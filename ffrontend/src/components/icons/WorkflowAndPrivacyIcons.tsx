import React from 'react';
import { motion } from 'framer-motion';
import type { IconMotionProps } from './CaptureAndAiIcons';

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 };

function dims(w: number, h: number, size: 'md' | 'lg' = 'lg') {
  const factor = size === 'lg' ? 1.48 : 1.18;
  return { width: Math.round(w * factor), height: Math.round(h * factor) };
}

export const MultilingualMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(92, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 92 56" fill="none" aria-hidden="true">
      <motion.g animate={reduced ? undefined : { y: morphed ? -4 : 0 }} transition={SPRING}>
        <rect x="8" y="14" width="22" height="28" rx="6" fill={morphed ? '#EAF3FF' : '#E5E9F0'} />
        <text x="19" y="32" textAnchor="middle" fill={morphed ? '#247BFA' : '#68778B'} fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
          En
        </text>
      </motion.g>
      <motion.g animate={reduced ? undefined : { y: morphed ? -7 : 0 }} transition={{ ...SPRING, delay: 0.04 }}>
        <rect x="35" y="14" width="22" height="28" rx="6" fill={morphed ? '#172334' : '#E5E9F0'} />
        <text x="46" y="32" textAnchor="middle" fill={morphed ? '#FFFFFF' : '#68778B'} fontSize="11" fontWeight="700" fontFamily="Noto Sans JP, sans-serif">
          日
        </text>
      </motion.g>
      <motion.g animate={reduced ? undefined : { y: morphed ? -3 : 0 }} transition={{ ...SPRING, delay: 0.08 }}>
        <rect x="62" y="14" width="22" height="28" rx="6" fill={morphed ? '#EAF3FF' : '#E5E9F0'} />
        <text x="73" y="32" textAnchor="middle" fill={morphed ? '#247BFA' : '#68778B'} fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
          Fil
        </text>
      </motion.g>
      <motion.rect
        x="12"
        y="46"
        width="14"
        height="3.2"
        rx="1.6"
        fill="#247BFA"
        animate={reduced ? undefined : morphed ? { x: 27, scaleX: 1.7 } : { x: [0, 27, 54, 0] }}
        transition={morphed ? SPRING : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '19px 47.5px' }}
      />
    </svg>
  );
};

export const VersionsMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(96, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 96 56" fill="none" aria-hidden="true">
      <line x1="16" y1="28" x2="80" y2="28" stroke={morphed ? '#247BFA' : '#D7DEE8'} strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="28" r="5" fill="#CBD5E1" />
      <circle cx="48" cy="28" r="5" fill="#CBD5E1" />
      <circle cx="72" cy="28" r="5" fill="#CBD5E1" />
      <motion.circle
        cx="24"
        cy="28"
        r="7"
        fill="#247BFA"
        animate={reduced ? undefined : morphed ? { x: 48, scale: 1.25 } : { x: [0, 24, 48, 0] }}
        transition={morphed ? SPRING : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '24px 28px' }}
      />
      <motion.circle
        cx="72"
        cy="28"
        r="12"
        stroke="#247BFA"
        strokeWidth="2"
        strokeOpacity="0.4"
        animate={reduced ? undefined : { scale: morphed ? 1.1 : 0.4, opacity: morphed ? 0.8 : 0 }}
        transition={SPRING}
        style={{ transformOrigin: '72px 28px' }}
      />
    </svg>
  );
};

export const ExportMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(76, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 76 56" fill="none" aria-hidden="true">
      <motion.rect
        x="20"
        y="19"
        width="36"
        height="27"
        rx="7"
        fill={morphed ? '#EAF3FF' : '#E5E9F0'}
        stroke={morphed ? '#247BFA' : 'transparent'}
        strokeWidth="1.6"
        animate={reduced ? undefined : { scaleX: morphed ? 1.1 : 1, y: morphed ? 2 : 0 }}
        transition={SPRING}
        style={{ transformOrigin: '38px 32px' }}
      />
      <motion.g
        animate={reduced ? undefined : morphed ? { y: -7, scale: 1.12 } : { y: [2, -5, 2] }}
        transition={morphed ? SPRING : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '38px 20px' }}
      >
        <path d="M38 30V11" stroke="#247BFA" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M30.5 18L38 10.5L45.5 18" stroke="#247BFA" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </svg>
  );
};

export const MenuBarMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(112, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 112 56" fill="none" aria-hidden="true">
      <rect x="8" y="28" width="96" height="20" rx="6" fill="#E5E9F0" />
      <rect x="16" y="34" width="8" height="8" rx="1.5" fill="#CBD5E1" />
      <rect x="28" y="36" width="14" height="4" rx="2" fill="#CBD5E1" />
      <circle cx="76" cy="38" r="2" fill="#CBD5E1" />
      <motion.rect
        x="85"
        y="32"
        width="12"
        height="12"
        rx="3"
        fill="#247BFA"
        animate={reduced ? undefined : morphed ? { scale: 1.2, rx: 6 } : { scale: [1, 1.14, 1] }}
        transition={morphed ? SPRING : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '91px 38px' }}
      />
      <motion.g
        animate={reduced ? undefined : { y: morphed ? -3 : 0, scale: morphed ? 1.12 : 1 }}
        transition={SPRING}
        style={{ transformOrigin: '88px 17px' }}
      >
        <rect x="70" y="9" width="36" height="15" rx="5" fill="#EAF3FF" stroke="#247BFA" strokeWidth="1.6" />
        <rect x="77" y="15" width="22" height="3" rx="1.5" fill="#247BFA" />
      </motion.g>
    </svg>
  );
};

export const LocalMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(68, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 68 56" fill="none" aria-hidden="true">
      <motion.circle
        cx="34"
        cy="30"
        r="22"
        fill="#EAF3FF"
        animate={reduced ? undefined : { scale: morphed ? 1.05 : 0.65, opacity: morphed ? 0.9 : 0 }}
        transition={SPRING}
        style={{ transformOrigin: '34px 30px' }}
      />
      <motion.path
        d="M25 25V19C25 14.03 29.03 10 34 10C38.97 10 43 14.03 43 19V25"
        stroke={morphed ? '#247BFA' : '#CBD5E1'}
        strokeWidth="3.5"
        strokeLinecap="round"
        animate={reduced ? undefined : morphed ? { y: 2 } : { y: [0, -2, 0] }}
        transition={morphed ? SPRING : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.rect
        x="19"
        y="23"
        width="30"
        height="24"
        rx="7"
        fill={morphed ? '#172334' : '#E5E9F0'}
        animate={reduced ? undefined : { scale: morphed ? 1.06 : 1 }}
        transition={SPRING}
        style={{ transformOrigin: '34px 35px' }}
      />
      <circle cx="34" cy="33" r="3.5" fill={morphed ? '#69BCFC' : '#247BFA'} />
      <rect x="32.75" y="35.5" width="2.5" height="5.5" rx="1.25" fill={morphed ? '#69BCFC' : '#247BFA'} />
    </svg>
  );
};
