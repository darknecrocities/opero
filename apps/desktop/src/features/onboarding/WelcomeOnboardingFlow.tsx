import React, { useState } from 'react';
import { getUiDictionary, PERSONALITY_OPTIONS } from '@opero/i18n';
import { playJiggSfx } from '@opero/jiggicons';
import { PeroStateMascot, type OperoAppState } from '@opero/mascot';
import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';

const TOTAL_SCREENS = 5;
const WORDMARK_LETTERS = ['O', 'p', 'e', 'r', 'o'] as const;

const BALL_COLORS: readonly string[] = [
  '#69BCFC',
  '#38A3F1',
  '#0F172A',
  '#69BCFC',
  '#16865B',
];

const STEP_PERO_STATE: Record<number, OperoAppState> = {
  0: 'ready',
  1: 'capturing',
  2: 'processing',
  3: 'verified-draft',
  4: 'exported',
};

export const WelcomeOnboardingFlow: React.FC = () => {
  const { userProfile, soundEnabled, saveOnboardingProfile, setUiLocale } = useOperoStore();
  const [step, setStep] = useState<number>(0);
  const [name, setName] = useState<string>(userProfile.name);
  const [occupation, setOccupation] = useState<string>(userProfile.occupation);
  const [personality, setPersonality] = useState<OperoPersonality>(userProfile.personality);
  const [locale, setLocale] = useState<FirstClassLocale>(userProfile.defaultLocale);
  const [saving, setSaving] = useState<boolean>(false);

  const dict = getUiDictionary(locale);

  const goNext = () => {
    if (step === 1 && !name.trim()) return;
    playJiggSfx('step', soundEnabled);
    setStep((s) => Math.min(TOTAL_SCREENS - 1, s + 1));
  };

  const goBack = () => {
    playJiggSfx('click', soundEnabled);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleLocalePick = (nextLocale: FirstClassLocale) => {
    playJiggSfx('click', soundEnabled);
    setLocale(nextLocale);
    setUiLocale(nextLocale);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveOnboardingProfile({
        name: name.trim() || 'MMI Operator',
        occupation: occupation.trim() || 'Operations',
        personality,
        defaultLocale: locale,
        soundEnabled,
        onboardingCompleted: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OPERO Welcome Onboarding"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'radial-gradient(circle at 50% 24%, #F4F9FF 0%, #FFFFFF 58%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}
    >
      <div
        key={step}
        className="opero-view-enter"
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '26px',
          textAlign: 'center',
        }}
      >
        <div className="pero-float">
          <PeroStateMascot
            state={STEP_PERO_STATE[step] ?? 'ready'}
            size={step === 0 ? 210 : 144}
            capColor={userProfile.peroCapColor}
            jacketColor={userProfile.peroJacketColor}
          />
        </div>

        <div
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_SCREENS}
          aria-label="Onboarding setup progress"
          className="onboard-balls"
        >
          {BALL_COLORS.map((color, idx) => {
            const isActive = idx === step;
            const isDone = idx < step;
            return (
              <span
                key={isActive ? `ball-${idx}-step-${step}` : `ball-${idx}`}
                className={`onboard-ball ${isActive ? 'active' : ''}`}
                style={{
                  backgroundColor: isActive || isDone ? color : '#E2EAF2',
                  boxShadow: isActive ? `0 6px 16px ${color}55` : 'none',
                  opacity: isDone ? 0.65 : 1,
                }}
              />
            );
          })}
        </div>

        {step === 0 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <h1
                aria-label="Opero"
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: '64px',
                  fontWeight: 800,
                  letterSpacing: '-0.055em',
                  lineHeight: 1,
                  color: '#0F172A',
                }}
              >
                {WORDMARK_LETTERS.map((ch, idx) => (
                  <span
                    key={ch + idx}
                    aria-hidden="true"
                    className="opero-letter"
                    style={{ animationDelay: `${idx * 55}ms` }}
                  >
                    {ch}
                  </span>
                ))}
                <span
                  aria-hidden="true"
                  className="opero-letter"
                  style={{ color: '#69BCFC', animationDelay: '300ms' }}
                >
                  .
                </span>
              </h1>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--ink-muted)', letterSpacing: '-0.01em' }}>
                {dict.welcomeSubtitle}
              </p>
            </div>

            <button
              type="button"
              className="opero-btn primary"
              onClick={goNext}
              style={{
                minWidth: '176px',
                minHeight: '46px',
                borderRadius: '999px',
                fontSize: '15px',
                marginTop: '6px',
              }}
            >
              {dict.welcomeGetStarted}
            </button>
          </>
        )}

        {step === 1 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {dict.onboardingNameTitle}
            </h2>
            <input
              type="text"
              aria-label="Your name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={dict.onboardingNamePlaceholder}
              className="onboard-hairline-input"
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {dict.onboardingOccupationTitle}
            </h2>
            <input
              type="text"
              aria-label="Your occupation"
              autoFocus
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={dict.onboardingOccupationPlaceholder}
              className="onboard-hairline-input"
            />
          </div>
        )}

        {step === 3 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {dict.onboardingPersonalityTitle}
            </h2>
            <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {PERSONALITY_OPTIONS.map((opt) => {
                const active = personality === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`onboard-choice ${active ? 'active' : ''}`}
                    onClick={() => {
                      playJiggSfx('click', soundEnabled);
                      setPersonality(opt.id);
                    }}
                  >
                    <span>
                      <span style={{ fontSize: '15px', fontWeight: active ? 700 : 500, display: 'block' }}>
                        {opt.label[locale]}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{opt.hint[locale]}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        backgroundColor: active ? '#0F172A' : 'transparent',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {dict.onboardingLanguageTitle}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'en-US', label: 'English' },
                  { id: 'ja-JP', label: '日本語' },
                  { id: 'fil-PH', label: 'Filipino' },
                ] as const
              ).map((item) => {
                const active = locale === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`onboard-choice ${active ? 'active' : ''}`}
                    onClick={() => handleLocalePick(item.id)}
                    style={{ width: 'auto', padding: '10px 22px', fontSize: '16px', fontWeight: active ? 700 : 500 }}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step > 0 && (
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '10px',
            }}
          >
            <button type="button" className="onboard-ghost-btn" onClick={goBack}>
              {dict.onboardingBack}
            </button>
            {step < TOTAL_SCREENS - 1 ? (
              <button
                type="button"
                className="opero-btn primary"
                onClick={goNext}
                disabled={step === 1 && !name.trim()}
                style={{ borderRadius: '999px', padding: '8px 24px', minHeight: '42px' }}
              >
                {dict.onboardingContinue}
              </button>
            ) : (
              <button
                type="button"
                className="opero-btn primary"
                onClick={() => void handleFinish()}
                disabled={saving}
                style={{ borderRadius: '999px', padding: '8px 24px', minHeight: '42px' }}
              >
                {dict.onboardingFinish}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
