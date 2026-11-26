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
  selectedModelName?: string;
  soundEnabled: boolean;
  onSpoken: (line: { text: string; lang: PeroVoiceLang }) => void;
}

/**
 * Automatically speaks Pero's dynamic personalized neural voiceover when entering a step,
 * finishing name/role input (debounced 700ms), switching tone/language/model, or completing setup.
 */
export function useOnboardingAutoVoice({
  step,
  name,
  occupation,
  personality,
  locale,
  privacyAccepted,
  selectedModelName,
  soundEnabled,
  onSpoken,
}: AutoVoiceParams): void {
  const lastSpokenRef = useRef<string>('');

  useEffect(() => {
    if (!soundEnabled) return;
    const voiceLang: PeroVoiceLang = locale;
    const cleanName = name.trim();
    const cleanRole = occupation.trim();
    const cleanModel = selectedModelName?.trim() ?? '';

    if (step === 0) return;

    const line = buildDynamicPeroLine(
      { step, name: cleanName, occupation: cleanRole, personality, privacyAccepted, modelName: cleanModel },
      voiceLang,
    );
    const key = `${step}::${voiceLang}::${personality}::${line}`;
    if (lastSpokenRef.current === key) return;

    const delayMs =
      (step === 1 && cleanName.length > 0) || (step === 2 && cleanRole.length > 0) ? 700 : 220;

    const timer = window.setTimeout(() => {
      lastSpokenRef.current = key;
      onSpoken({ text: line, lang: voiceLang });
      const preferDynamic =
        cleanName.length > 0 ||
        cleanRole.length > 0 ||
        cleanModel.length > 0 ||
        voiceLang === 'fil-PH' ||
        step >= 3;
      void speakPeroDynamic(
        line,
        voiceLang,
        soundEnabled,
        bundledClipPathForStep(step, voiceLang),
        preferDynamic,
        personality,
      );
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [step, name, occupation, personality, locale, privacyAccepted, selectedModelName, soundEnabled]);
}
