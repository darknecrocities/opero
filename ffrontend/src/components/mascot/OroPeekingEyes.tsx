import React, { useEffect, useId, useMemo, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { buildPeroColorVars } from '../../assets/mascot';
import { PeroBeak, PeroBrows, PeroDefs } from '../../assets/mascot/peroRigParts';

export interface OroPeekingEyesProps {
  size?: number;
  className?: string;
}

const MAX_PUPIL_X = 9.5;
const MAX_PUPIL_Y = 7.5;

export const OroPeekingEyes: React.FC<OroPeekingEyesProps> = ({
  size = 148,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const prefix = `oro-peek-${uid}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  const rawEyeX = useMotionValue(0);
  const rawEyeY = useMotionValue(0);
  const rawHeadRot = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 24, mass: 0.35 };
  const eyeX = useSpring(rawEyeX, springConfig);
  const eyeY = useSpring(rawEyeY, springConfig);
  const headRot = useSpring(rawHeadRot, { stiffness: 160, damping: 22 });

  const colorVars = useMemo(() => buildPeroColorVars('#247BFA', '#69BCFC'), []);

  useEffect(() => {
    if (reduced) return;

    const onPointerMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.58;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy) || 1;
      const scale = Math.min(1, dist / 240);
      const nx = (dx / dist) * scale;
      const ny = (dy / dist) * scale;

      rawEyeX.set(nx * MAX_PUPIL_X);
      rawEyeY.set(ny * MAX_PUPIL_Y);
      rawHeadRot.set(nx * 3.5);
    };

    const onPointerLeave = () => {
      rawEyeX.set(0);
      rawEyeY.set(0);
      rawHeadRot.set(0);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
    };
  }, [reduced, rawEyeX, rawEyeY, rawHeadRot]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`.trim()}
      style={{ width: size, height: Math.round(size * 0.88), ...colorVars }}
    >
      <motion.svg
        viewBox="116 26 286 252"
        width="100%"
        height="100%"
        style={{
          overflow: 'visible',
          rotate: reduced ? 0 : headRot,
          transformOrigin: '50% 85%',
        }}
      >
        <PeroDefs prefix={prefix} />

        <path
          d="M 134 218 C 128 158, 174 114, 258 114 C 344 114, 388 158, 382 222 C 378 280, 336 318, 258 318 C 180 318, 138 278, 134 218 Z"
          fill={`url(#${prefix}-navy)`}
          stroke="var(--pero-outline, #08102D)"
          strokeWidth="6.5"
          strokeLinejoin="round"
        />
        <path
          d="M 164 218 C 162 178, 188 154, 218 156 C 238 157, 252 172, 260 184 C 268 172, 286 154, 314 154 C 348 154, 370 182, 368 220 C 366 270, 326 308, 260 308 C 194 308, 166 270, 164 218 Z"
          fill="var(--pero-white, #FCFCFB)"
          stroke="var(--pero-outline, #08102D)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="209" cy="210" r="39" fill="var(--pero-white, #FCFCFB)" />
        <ellipse
          cx="186"
          cy="264"
          rx="15"
          ry="8"
          fill="var(--pero-blush, #FDC6BC)"
          opacity={0.88}
          transform="rotate(-6 186 264)"
        />
        <ellipse
          cx="336"
          cy="260"
          rx="15.5"
          ry="8"
          fill="var(--pero-blush, #FDC6BC)"
          opacity={0.88}
          transform="rotate(6 336 260)"
        />

        <PeroBrows mood="curious" />

        <motion.g style={{ x: reduced ? 0 : eyeX, y: reduced ? 0 : eyeY }}>
          <ellipse cx="212" cy="212" rx="17" ry="22" fill="#182038" />
          <circle cx="206" cy="204" r="6.5" fill="#FFFFFF" />
          <circle cx="218" cy="220" r="2.4" fill="#FFFFFF" opacity={0.78} />

          <ellipse cx="316" cy="212" rx="17" ry="22" fill="#182038" />
          <circle cx="310" cy="204" r="6.5" fill="#FFFFFF" />
          <circle cx="322" cy="220" r="2.4" fill="#FFFFFF" opacity={0.78} />
        </motion.g>

        <PeroBeak expr="smile" prefix={prefix} />

        <g>
          <path
            d="M 164 202 C 146 210, 136 232, 134 256"
            fill="none"
            stroke="#151E35"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <circle cx="209" cy="210" r="42" fill={`url(#${prefix}-lens)`} />
          <path
            d="M 184 185 C 194 176, 210 174, 222 178"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.78}
          />
          <circle cx="209" cy="210" r="43" fill="none" stroke="var(--pero-monocle-rim, #1B2338)" strokeWidth="8.5" />
          <circle cx="209" cy="210" r="46.5" fill="none" stroke="var(--pero-outline, #08102D)" strokeWidth="2" />
          <circle cx="209" cy="210" r="39.5" fill="none" stroke="#8592B0" strokeWidth="2" />
          <circle cx="164" cy="202" r="6" fill="#DCE4F0" stroke="var(--pero-outline, #08102D)" strokeWidth="3" />
          <circle cx="163" cy="200.5" r="2" fill="#FFFFFF" />
        </g>

        <g>
          <ellipse
            cx="236"
            cy="40"
            rx="16"
            ry="7.5"
            style={{ fill: 'var(--pero-cap-button, #2D8FED)' }}
            stroke="var(--pero-outline, #08102D)"
            strokeWidth="5"
          />
          <path
            d="M 140 166 C 134 100, 178 44, 240 42 C 296 40, 344 74, 354 128 C 288 118, 206 130, 140 166 Z"
            fill={`url(#${prefix}-cap)`}
            stroke="var(--pero-outline, #08102D)"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <g transform="translate(246, 84) rotate(-14)">
            <path
              d="M -11 -11 C -2 -17, 12 -13, 14 -2 C 16 9, 7 15, -3 13 C -13 11, -17 0, -11 -11 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="8" y1="21" x2="21" y2="16" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          </g>
          <path
            d="M 192 146 C 254 114, 346 112, 382 142 C 378 152, 366 154, 348 148 C 304 134, 246 136, 192 146 Z"
            fill="#1E356B"
            stroke="var(--pero-outline, #08102D)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 140 166 C 202 126, 302 102, 362 124 C 378 130, 385 138, 380 144 C 344 124, 256 126, 186 158 C 166 167, 150 172, 140 166 Z"
            style={{ fill: 'var(--pero-cap-main, #69BCFC)' }}
            stroke="var(--pero-outline, #08102D)"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
        </g>
      </motion.svg>
    </div>
  );
};
