import { useEffect, useRef } from 'react';
import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';
import {
  buildDynamicPeroLine,
  bundledClipPathForStep,
  prefetchLiveNeuralSpeech,
  prefetchPeroClip,
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

const ALL_TONES: readonly OperoPersonality[] = [
  'calm_concise',
  'friendly_guide',
  'technical_direct',
  'formal_sop',
];
const ALL_LOCALES: readonly FirstClassLocale[] = ['en-US', 'ja-JP', 'fil-PH'];

/**
 * Automatically speaks Pero's dynamic personalized neural voiceover with 0ms click response
 * on selection steps (Tone, Language, Model, Privacy, Complete) and pre-warms upcoming options.
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

  // Pre-warm all 4 personalized tones when approaching or on Step 3, and all 3 languages on Step 3/4
  useEffect(() => {
    if (!soundEnabled) return;
    const cleanName = name.trim();
    const cleanRole = occupation.trim();
    if (step === 2 || step === 3) {
      for (const t of ALL_TONES) {
        prefetchPeroClip(bundledClipPathForStep(3, locale, t));
        const toneLine = buildDynamicPeroLine(
          { step: 3, name: cleanName, occupation: cleanRole, personality: t, privacyAccepted },
          locale,
        );
        prefetchLiveNeuralSpeech(toneLine, locale, t);
      }
    }
    if (step === 3 || step === 4) {
      for (const loc of ALL_LOCALES) {
        prefetchPeroClip(bundledClipPathForStep(4, loc, personality));
        const langLine = buildDynamicPeroLine(
          { step: 4, name: cleanName, occupation: cleanRole, personality, privacyAccepted },
          loc,
        );
        prefetchLiveNeuralSpeech(langLine, loc, personality);
      }
    }
  }, [step, name, occupation, locale, personality, privacyAccepted, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled || step === 0) return;
    const voiceLang: PeroVoiceLang = locale;
    const cleanName = name.trim();
    const cleanRole = occupation.trim();
    const cleanModel = selectedModelName?.trim() ?? '';

    const line = buildDynamicPeroLine(
      { step, name: cleanName, occupation: cleanRole, personality, privacyAccepted, modelName: cleanModel },
      voiceLang,
    );
    const key = `${step}::${voiceLang}::${personality}::${line}`;
    if (lastSpokenRef.current === key) return;

    const triggerSpeak = () => {
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
        bundledClipPathForStep(step, voiceLang, personality),
        preferDynamic,
        personality,
      );
    };

    // Debounce ONLY while typing free-text on Step 1 (Name) or Step 2 (Role); click steps fire immediately (0ms)
    const isTypingStep = (step === 1 && cleanName.length > 0) || (step === 2 && cleanRole.length > 0);
    if (!isTypingStep) {
      triggerSpeak();
      return;
    }

    const timer = window.setTimeout(triggerSpeak, 600);
    return () => window.clearTimeout(timer);
  }, [step, name, occupation, personality, locale, privacyAccepted, selectedModelName, soundEnabled]);
}
