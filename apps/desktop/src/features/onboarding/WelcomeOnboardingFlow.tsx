import React, { useMemo, useRef, useState } from 'react';
import { getUiDictionary, PERSONALITY_OPTIONS } from '@opero/i18n';
import { playJiggSfx } from '@opero/jiggicons';
import { PeroMascot, type PeroMotionId } from '@opero/mascot';
import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';
import { OnboardingCompleteStep } from './OnboardingCompleteStep';
import { OnboardingConfetti } from './OnboardingConfetti';
import { OnboardingPrivacyStep } from './OnboardingPrivacyStep';
import {
  getOnboardingStepSpec,
  ONBOARDING_STEP_SPECS,
  TONE_TO_PERO_MOTION,
  TOTAL_SCREENS,
} from './onboardingSteps';

const WORDMARK_LETTERS = ['O', 'p', 'e', 'r', 'o'] as const;

export const WelcomeOnboardingFlow: React.FC = () => {
  const { userProfile, soundEnabled, saveOnboardingProfile, setUiLocale } = useOperoStore();
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [name, setName] = useState<string>(userProfile.name);
  const [occupation, setOccupation] = useState<string>(userProfile.occupation);
  const [personality, setPersonality] = useState<OperoPersonality>(userProfile.personality);
  const [locale, setLocale] = useState<FirstClassLocale>(userProfile.defaultLocale);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [boopTick, setBoopTick] = useState<number>(0);
  const [confettiBurst, setConfettiBurst] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const swipeStartX = useRef<number | null>(null);

  const dict = getUiDictionary(locale);
  const spec = getOnboardingStepSpec(step);

  const activeMotion: PeroMotionId = useMemo(() => {
    if (step === 1 && name.trim().length > 0) return 'thumbs-up';
    if (step === 3) return TONE_TO_PERO_MOTION[personality] ?? 'thinking-processing';
    if (step === 5 && privacyAccepted) return 'thumbs-up';
    if (step === 6) return boopTick % 2 === 1 ? 'verified-celebrate' : 'jump-cheer';
    return spec.defaultMotion;
  }, [step, name, personality, privacyAccepted, boopTick, spec.defaultMotion]);

  const activeWhisper = useMemo(() => {
    if (step === 1 && name.trim().length > 0) {
      if (locale === 'ja-JP') return `こんにちは、${name.trim()}さん！`;
      if (locale === 'fil-PH') return `Kumusta, ${name.trim()}!`;
      return `Nice to meet you, ${name.trim()}!`;
    }
    if (step === 5 && privacyAccepted) {
      if (locale === 'ja-JP') return '同意ありがとうございます！';
      if (locale === 'fil-PH') return 'Salamat! Ligtas at lokal tayo.';
      return 'All set — safe and local!';
    }
    return spec.whisper[locale];
  }, [step, name, privacyAccepted, locale, spec.whisper]);

  const canAdvanceFromStep = (current: number): boolean => {
    if (current === 1 && !name.trim()) return false;
    if (current === 5 && !privacyAccepted) return false;
    return current < TOTAL_SCREENS - 1;
  };

  const goNext = () => {
    if (!canAdvanceFromStep(step)) return;
    const nextStep = Math.min(TOTAL_SCREENS - 1, step + 1);
    playJiggSfx(nextStep === TOTAL_SCREENS - 1 ? 'success' : 'step', soundEnabled);
    if (nextStep === TOTAL_SCREENS - 1) {
      setConfettiBurst((b) => b + 1);
    }
    setDirection('next');
    setStep(nextStep);
  };

  const goBack = () => {
    if (step <= 0) return;
    playJiggSfx('click', soundEnabled);
    setDirection('prev');
    setStep((s) => Math.max(0, s - 1));
  };

  const handlePeroTap = () => {
    playJiggSfx(step === TOTAL_SCREENS - 1 ? 'success' : 'click', soundEnabled);
    setBoopTick((t) => t + 1);
    if (step === TOTAL_SCREENS - 1) {
      setConfettiBurst((b) => b + 1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'LABEL') return;
    swipeStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartX.current === null) return;
    const deltaX = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (deltaX <= -56) goNext();
    else if (deltaX >= 56) goBack();
  };

  const handleLocalePick = (nextLocale: FirstClassLocale) => {
    playJiggSfx('click', soundEnabled);
    setLocale(nextLocale);
    setUiLocale(nextLocale);
    setBoopTick((t) => t + 1);
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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'radial-gradient(circle at 50% 24%, #F8FAFC 0%, #FFFFFF 60%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        overflow: 'hidden',
      }}
    >
      {step === 6 && <OnboardingConfetti burstKey={confettiBurst} />}

      <div
        key={step}
        className={direction === 'next' ? 'onboard-swipe-next' : 'onboard-swipe-prev'}
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '22px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Frameless Clucky-inspired playful whisper + interactive tap-to-boop Pero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span
            key={`${step}-${activeWhisper}-${boopTick}`}
            className="onboard-whisper"
            style={{
              fontSize: '12.5px',
              fontWeight: 500,
              color: '#64748B',
              letterSpacing: '-0.01em',
              minHeight: '18px',
            }}
          >
            {activeWhisper}
          </span>

          <button
            type="button"
            aria-label="Interact with Pero"
            onClick={handlePeroTap}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="pero-float" style={{ display: 'inline-flex' }}>
              <span key={boopTick} className={boopTick > 0 ? 'pero-boop-spring' : undefined}>
                <PeroMascot
                  motion={activeMotion}
                  size={spec.mascotSize}
                  capColor={userProfile.peroCapColor}
                  jacketColor={userProfile.peroJacketColor}
                />
              </span>
            </span>
          </button>
        </div>

        {/* Monochrome White & Gray Pill-Morphing Progress Track */}
        <div
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_SCREENS}
          aria-label="Onboarding setup progress"
          className="onboard-balls"
        >
          {ONBOARDING_STEP_SPECS.map((item) => {
            const isActive = item.index === step;
            const isDone = item.index < step;
            return (
              <span
                key={isActive ? `dot-${item.index}-step-${step}` : `dot-${item.index}`}
                className={`onboard-ball ${isActive ? 'active' : ''}`}
                style={{
                  width: isActive ? '26px' : '9px',
                  height: '9px',
                  backgroundColor: isActive ? '#0F172A' : isDone ? '#94A3B8' : '#E2E8F0',
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
                  style={{ color: '#94A3B8', animationDelay: '300ms' }}
                >
                  .
                </span>
              </h1>
              <p
                className="onboard-stagger-2"
                style={{ margin: 0, fontSize: '15px', color: '#475569', letterSpacing: '-0.01em' }}
              >
                {dict.welcomeSubtitle}
              </p>
            </div>

            <button
              type="button"
              className="opero-btn primary onboard-stagger-3"
              onClick={goNext}
              style={{
                minWidth: '184px',
                minHeight: '46px',
                borderRadius: '999px',
                fontSize: '15px',
                marginTop: '4px',
              }}
            >
              {dict.welcomeGetStarted}
            </button>
          </>
        )}

        {step === 1 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <h2 className="onboard-stagger-1" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0F172A' }}>
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
              className="onboard-hairline-input onboard-stagger-2"
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <h2 className="onboard-stagger-1" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0F172A' }}>
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
              className="onboard-hairline-input onboard-stagger-2"
            />
          </div>
        )}

        {step === 3 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h2 className="onboard-stagger-1" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0F172A' }}>
              {dict.onboardingPersonalityTitle}
            </h2>
            <div className="onboard-stagger-2" style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                      setBoopTick((t) => t + 1);
                    }}
                  >
                    <span>
                      <span style={{ fontSize: '15px', fontWeight: active ? 700 : 500, display: 'block' }}>
                        {opt.label[locale]}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>{opt.hint[locale]}</span>
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
            <h2 className="onboard-stagger-1" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0F172A' }}>
              {dict.onboardingLanguageTitle}
            </h2>
            <div className="onboard-stagger-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

        {step === 5 && (
          <OnboardingPrivacyStep
            locale={locale}
            accepted={privacyAccepted}
            onToggle={(next) => {
              playJiggSfx('click', soundEnabled);
              setPrivacyAccepted(next);
              if (next) setBoopTick((t) => t + 1);
            }}
          />
        )}

        {step === 6 && (
          <OnboardingCompleteStep
            locale={locale}
            name={name}
            occupation={occupation}
            onReplayConfetti={() => {
              playJiggSfx('success', soundEnabled);
              setConfettiBurst((b) => b + 1);
              setBoopTick((t) => t + 1);
            }}
          />
        )}

        {step > 0 && (
          <div
            style={{
              width: '100%',
              maxWidth: step === 5 ? '480px' : '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
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
                disabled={!canAdvanceFromStep(step)}
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
                style={{ borderRadius: '999px', padding: '10px 28px', minHeight: '46px', fontSize: '15px' }}
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
