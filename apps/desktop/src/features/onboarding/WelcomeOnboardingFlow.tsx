import React, { useState } from 'react';
import { getUiDictionary, PERSONALITY_OPTIONS } from '@opero/i18n';
import { playJiggSfx } from '@opero/jiggicons';
import { PeroStateMascot, type OperoAppState } from '@opero/mascot';
import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';

const TOTAL_STEPS = 4;

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
  const progressPct = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

  const goNext = () => {
    playJiggSfx('step', soundEnabled);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OPERO Welcome Onboarding"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F9FF 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px',
      }}
    >
      <div
        className="glass-regular opero-view-enter"
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: '28px',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '22px',
          textAlign: 'center',
        }}
      >
        <div className="pero-float">
          <PeroStateMascot
            state={STEP_PERO_STATE[step] ?? 'ready'}
            size={step === 0 ? 220 : 148}
            capColor={userProfile.peroCapColor}
            jacketColor={userProfile.peroJacketColor}
          />
        </div>

        {step === 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                className="opero-fade-bounce"
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: '48px',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: 'var(--ink)',
                }}
              >
                Opero
              </h1>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--ink-muted)' }}>
                {dict.welcomeSubtitle}
              </p>
            </div>
            <button
              type="button"
              className="opero-btn primary"
              onClick={goNext}
              style={{ minWidth: '180px', minHeight: '46px', borderRadius: '14px', fontSize: '15px' }}
            >
              {dict.welcomeGetStarted}
            </button>
          </>
        ) : (
          <>
            <div
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-label="Onboarding setup progress"
              className="blue-ball-track"
            >
              <div className="blue-ball-fill" style={{ width: `${progressPct}%` }} />
              <div className="blue-ball-dot" style={{ left: `${progressPct}%` }} />
            </div>

            {step === 1 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '22px' }}>
                  {dict.onboardingNameTitle}
                </h2>
                <input
                  type="text"
                  aria-label="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dict.onboardingNamePlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-strong)',
                    fontSize: '15px',
                    background: '#FFFFFF',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            )}

            {step === 2 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '22px' }}>
                  {dict.onboardingOccupationTitle}
                </h2>
                <input
                  type="text"
                  aria-label="Your occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder={dict.onboardingOccupationPlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-strong)',
                    fontSize: '15px',
                    background: '#FFFFFF',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            )}

            {step === 3 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '22px' }}>
                  {dict.onboardingPersonalityTitle}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {PERSONALITY_OPTIONS.map((opt) => {
                    const active = personality === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className="opero-card"
                        onClick={() => {
                          playJiggSfx('click', soundEnabled);
                          setPersonality(opt.id);
                        }}
                        style={{
                          textAlign: 'start',
                          padding: '12px 14px',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          background: active ? 'var(--brand-sky-soft)' : '#FFFFFF',
                          border: active ? '2px solid var(--brand-sky)' : '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                          {opt.label[locale]}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '3px' }}>
                          {opt.hint[locale]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '22px' }}>
                  {dict.onboardingLanguageTitle}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                  {(
                    [
                      { id: 'en-US', label: 'English', sub: 'en-US' },
                      { id: 'ja-JP', label: '日本語', sub: 'ja-JP' },
                      { id: 'fil-PH', label: 'Filipino', sub: 'fil-PH' },
                    ] as const
                  ).map((item) => {
                    const active = locale === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="opero-card"
                        onClick={() => handleLocalePick(item.id)}
                        style={{
                          padding: '14px 10px',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          background: active ? 'var(--brand-sky-soft)' : '#FFFFFF',
                          border: active ? '2px solid var(--brand-sky)' : '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>{item.label}</div>
                        <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '3px' }}>
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <button type="button" className="opero-btn" onClick={goBack}>
                {dict.onboardingBack}
              </button>
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  className="opero-btn primary"
                  onClick={goNext}
                  disabled={step === 1 && !name.trim()}
                >
                  {dict.onboardingContinue}
                </button>
              ) : (
                <button
                  type="button"
                  className="opero-btn primary"
                  onClick={() => void handleFinish()}
                  disabled={saving}
                >
                  {dict.onboardingFinish}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
