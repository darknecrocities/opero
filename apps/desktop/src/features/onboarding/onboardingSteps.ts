import type { PeroMotionId } from '@opero/mascot';
import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';

export type OnboardingStepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const TOTAL_SCREENS = 8;

export interface OnboardingStepSpec {
  readonly index: OnboardingStepIndex;
  readonly defaultMotion: PeroMotionId;
  readonly mascotSize: number;
  readonly whisper: Record<FirstClassLocale, string>;
}

export const ONBOARDING_STEP_SPECS: readonly OnboardingStepSpec[] = [
  {
    index: 0,
    defaultMotion: 'wave-hello',
    mascotSize: 288,
    whisper: {
      'en-US': 'Tap me to say hi!',
      'ja-JP': 'タップしてご挨拶しましょう',
      'fil-PH': 'I-tap ako para mag-hi!',
    },
  },
  {
    index: 1,
    defaultMotion: 'monocle-inspect',
    mascotSize: 210,
    whisper: {
      'en-US': 'Who am I teaming up with?',
      'ja-JP': 'お名前を教えてください',
      'fil-PH': 'Sino ang kasama ko ngayon?',
    },
  },
  {
    index: 2,
    defaultMotion: 'writing-manual',
    mascotSize: 210,
    whisper: {
      'en-US': 'Jotting down your craft...',
      'ja-JP': '役割をメモしています…',
      'fil-PH': 'Sinusulat ko ang papel mo...',
    },
  },
  {
    index: 3,
    defaultMotion: 'thinking-processing',
    mascotSize: 204,
    whisper: {
      'en-US': 'Pick how I should sound.',
      'ja-JP': '話し方のスタイルをお選びください',
      'fil-PH': 'Piliin kung paano ako magsasalita.',
    },
  },
  {
    index: 4,
    defaultMotion: 'walk-waddle',
    mascotSize: 210,
    whisper: {
      'en-US': 'Ready in three languages!',
      'ja-JP': '3言語ですぐに対応します！',
      'fil-PH': 'Handa sa tatlong wika!',
    },
  },
  {
    index: 5,
    defaultMotion: 'model-loading',
    mascotSize: 148,
    whisper: {
      'en-US': 'Pick the local AI model for your PC!',
      'ja-JP': 'お使いのPCに最適なモデルをお選びください',
      'fil-PH': 'Piliin ang AI model na babagay sa PC mo!',
    },
  },
  {
    index: 6,
    defaultMotion: 'privacy-shield',
    mascotSize: 184,
    whisper: {
      'en-US': '100% local & private on-device.',
      'ja-JP': 'すべて端末内で安全に処理します',
      'fil-PH': '100% lokal at pribado sa device.',
    },
  },
  {
    index: 7,
    defaultMotion: 'jump-cheer',
    mascotSize: 288,
    whisper: {
      'en-US': 'Woohoo! Everything is ready!',
      'ja-JP': '設定が完了しました。準備完了です！',
      'fil-PH': 'Yehey! Handang-handa na!',
    },
  },
];

export function getOnboardingStepSpec(step: number): OnboardingStepSpec {
  return ONBOARDING_STEP_SPECS[step] ?? ONBOARDING_STEP_SPECS[0]!;
}

export const TONE_TO_PERO_MOTION: Record<OperoPersonality, PeroMotionId> = {
  calm_concise: 'idle-breathe',
  friendly_guide: 'thumbs-up',
  technical_direct: 'monocle-inspect',
  formal_sop: 'writing-manual',
};

export interface CompletionCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly replayConfetti: string;
}

export function getCompletionCopy(locale: FirstClassLocale, rawName: string): CompletionCopy {
  const safeName = rawName.trim() || 'MMI Operator';
  if (locale === 'ja-JP') {
    return {
      eyebrow: 'セットアップが完了しました',
      title: `準備が整いました、${safeName}さん。`,
      subtitle: 'すべてローカル完結で、いつでもワークフローを記録・整理できます。',
      replayConfetti: 'もう一度お祝いします',
    };
  }
  if (locale === 'fil-PH') {
    return {
      eyebrow: 'Tapos na ang setup',
      title: `Handa ka na, ${safeName}.`,
      subtitle: 'Lokal, pribado, at handang tumulong sa bawat workflow mo.',
      replayConfetti: 'Magpasabog ulit ng confetti',
    };
  }
  return {
    eyebrow: 'Setup complete',
    title: `You’re all set, ${safeName}.`,
    subtitle: 'Local-first, private, and ready whenever you are.',
    replayConfetti: 'Pop confetti again',
  };
}
