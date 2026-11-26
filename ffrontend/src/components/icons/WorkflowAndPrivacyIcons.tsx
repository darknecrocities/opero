import React from 'react';
import { motion } from 'framer-motion';

interface IconMotionProps {
  reduced: boolean;
}

export const MultilingualMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="92" height="56" viewBox="0 0 92 56" fill="none" aria-hidden="true">
    <rect x="8" y="14" width="22" height="28" rx="6" fill="#E5E9F0" />
    <rect x="35" y="14" width="22" height="28" rx="6" fill="#E5E9F0" />
    <rect x="62" y="14" width="22" height="28" rx="6" fill="#E5E9F0" />
    <text x="19" y="32" textAnchor="middle" fill="#68778B" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
      En
    </text>
    <text x="46" y="32" textAnchor="middle" fill="#68778B" fontSize="11" fontWeight="700" fontFamily="Noto Sans JP, sans-serif">
      日
    </text>
    <text x="73" y="32" textAnchor="middle" fill="#68778B" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
      Fil
    </text>
    <motion.rect
      x="12"
      y="46"
      width="14"
      height="3"
      rx="1.5"
      fill="#247BFA"
      animate={reduced ? undefined : { x: [0, 27, 54, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  </svg>
);

export const VersionsMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="96" height="56" viewBox="0 0 96 56" fill="none" aria-hidden="true">
    <line x1="16" y1="28" x2="80" y2="28" stroke="#D7DEE8" strokeWidth="3" strokeLinecap="round" />
    <circle cx="24" cy="28" r="5" fill="#CBD5E1" />
    <circle cx="48" cy="28" r="5" fill="#CBD5E1" />
    <circle cx="72" cy="28" r="5" fill="#CBD5E1" />
    <motion.circle
      cx="24"
      cy="28"
      r="6"
      fill="#247BFA"
      animate={reduced ? undefined : { x: [0, 24, 48, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  </svg>
);

export const ExportMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="76" height="56" viewBox="0 0 76 56" fill="none" aria-hidden="true">
    <rect x="20" y="18" width="36" height="28" rx="7" fill="#E5E9F0" />
    <motion.g
      animate={reduced ? undefined : { y: [2, -5, 2] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M38 30V12" stroke="#247BFA" strokeWidth="3" strokeLinecap="round" />
      <path d="M31 18L38 11L45 18" stroke="#247BFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
  </svg>
);

export const MenuBarMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="112" height="56" viewBox="0 0 112 56" fill="none" aria-hidden="true">
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
      animate={reduced ? undefined : { scale: [1, 1.14, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '91px 38px' }}
    />
    <rect x="73" y="10" width="31" height="14" rx="4" fill="#EAF3FF" stroke="#247BFA" strokeWidth="1.5" />
    <rect x="79" y="15.5" width="19" height="3" rx="1.5" fill="#247BFA" />
  </svg>
);

export const LocalMotionIcon: React.FC<IconMotionProps> = ({ reduced }) => (
  <svg width="68" height="56" viewBox="0 0 68 56" fill="none" aria-hidden="true">
    <motion.path
      d="M25 25V19C25 14.03 29.03 10 34 10C38.97 10 43 14.03 43 19V25"
      stroke="#CBD5E1"
      strokeWidth="3.5"
      strokeLinecap="round"
      animate={reduced ? undefined : { y: [0, -2, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <rect x="19" y="23" width="30" height="24" rx="7" fill="#E5E9F0" />
    <circle cx="34" cy="33" r="3.5" fill="#247BFA" />
    <rect x="32.75" y="35.5" width="2.5" height="5.5" rx="1.25" fill="#247BFA" />
  </svg>
);
