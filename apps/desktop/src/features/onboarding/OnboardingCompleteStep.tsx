import React from 'react';
import type { FirstClassLocale } from '@opero/shared-types';
import { getCompletionCopy } from './onboardingSteps';

interface OnboardingCompleteStepProps {
  locale: FirstClassLocale;
  name: string;
  occupation: string;
  onReplayConfetti: () => void;
}

export const OnboardingCompleteStep: React.FC<OnboardingCompleteStepProps> = ({
  locale,
  name,
  occupation,
  onReplayConfetti,
}) => {
  const copy = getCompletionCopy(locale, name);
  const roleLabel = occupation.trim() || 'Operations';
  const localeLabel = locale === 'ja-JP' ? '日本語' : locale === 'fil-PH' ? 'Filipino' : 'English';

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span
        className="onboard-stagger-1"
        style={{
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#64748B',
        }}
      >
        {copy.eyebrow}
      </span>

      <h2 className="onboard-playful-heading onboard-stagger-2" style={{ fontSize: '34px' }}>
        {copy.title}
      </h2>

      <p
        className="onboard-stagger-3"
        style={{
          margin: 0,
          maxWidth: '400px',
          fontSize: '14.5px',
          lineHeight: 1.55,
          color: '#475569',
        }}
      >
        {copy.subtitle}
      </p>

      <p
        className="onboard-stagger-3"
        style={{
          margin: '4px 0 0',
          fontSize: '12.5px',
          color: '#94A3B8',
          letterSpacing: '0.01em',
        }}
      >
        {roleLabel} · {localeLabel} · Local SQLite
      </p>

      <button
        type="button"
        className="onboard-ghost-btn onboard-stagger-3"
        onClick={onReplayConfetti}
        style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}
      >
        {copy.replayConfetti}
      </button>
    </div>
  );
};
