import React, { useMemo } from 'react';

export interface ConfettiPiece {
  readonly id: number;
  readonly leftPct: number;
  readonly delayMs: number;
  readonly durationMs: number;
  readonly driftPx: number;
  readonly rotateDeg: number;
  readonly sizePx: number;
  readonly color: string;
  readonly shape: 'circle' | 'pill' | 'diamond';
}

const CONFETTI_COLORS: readonly string[] = [
  '#0F172A',
  '#334155',
  '#64748B',
  '#94A3B8',
  '#CBD5E1',
  '#69BCFC',
];

const SHAPES: readonly ConfettiPiece['shape'][] = ['pill', 'circle', 'diamond'];

function buildConfettiPieces(count: number): readonly ConfettiPiece[] {
  return Array.from({ length: count }, (_, idx) => {
    const seed = (idx * 37 + 13) % 97;
    const leftPct = 6 + ((idx * 19 + seed) % 88);
    const delayMs = (idx % 12) * 55;
    const durationMs = 1700 + ((idx * 173) % 950);
    const driftPx = ((idx % 2 === 0 ? 1 : -1) * (24 + (seed % 52)));
    const rotateDeg = 220 + ((idx * 79) % 420);
    const sizePx = 7 + (idx % 5);
    const color = CONFETTI_COLORS[idx % CONFETTI_COLORS.length] ?? '#0F172A';
    const shape = SHAPES[idx % SHAPES.length] ?? 'pill';
    return { id: idx, leftPct, delayMs, durationMs, driftPx, rotateDeg, sizePx, color, shape };
  });
}

interface OnboardingConfettiProps {
  burstKey: number;
}

export const OnboardingConfetti: React.FC<OnboardingConfettiProps> = ({ burstKey }) => {
  const pieces = useMemo(() => buildConfettiPieces(44), []);

  return (
    <div
      key={burstKey}
      data-testid="onboarding-confetti"
      aria-hidden="true"
      className="onboard-confetti-layer"
    >
      {pieces.map((p) => {
        const width = p.shape === 'pill' ? `${p.sizePx * 1.65}px` : `${p.sizePx}px`;
        const height = p.shape === 'pill' ? `${Math.max(5, p.sizePx * 0.65)}px` : `${p.sizePx}px`;
        const borderRadius = p.shape === 'circle' ? '999px' : p.shape === 'pill' ? '999px' : '2px';

        return (
          <span
            key={p.id}
            className="onboard-confetti-piece"
            style={
              {
                left: `${p.leftPct}%`,
                width,
                height,
                borderRadius,
                backgroundColor: p.color,
                animationDelay: `${p.delayMs}ms`,
                animationDuration: `${p.durationMs}ms`,
                '--confetti-drift': `${p.driftPx}px`,
                '--confetti-rot': `${p.rotateDeg}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
};
