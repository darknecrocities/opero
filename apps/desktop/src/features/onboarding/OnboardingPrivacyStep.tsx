import React from 'react';
import { getOnboardingPrivacyNotice } from '@opero/i18n';
import type { FirstClassLocale } from '@opero/shared-types';

interface OnboardingPrivacyStepProps {
  locale: FirstClassLocale;
  accepted: boolean;
  onToggle: (accepted: boolean) => void;
}

export const OnboardingPrivacyStep: React.FC<OnboardingPrivacyStepProps> = ({
  locale,
  accepted,
  onToggle,
}) => {
  const notice = getOnboardingPrivacyNotice(locale);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: '25px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
        }}
      >
        {notice.heading}
      </h2>

      <div
        role="textbox"
        aria-readonly="true"
        aria-multiline="true"
        aria-label={notice.textboxLabel}
        tabIndex={0}
        className="onboard-privacy-textbox"
      >
        {notice.sections.map((section, idx) => (
          <div key={section.id} style={{ marginTop: idx === 0 ? 0 : '14px' }}>
            <p
              style={{
                margin: '0 0 6px',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 700,
                color: '#0F172A',
                letterSpacing: '-0.015em',
              }}
            >
              {section.title}
            </p>
            <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
              {section.segments.map((seg, segIdx) =>
                seg.highlight ? (
                  <mark key={`${section.id}-${segIdx}`} className="onboard-privacy-highlight">
                    {seg.text}
                  </mark>
                ) : (
                  <React.Fragment key={`${section.id}-${segIdx}`}>{seg.text}</React.Fragment>
                ),
              )}
            </p>
          </div>
        ))}
      </div>

      <label
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          textAlign: 'left',
          fontSize: '13px',
          lineHeight: 1.45,
          color: 'var(--ink)',
          cursor: 'pointer',
          paddingTop: '2px',
        }}
      >
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onToggle(e.target.checked)}
          style={{
            marginTop: '3px',
            width: '16px',
            height: '16px',
            accentColor: '#0F172A',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <span>{notice.acknowledgeLabel}</span>
      </label>
    </div>
  );
};
