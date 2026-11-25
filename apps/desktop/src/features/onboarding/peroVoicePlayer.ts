import { PERSONALITY_OPTIONS } from '@opero/i18n';
import type { OperoPersonality } from '@opero/shared-types';

export type PeroVoiceLang = 'en-US' | 'ja-JP';

export interface DynamicVoiceContext {
  readonly step: number;
  readonly name: string;
  readonly occupation: string;
  readonly personality: OperoPersonality;
  readonly privacyAccepted: boolean;
}

const DAEMON_PORT = (import.meta.env?.VITE_OPERO_DAEMON_PORT as string | undefined) || '4317';
const SPEAK_ENDPOINT = `http://127.0.0.1:${DAEMON_PORT}/api/v1/speech/speak`;

let activeAudio: HTMLAudioElement | null = null;
let activeBlobUrl: string | null = null;
let activeFetchCtrl: AbortController | null = null;

export function buildDynamicPeroLine(ctx: DynamicVoiceContext, lang: PeroVoiceLang): string {
  const cleanName = ctx.name.trim();
  const cleanRole = ctx.occupation.trim();
  const toneOpt = PERSONALITY_OPTIONS.find((opt) => opt.id === ctx.personality);
  const toneEn = toneOpt?.label['en-US'] ?? 'Calm and Concise';
  const toneJa = toneOpt?.label['ja-JP'] ?? '丁寧で簡潔';

  if (lang === 'ja-JP') {
    switch (ctx.step) {
      case 0:
        return 'やっほー！ペロだよ！オペロへようこそ！';
      case 1:
        return cleanName ? `わあ、${cleanName}さん！よろしくね！` : 'ねえねえ、お名前なんていうの？';
      case 2:
        return cleanRole ? `すごい！${cleanRole}なんだね！かっこいい！` : 'どんなお仕事してるの？';
      case 3:
        return `わかった！${toneJa}でお話しするね！`;
      case 4:
        return '英語も日本語もフィリピン語も話せるよ！';
      case 5:
        return ctx.privacyAccepted
          ? 'やった！ぜんぶパソコンの中で安全だよ！'
          : 'だいじょうぶ！ぜんぶ端末の中で守るよ！';
      default:
        return cleanName
          ? `やったー、${cleanName}さん！準備かんりょう！いこうね！`
          : 'やったー！準備かんりょう！いこうね！';
    }
  }

  switch (ctx.step) {
    case 0:
      return "Hi! I'm Pero! Welcome to Opero!";
    case 1:
      return cleanName ? `Ooh, hi ${cleanName}! Nice to meet you!` : "Ooh! What's your name?";
    case 2:
      return cleanRole ? `Whoa, ${cleanRole} sounds super cool!` : 'What cool stuff do you do?';
    case 3:
      return `Okay! I'll talk in ${toneEn} style!`;
    case 4:
      return 'I speak English, Japanese, and Filipino!';
    case 5:
      return ctx.privacyAccepted
        ? 'Yay! Everything stays safe on your computer!'
        : "Don't worry! Everything stays private right here!";
    default:
      return cleanName
        ? `Yay ${cleanName}! We're all set! Let's go!`
        : "Yay! We're all set! Let's go!";
  }
}

export function stopPeroVoice(): void {
  if (activeFetchCtrl) {
    activeFetchCtrl.abort();
    activeFetchCtrl = null;
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speechSynthesis cancel errors in restricted environments
    }
  }
}

function speakWithWebSpeechFallback(text: string, lang: PeroVoiceLang): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.pitch = 1.52;
    utter.rate = 1.06;
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.slice(0, 2).toLowerCase();
    const match =
      voices.find((v) => v.name.toLowerCase().includes('junior') && prefix === 'en') ??
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore headless speech synthesis errors
  }
}

export async function speakPeroDynamic(
  text: string,
  lang: PeroVoiceLang,
  enabled: boolean,
): Promise<boolean> {
  if (!enabled || !text.trim()) return false;
  stopPeroVoice();

  const controller = new AbortController();
  activeFetchCtrl = controller;
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(SPEAK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
    const blob = await res.blob();
    if (controller.signal.aborted || blob.size < 256) return false;

    const url = URL.createObjectURL(blob);
    activeBlobUrl = url;
    const audio = new Audio(url);
    activeAudio = audio;
    audio.onended = () => {
      if (activeBlobUrl === url) {
        URL.revokeObjectURL(url);
        activeBlobUrl = null;
      }
      if (activeAudio === audio) activeAudio = null;
    };
    audio.onerror = () => {
      if (activeBlobUrl === url) {
        URL.revokeObjectURL(url);
        activeBlobUrl = null;
      }
      if (activeAudio === audio) activeAudio = null;
    };
    await audio.play();
    return true;
  } catch {
    if (!controller.signal.aborted) {
      speakWithWebSpeechFallback(text, lang);
    }
    return false;
  } finally {
    clearTimeout(timeout);
    if (activeFetchCtrl === controller) activeFetchCtrl = null;
  }
}
