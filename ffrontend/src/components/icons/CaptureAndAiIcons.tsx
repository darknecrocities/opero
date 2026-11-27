import React from 'react';
import { motion } from 'framer-motion';

export interface IconMotionProps {
  reduced: boolean;
  morphed?: boolean;
  size?: 'md' | 'lg';
}

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 };

function dims(w: number, h: number, size: 'md' | 'lg' = 'lg') {
  const factor = size === 'lg' ? 1.48 : 1.18;
  return { width: Math.round(w * factor), height: Math.round(h * factor) };
}

export const CaptureMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(72, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 72 56" fill="none" aria-hidden="true">
      <motion.path
        d="M16 20V14C16 12.895 16.895 12 18 12H24"
        stroke={morphed ? '#247BFA' : '#CBD5E1'}
        strokeWidth="3"
        strokeLinecap="round"
        animate={reduced ? undefined : { x: morphed ? -4 : 0, y: morphed ? -3 : 0 }}
        transition={SPRING}
      />
      <motion.path
        d="M56 20V14C56 12.895 55.105 12 54 12H48"
        stroke={morphed ? '#247BFA' : '#CBD5E1'}
        strokeWidth="3"
        strokeLinecap="round"
        animate={reduced ? undefined : { x: morphed ? 4 : 0, y: morphed ? -3 : 0 }}
        transition={SPRING}
      />
      <motion.path
        d="M16 36V42C16 43.105 16.895 44 18 44H24"
        stroke={morphed ? '#247BFA' : '#CBD5E1'}
        strokeWidth="3"
        strokeLinecap="round"
        animate={reduced ? undefined : { x: morphed ? -4 : 0, y: morphed ? 3 : 0 }}
        transition={SPRING}
      />
      <motion.path
        d="M56 36V42C56 43.105 55.105 44 54 44H48"
        stroke={morphed ? '#247BFA' : '#CBD5E1'}
        strokeWidth="3"
        strokeLinecap="round"
        animate={reduced ? undefined : { x: morphed ? 4 : 0, y: morphed ? 3 : 0 }}
        transition={SPRING}
      />
      <motion.circle
        cx="36"
        cy="28"
        r="14"
        stroke="#247BFA"
        strokeOpacity="0.32"
        strokeWidth="2"
        animate={
          reduced
            ? undefined
            : morphed
              ? { scale: 1.24, opacity: 0.75 }
              : { scale: [0.88, 1.15, 0.88], opacity: [0.25, 0.6, 0.25] }
        }
        transition={morphed ? SPRING : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '36px 28px' }}
      />
      <motion.rect
        x="29"
        y="21"
        width="14"
        height="14"
        fill="#247BFA"
        animate={
          reduced
            ? undefined
            : { rx: morphed ? 3.5 : 7, scale: morphed ? 1.12 : 0.88, rotate: morphed ? 90 : 0 }
        }
        transition={SPRING}
        style={{ transformOrigin: '36px 28px' }}
      />
    </svg>
  );
};

export const OcrMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(84, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 84 56" fill="none" aria-hidden="true">
      <motion.rect
        x="14"
        y="10"
        width="56"
        height="36"
        rx="8"
        fill={morphed ? '#EAF3FF' : '#E5E9F0'}
        animate={reduced ? undefined : { scale: morphed ? 1.04 : 1, rotate: morphed ? -1.5 : 0 }}
        transition={SPRING}
        style={{ transformOrigin: '42px 28px' }}
      />
      <motion.rect
        x="22"
        y="18"
        width="24"
        height="4"
        rx="2"
        fill={morphed ? '#247BFA' : '#CBD5E1'}
        animate={reduced ? undefined : { scaleX: morphed ? 1.35 : 1 }}
        transition={SPRING}
        style={{ transformOrigin: '22px 20px' }}
      />
      <motion.rect
        x="22"
        y="26"
        width="38"
        height="4"
        rx="2"
        fill={morphed ? '#172334' : '#CBD5E1'}
        animate={reduced ? undefined : { scaleX: morphed ? 1.06 : 1 }}
        transition={SPRING}
        style={{ transformOrigin: '22px 28px' }}
      />
      <rect x="22" y="34" width="30" height="4" rx="2" fill="#CBD5E1" />
      <motion.rect
        x="10"
        y="14"
        width="64"
        height="2.8"
        rx="1.4"
        fill="#247BFA"
        animate={reduced ? undefined : morphed ? { y: 14, scaleX: 1.08 } : { y: [0, 26, 0] }}
        transition={morphed ? SPRING : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '42px 15px' }}
      />
    </svg>
  );
};

export const StudioMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(88, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 88 56" fill="none" aria-hidden="true">
      <rect x="10" y="10" width="68" height="36" rx="8" fill="#E5E9F0" />
      <motion.rect
        x="15"
        y="15"
        width="14"
        height="26"
        rx="4"
        fill="#CBD5E1"
        animate={reduced ? undefined : { scaleX: morphed ? 0.72 : 1 }}
        transition={SPRING}
        style={{ transformOrigin: '15px 28px' }}
      />
      <motion.rect
        x="33"
        y="15"
        width="26"
        height="26"
        rx="4"
        fill="#FFFFFF"
        stroke={morphed ? '#247BFA' : 'transparent'}
        strokeWidth="1.6"
        animate={reduced ? undefined : { x: morphed ? -4 : 0, scaleX: morphed ? 1.28 : 1 }}
        transition={SPRING}
        style={{ transformOrigin: '46px 28px' }}
      />
      <motion.rect
        x="63"
        y="15"
        width="10"
        height="26"
        rx="4"
        fill="#CBD5E1"
        animate={reduced ? undefined : { scaleX: morphed ? 0.72 : 1 }}
        transition={SPRING}
        style={{ transformOrigin: '73px 28px' }}
      />
      <motion.rect
        x="37"
        y="20"
        width="18"
        height="4"
        rx="2"
        fill="#247BFA"
        animate={reduced ? undefined : morphed ? { scaleX: 1.15 } : { scaleX: [0.68, 1, 0.68] }}
        transition={morphed ? SPRING : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '37px 22px' }}
      />
      <rect x="37" y="27" width="14" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="37" y="33" width="16" height="3" rx="1.5" fill="#CBD5E1" />
    </svg>
  );
};

export const AnnotationsMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(84, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 84 56" fill="none" aria-hidden="true">
      <rect x="14" y="12" width="56" height="32" rx="7" fill="#E5E9F0" />
      <motion.rect
        x="28"
        y="19"
        width="28"
        height="18"
        rx="5"
        stroke="#247BFA"
        strokeWidth="2.4"
        fill="#EAF3FF"
        animate={
          reduced
            ? undefined
            : morphed
              ? { scale: 1.12, rx: 7 }
              : { scale: [0.96, 1.04, 0.96] }
        }
        transition={morphed ? SPRING : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '42px 28px' }}
      />
      <motion.g
        animate={reduced ? undefined : { scale: morphed ? 1.18 : 1, x: morphed ? -2 : 0, y: morphed ? -2 : 0 }}
        transition={SPRING}
        style={{ transformOrigin: '28px 19px' }}
      >
        <circle cx="28" cy="19" r="6.5" fill="#247BFA" />
        <text x="28" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">
          1
        </text>
      </motion.g>
      <motion.path
        d="M58 14L65 21M65 21H59M65 21V15"
        stroke="#172334"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={reduced ? undefined : { opacity: morphed ? 1 : 0, scale: morphed ? 1 : 0.6 }}
        transition={SPRING}
        style={{ transformOrigin: '62px 18px' }}
      />
    </svg>
  );
};

export const TemplatesMotionIcon: React.FC<IconMotionProps> = ({ reduced, morphed = false, size = 'lg' }) => {
  const { width, height } = dims(80, 56, size);
  return (
    <svg width={width} height={height} viewBox="0 0 80 56" fill="none" aria-hidden="true">
      <motion.rect
        x="20"
        y="10"
        width="32"
        height="36"
        rx="6"
        fill="#DCE2EC"
        animate={
          reduced
            ? undefined
            : morphed
              ? { x: -10, rotate: -10 }
              : { x: [-2, -6, -2], rotate: [0, -4, 0] }
        }
        transition={morphed ? SPRING : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '36px 28px' }}
      />
      <motion.rect
        x="28"
        y="10"
        width="32"
        height="36"
        rx="6"
        fill={morphed ? '#EAF3FF' : '#E5E9F0'}
        stroke={morphed ? '#247BFA' : 'transparent'}
        strokeWidth="1.5"
        animate={reduced ? undefined : { x: morphed ? 5 : 0, rotate: morphed ? 4 : 0 }}
        transition={SPRING}
        style={{ transformOrigin: '44px 28px' }}
      />
      <motion.g animate={reduced ? undefined : { x: morphed ? 5 : 0, rotate: morphed ? 4 : 0 }} transition={SPRING} style={{ transformOrigin: '44px 28px' }}>
        <rect x="34" y="18" width="18" height="3.5" rx="1.75" fill="#247BFA" />
        <rect x="34" y="25" width="20" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="34" y="31" width="15" height="3" rx="1.5" fill="#CBD5E1" />
      </motion.g>
    </svg>
  );
};
