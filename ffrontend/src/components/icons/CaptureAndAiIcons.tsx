import React from 'react';
import { motion } from 'framer-motion';

interface IconMotionProps {
  reduced: boolean;
}

export const CaptureMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden="true">
    <path d="M16 20V14C16 12.895 16.895 12 18 12H24" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    <path d="M56 20V14C56 12.895 55.105 12 54 12H48" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    <path d="M16 36V42C16 43.105 16.895 44 18 44H24" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    <path d="M56 36V42C56 43.105 55.105 44 54 44H48" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    <motion.circle
      cx="36"
      cy="28"
      r="13"
      stroke="#247BFA"
      strokeOpacity="0.3"
      strokeWidth="2"
      animate={reduced ? undefined : { scale: [0.85, 1.18, 0.85], opacity: [0.25, 0.65, 0.25] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '36px 28px' }}
    />
    <circle cx="36" cy="28" r="6" fill="#247BFA" />
  </svg>
);

export const OcrMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="84" height="56" viewBox="0 0 84 56" fill="none" aria-hidden="true">
    <rect x="14" y="10" width="56" height="36" rx="8" fill="#E5E9F0" />
    <rect x="22" y="18" width="24" height="4" rx="2" fill="#CBD5E1" />
    <rect x="22" y="26" width="38" height="4" rx="2" fill="#CBD5E1" />
    <rect x="22" y="34" width="30" height="4" rx="2" fill="#CBD5E1" />
    <motion.rect
      x="12"
      y="14"
      width="60"
      height="2.5"
      rx="1.25"
      fill="#247BFA"
      animate={reduced ? undefined : { y: [0, 26, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  </svg>
);

export const StudioMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="88" height="56" viewBox="0 0 88 56" fill="none" aria-hidden="true">
    <rect x="10" y="10" width="68" height="36" rx="8" fill="#E5E9F0" />
    <rect x="15" y="15" width="14" height="26" rx="4" fill="#CBD5E1" />
    <rect x="33" y="15" width="26" height="26" rx="4" fill="#FFFFFF" />
    <rect x="63" y="15" width="10" height="26" rx="4" fill="#CBD5E1" />
    <motion.rect
      x="37"
      y="20"
      width="18"
      height="4"
      rx="2"
      fill="#247BFA"
      animate={reduced ? undefined : { scaleX: [0.68, 1, 0.68] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '37px 22px' }}
    />
    <rect x="37" y="27" width="14" height="3" rx="1.5" fill="#CBD5E1" />
    <rect x="37" y="33" width="16" height="3" rx="1.5" fill="#CBD5E1" />
  </svg>
);

export const AnnotationsMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="84" height="56" viewBox="0 0 84 56" fill="none" aria-hidden="true">
    <rect x="14" y="12" width="56" height="32" rx="7" fill="#E5E9F0" />
    <motion.rect
      x="30"
      y="20"
      width="26"
      height="16"
      rx="4"
      stroke="#247BFA"
      strokeWidth="2.2"
      fill="#EAF3FF"
      animate={reduced ? undefined : { scale: [0.96, 1.04, 0.96] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '43px 28px' }}
    />
    <circle cx="30" cy="20" r="6" fill="#247BFA" />
    <text x="30" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
      1
    </text>
  </svg>
);

export const TemplatesMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="80" height="56" viewBox="0 0 80 56" fill="none" aria-hidden="true">
    <motion.rect
      x="20"
      y="10"
      width="32"
      height="36"
      rx="6"
      fill="#DCE2EC"
      animate={reduced ? undefined : { x: [-2, -6, -2], rotate: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '36px 28px' }}
    />
    <rect x="28" y="10" width="32" height="36" rx="6" fill="#E5E9F0" />
    <rect x="34" y="18" width="18" height="3.5" rx="1.75" fill="#247BFA" />
    <rect x="34" y="25" width="20" height="3" rx="1.5" fill="#CBD5E1" />
    <rect x="34" y="31" width="15" height="3" rx="1.5" fill="#CBD5E1" />
  </svg>
);
