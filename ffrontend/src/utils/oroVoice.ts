export interface OroVoiceClip {
  path: string;
  caption: string;
  lang: 'en-US' | 'ja-JP';
}

export const ORO_VOICE_CLIPS: readonly OroVoiceClip[] = [
  {
    path: '/audio/oro/welcome-opero.mp3',
    caption: 'Opero!',
    lang: 'en-US',
  },
  {
    path: '/audio/oro/step-0-en.mp3',
    caption: "Ooh, hi there! I'm Pero — welcome to Opero.",
    lang: 'en-US',
  },
  {
    path: '/audio/oro/step-5-en.mp3',
    caption: 'Everything stays private right here on your device.',
    lang: 'en-US',
  },
  {
    path: '/audio/oro/step-6-en.mp3',
    caption: 'Yay! Everything is ready whenever you are.',
    lang: 'en-US',
  },
  {
    path: '/audio/oro/step-0-ja.mp3',
    caption: 'こんにちは、ペロです。オペロへようこそ。',
    lang: 'ja-JP',
  },
] as const;

let activeAudio: HTMLAudioElement | null = null;
let clipCursor = 0;

export function stopOroVoice(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore cleanup errors in non-media test environments.
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speechSynthesis cancel errors.
    }
  }
}

function speakChildFallback(text: string, lang: 'en-US' | 'ja-JP'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.pitch = 1.55;
    utterance.rate = 1.06;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully skip if browser blocks synthesis.
  }
}

export function playOroChildVoice(preferredIndex?: number): OroVoiceClip {
  const index =
    typeof preferredIndex === 'number'
      ? Math.abs(preferredIndex) % ORO_VOICE_CLIPS.length
      : clipCursor++ % ORO_VOICE_CLIPS.length;
  const clip = ORO_VOICE_CLIPS[index] ?? ORO_VOICE_CLIPS[0];

  if (typeof window === 'undefined') return clip;
  stopOroVoice();

  if (typeof Audio === 'undefined') {
    speakChildFallback(clip.caption, clip.lang);
    return clip;
  }

  try {
    const audio = new Audio(clip.path);
    audio.volume = 0.92;
    activeAudio = audio;
    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null;
    };
    audio.onerror = () => {
      if (activeAudio === audio) activeAudio = null;
      speakChildFallback(clip.caption, clip.lang);
    };
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (activeAudio === audio) activeAudio = null;
        speakChildFallback(clip.caption, clip.lang);
      });
    }
  } catch {
    speakChildFallback(clip.caption, clip.lang);
  }

  return clip;
}
