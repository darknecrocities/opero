import React from 'react';

interface FloatingMotif {
  readonly id: string;
  readonly left: string;
  readonly top: string;
  readonly kind: 'ring' | 'plus' | 'diamond' | 'dot' | 'arc';
  readonly size: number;
  readonly duration: string;
  readonly delay: string;
  readonly opacity: number;
}

const MOTIFS: readonly FloatingMotif[] = [
  { id: 'm1', left: '10%', top: '18%', kind: 'ring', size: 22, duration: '11s', delay: '0s', opacity: 0.45 },
  { id: 'm2', left: '84%', top: '20%', kind: 'plus', size: 16, duration: '9.5s', delay: '-2s', opacity: 0.42 },
  { id: 'm3', left: '16%', top: '72%', kind: 'diamond', size: 14, duration: '12s', delay: '-4s', opacity: 0.4 },
  { id: 'm4', left: '86%', top: '70%', kind: 'ring', size: 28, duration: '13s', delay: '-1.5s', opacity: 0.36 },
  { id: 'm5', left: '24%', top: '34%', kind: 'dot', size: 9, duration: '8.5s', delay: '-3s', opacity: 0.5 },
  { id: 'm6', left: '75%', top: '42%', kind: 'diamond', size: 12, duration: '10.5s', delay: '-5s', opacity: 0.42 },
  { id: 'm7', left: '12%', top: '48%', kind: 'arc', size: 36, duration: '15s', delay: '-2.5s', opacity: 0.35 },
  { id: 'm8', left: '82%', top: '52%', kind: 'plus', size: 14, duration: '9s', delay: '-4.5s', opacity: 0.38 },
  { id: 'm9', left: '28%', top: '82%', kind: 'dot', size: 8, duration: '10s', delay: '-1s', opacity: 0.42 },
  { id: 'm10', left: '72%', top: '82%', kind: 'arc', size: 32, duration: '14s', delay: '-6s', opacity: 0.34 },
];

interface OnboardingAmbientBgProps {
  step: number;
  boopTick: number;
}

export const OnboardingAmbientBg: React.FC<OnboardingAmbientBgProps> = ({ step, boopTick }) => {
  return (
    <div aria-hidden="true" className="onboard-ambient-bg" data-testid="onboarding-ambient-bg">
      {/* Soft warm-gray drifting organic depth orbs */}
      <span className="onboard-bg-orb onboard-bg-orb-1" />
      <span className="onboard-bg-orb onboard-bg-orb-2" />
      <span className="onboard-bg-orb onboard-bg-orb-3" />

      {/* Subtle architectural dot-grid shimmer near edges */}
      <span className="onboard-bg-grid" />

      {/* Gentle pulsing halo behind Pero that ripples on every step or tap */}
      <span key={`halo-${step}-${boopTick}`} className="onboard-halo-pulse" />

      {/* Playful drifting geometric line motifs around the perimeter */}
      {MOTIFS.map((m) => (
        <span
          key={m.id}
          className="onboard-bg-motif"
          style={{
            left: m.left,
            top: m.top,
            opacity: m.opacity,
            animationDuration: m.duration,
            animationDelay: m.delay,
          }}
        >
          {m.kind === 'ring' && (
            <svg width={m.size} height={m.size} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#B8B3AA" strokeWidth="1.75" />
            </svg>
          )}
          {m.kind === 'plus' && (
            <svg width={m.size} height={m.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 4V20M4 12H20" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {m.kind === 'diamond' && (
            <svg width={m.size} height={m.size} viewBox="0 0 24 24" fill="none">
              <rect
                x="12"
                y="3"
                width="12.5"
                height="12.5"
                rx="2.5"
                transform="rotate(45 12 3)"
                stroke="#B8B3AA"
                strokeWidth="1.75"
              />
            </svg>
          )}
          {m.kind === 'dot' && (
            <span
              style={{
                display: 'block',
                width: `${m.size}px`,
                height: `${m.size}px`,
                borderRadius: '999px',
                backgroundColor: '#C7C3BC',
              }}
            />
          )}
          {m.kind === 'arc' && (
            <svg width={m.size} height={m.size} viewBox="0 0 36 36" fill="none">
              <path
                d="M6 26C9 14 20 8 30 10"
                stroke="#C7C3BC"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeDasharray="3 5"
              />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
};
