import { useEffect, useRef } from 'react';
import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';
import {
  buildDynamicPeroLine,
  bundledClipPathForStep,
  speakPeroDynamic,
  type PeroVoiceLang,
} from './peroVoicePlayer';

interface AutoVoiceParams {
  step: number;
  name: string;
  occupation: string;
  personality: OperoPersonality;
  locale: FirstClassLocale;
  privacyAccepted: boolean;
  soundEnabled: boolean;
  onSpoken: (line: { text: string; lang: PeroVoiceLang }) => void;
}

/**
 * Automatically speaks Pero's personalized voiceover when the user finishes typing
 * their name or occupation (debounced 750ms) or changes style/language/privacy/completes setup.
 */
export function useOnboardingAutoVoice({
  step,
  name,
  occupation,
  personality,
  locale,
  privacyAccepted,
  soundEnabled,
  onSpoken,
}: AutoVoiceParams): void {
  const lastSpokenRef = useRef<string>('');

  useEffect(() => {
    if (!soundEnabled) return;
    const voiceLang: PeroVoiceLang = locale === 'ja-JP' ? 'ja-JP' : 'en-US';
    const cleanName = name.trim();
    const cleanRole = occupation.trim();

    // Only auto-speak on text steps once the user has typed >= 2 characters
    if (step === 0) return;
    if (step === 1 && cleanName.length < 2) return;
    if (step === 2 && cleanRole.length < 2) return;

    const line = buildDynamicPeroLine(
      { step, name: cleanName, occupation: cleanRole, personality, privacyAccepted },
      voiceLang,
    );
    const key = `${step}::${voiceLang}::${line}`;
    if (lastSpokenRef.current === key) return;

    const delayMs = step === 1 || step === 2 ? 750 : 220;
    const timer = window.setTimeout(() => {
      lastSpokenRef.current = key;
      onSpoken({ text: line, lang: voiceLang });
      const hasPersonal =
        cleanName.length > 0 || cleanRole.length > 0 || step >= 3;
      void speakPeroDynamic(
        line,
        voiceLang,
        soundEnabled,
        bundledClipPathForStep(step, voiceLang),
        hasPersonal,
      );
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [step, name, occupation, personality, locale, privacyAccepted, soundEnabled]);
}
