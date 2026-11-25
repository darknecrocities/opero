import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getUiDictionary, PERSONALITY_OPTIONS } from '@opero/i18n';
import { playJiggSfx } from '@opero/jiggicons';
import { PeroMascot, type PeroMotionId } from '@opero/mascot';
import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';
import { OnboardingAmbientBg } from './OnboardingAmbientBg';
import { OnboardingCompleteStep } from './OnboardingCompleteStep';
import { OnboardingConfetti } from './OnboardingConfetti';
import { OnboardingPrivacyStep } from './OnboardingPrivacyStep';
import {
  getOnboardingStepSpec,
  ONBOARDING_STEP_SPECS,
  TONE_TO_PERO_MOTION,
  TOTAL_SCREENS,
} from './onboardingSteps';
import {
  buildDynamicPeroLine,
  bundledClipPathForStep,
  prefetchPeroClip,
  speakPeroDynamic,
  stopPeroVoice,
  type PeroVoiceLang,
} from './peroVoicePlayer';

const WORDMARK_LETTERS = ['O', 'p', 'e', 'r', 'o'] as const;
const BOOP_SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export const WelcomeOnboardingFlow: React.FC = () => {
  const { userProfile, soundEnabled, toggleSound, saveOnboardingProfile, setUiLocale } = useOperoStore();
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [name, setName] = useState<string>(userProfile.name);
  const [occupation, setOccupation] = useState<string>(userProfile.occupation);
  const [personality, setPersonality] = useState<OperoPersonality>(userProfile.personality);
  const [locale, setLocale] = useState<FirstClassLocale>(userProfile.defaultLocale);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [boopTick, setBoopTick] = useState<number>(0);
  const [stepTapCount, setStepTapCount] = useState<number>(0);
  const [spokenLine, setSpokenLine] = useState<{ text: string; lang: PeroVoiceLang } | null>(null);
  const [confettiBurst, setConfettiBurst] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const swipeStartX = useRef<number | null>(null);
  const introPlayedRef = useRef<boolean>(false);

  const dict = getUiDictionary(locale);
  const spec = getOnboardingStepSpec(step);

  useEffect(() => {
    if (!soundEnabled) return;
    if (step === 0) prefetchPeroClip('/audio/pero/welcome-opero.mp3');
    prefetchPeroClip(bundledClipPathForStep(step, 'en-US'));
    prefetchPeroClip(bundledClipPathForStep(step, 'ja-JP'));
  }, [step, soundEnabled]);

  useEffect(() => {
    if (step !== 0 || introPlayedRef.current || !soundEnabled) return;
    introPlayedRef.current = true;
    void speakPeroDynamic('Opero!', 'en-US', soundEnabled, '/audio/pero/welcome-opero.mp3', false);
  }, [step, soundEnabled]);

  useEffect(() => () => stopPeroVoice(), []);

  const activeMotion: PeroMotionId = useMemo(() => {
    if (step === 1 && name.trim().length > 0) return 'thumbs-up';
    if (step === 3) return TONE_TO_PERO_MOTION[personality] ?? 'thinking-processing';
    if (step === 5 && privacyAccepted) return 'thumbs-up';
    if (step === 6) return boopTick % 2 === 1 ? 'verified-celebrate' : 'jump-cheer';
    return spec.defaultMotion;
  }, [step, name, personality, privacyAccepted, boopTick, spec.defaultMotion]);

  const cueText = useMemo(() => {
    const activeLang: PeroVoiceLang = spokenLine?.lang ?? (locale === 'ja-JP' ? 'ja-JP' : 'en-US');
    return buildDynamicPeroLine({ step, name, occupation, personality, privacyAccepted }, activeLang);
  }, [spokenLine, locale, step, name, occupation, personality, privacyAccepted]);

  const canAdvanceFromStep = (current: number): boolean => {
    if (current === 1 && !name.trim()) return false;
    if (current === 5 && !privacyAccepted) return false;
    return current < TOTAL_SCREENS - 1;
  };

  const transitionToStep = (nextStep: number, dir: 'next' | 'prev') => {
    stopPeroVoice();
    setStepTapCount(0);
    setSpokenLine(null);
    setDirection(dir);
    setStep(nextStep);
  };

  const goNext = () => {
    if (!canAdvanceFromStep(step)) return;
    const nextStep = Math.min(TOTAL_SCREENS - 1, step + 1);
    playJiggSfx(nextStep === TOTAL_SCREENS - 1 ? 'success' : 'step', soundEnabled);
    if (nextStep === TOTAL_SCREENS - 1) setConfettiBurst((b) => b + 1);
    transitionToStep(nextStep, 'next');
  };

  const goBack = () => {
    if (step <= 0) return;
    playJiggSfx('click', soundEnabled);
    transitionToStep(Math.max(0, step - 1), 'prev');
  };

  const handlePeroTap = () => {
    const nextTap = stepTapCount + 1;
    const voiceLang: PeroVoiceLang = nextTap % 2 === 1 ? 'en-US' : 'ja-JP';
    const line = buildDynamicPeroLine(
      { step, name, occupation, personality, privacyAccepted },
      voiceLang,
    );
    setStepTapCount(nextTap);
    setSpokenLine({ text: line, lang: voiceLang });
    setBoopTick((t) => t + 1);
    if (step === TOTAL_SCREENS - 1) setConfettiBurst((b) => b + 1);
    const hasPersonalInput =
      (step === 1 && name.trim().length > 0) ||
      (step === 2 && occupation.trim().length > 0) ||
      (step === 6 && name.trim().length > 0);
    playJiggSfx(step === TOTAL_SCREENS - 1 ? 'success' : 'click', soundEnabled);
    void speakPeroDynamic(
      line,
      voiceLang,
      soundEnabled,
      bundledClipPathForStep(step, voiceLang),
      hasPersonalInput,
    );
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
    stopPeroVoice();
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
        background: 'radial-gradient(circle at 50% 22%, #FAF9F7 0%, #F2F1EE 56%, #ECEBE7 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        overflow: 'hidden',
      }}
    >
      <OnboardingAmbientBg step={step} boopTick={boopTick} />
      {step === 6 && <OnboardingConfetti burstKey={confettiBurst} />}

      <button
        type="button"
        aria-label="Toggle Pero voice and sound"
        onClick={() => {
          if (soundEnabled) stopPeroVoice();
          toggleSound();
        }}
        className="onboard-ghost-btn"
        style={{ position: 'fixed', top: '18px', right: '22px', zIndex: 4, fontSize: '12.5px' }}
      >
        {soundEnabled ? 'Voice: ON' : 'Voice: OFF'}
      </button>

      <div
        key={step}
        className={direction === 'next' ? 'onboard-swipe-next' : 'onboard-swipe-prev'}
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            aria-label="Interact with Pero"
            onClick={handlePeroTap}
            className="onboard-pero-stage"
          >
            {boopTick > 0 && (
              <span key={`sparks-${boopTick}`} aria-hidden="true" className="onboard-boop-sparks">
                {BOOP_SPARK_ANGLES.map((deg, idx) => (
                  <span
                    key={deg}
                    className="onboard-boop-spark"
                    style={
                      {
                        '--spark-deg': `${deg}deg`,
                        backgroundColor: idx % 3 === 0 ? '#69BCFC' : idx % 2 === 0 ? '#0F172A' : '#A8A29E',
                      } as React.CSSProperties
                    }
                  />
                ))}
              </span>
            )}
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
            <span aria-hidden="true" className="onboard-ground-shadow" />
          </button>

          <span
            key={`${step}-${cueText}-${boopTick}`}
            data-testid="pero-click-cue"
            className="onboard-click-cue onboard-whisper"
          >
            {cueText}
          </span>
        </div>

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
                  backgroundColor: isActive ? '#0F172A' : isDone ? '#78716C' : '#D6D3CD',
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
                onClick={() => void speakPeroDynamic('Opero!', 'en-US', soundEnabled, '/audio/pero/welcome-opero.mp3', false)}
                className="onboard-playful-wordmark"
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
                <span aria-hidden="true" className="opero-letter" style={{ color: '#94A3B8', animationDelay: '300ms' }}>
                  .
                </span>
              </h1>
              <p className="onboard-stagger-2" style={{ margin: 0, fontSize: '16px', color: '#475569', fontFamily: 'var(--font-playful)', fontWeight: 500 }}>
                {dict.welcomeSubtitle}
              </p>
            </div>

            <button
              type="button"
              className="opero-btn primary onboard-cta-sheen onboard-stagger-3"
              onClick={goNext}
              style={{ minWidth: '196px', minHeight: '48px', borderRadius: '999px', fontSize: '15.5px', marginTop: '4px' }}
            >
              {dict.welcomeGetStarted}
            </button>
          </>
        )}

        {step === 1 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <h2 className="onboard-playful-heading onboard-stagger-1">{dict.onboardingNameTitle}</h2>
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
            <h2 className="onboard-playful-heading onboard-stagger-1">{dict.onboardingOccupationTitle}</h2>
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
            <h2 className="onboard-playful-heading onboard-stagger-1">{dict.onboardingPersonalityTitle}</h2>
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
            <h2 className="onboard-playful-heading onboard-stagger-1">{dict.onboardingLanguageTitle}</h2>
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
                className="opero-btn primary onboard-cta-sheen"
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
