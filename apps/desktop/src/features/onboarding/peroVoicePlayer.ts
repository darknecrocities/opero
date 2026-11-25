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

const audioBufferCache = new Map<string, ArrayBuffer>();
const inflightPrefetch = new Map<string, Promise<ArrayBuffer | null>>();

let voiceAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activePlayToken = 0;

function getVoiceAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!voiceAudioCtx) voiceAudioCtx = new Ctor();
  return voiceAudioCtx;
}

function cacheKey(text: string, lang: PeroVoiceLang): string {
  return `${lang}::${text.trim()}`;
}

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

async function fetchSpeechBytes(text: string, lang: PeroVoiceLang): Promise<ArrayBuffer | null> {
  const key = cacheKey(text, lang);
  const cached = audioBufferCache.get(key);
  if (cached) return cached;

  const existing = inflightPrefetch.get(key);
  if (existing) return existing;

  const job = (async (): Promise<ArrayBuffer | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(SPEAK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const bytes = await res.arrayBuffer();
      if (bytes.byteLength < 256) return null;
      if (audioBufferCache.size > 40) audioBufferCache.clear();
      audioBufferCache.set(key, bytes);
      return bytes;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      inflightPrefetch.delete(key);
    }
  })();

  inflightPrefetch.set(key, job);
  return job;
}

export function prefetchPeroVoice(text: string, lang: PeroVoiceLang): void {
  if (!text.trim()) return;
  void fetchSpeechBytes(text, lang);
}

export function stopPeroVoice(): void {
  activePlayToken += 1;
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // Node may already have ended
    }
    activeSourceNode = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speechSynthesis errors in restricted environments
    }
  }
}

function speakWithWebSpeechFallback(text: string, lang: PeroVoiceLang): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.pitch = 1.65;
    utter.rate = 1.06;
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.slice(0, 2).toLowerCase();
    const match =
      voices.find((v) => v.name.toLowerCase().includes('junior') && prefix === 'en') ??
      voices.find((v) => v.name.toLowerCase().includes('kyoko') && prefix === 'ja') ??
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
  const token = activePlayToken;

  const rawBytes = await fetchSpeechBytes(text, lang);
  if (token !== activePlayToken) return false;

  if (rawBytes) {
    try {
      const ctx = getVoiceAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const decoded = await ctx.decodeAudioData(rawBytes.slice(0));
        if (token !== activePlayToken) return false;
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        source.onended = () => {
          if (activeSourceNode === source) activeSourceNode = null;
        };
        activeSourceNode = source;
        source.start(0);
        return true;
      }
    } catch {
      // Fall through to Web Speech fallback if Web Audio decode fails
    }
  }

  if (token === activePlayToken) {
    speakWithWebSpeechFallback(text, lang);
  }
  return false;
}
