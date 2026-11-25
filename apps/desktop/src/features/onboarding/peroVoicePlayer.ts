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
const inflightFetch = new Map<string, Promise<ArrayBuffer | null>>();

let voiceAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeHtmlAudio: HTMLAudioElement | null = null;
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

export function bundledClipPathForStep(step: number, lang: PeroVoiceLang): string {
  const clamped = Math.max(0, Math.min(6, step));
  const suffix = lang === 'ja-JP' ? 'ja' : 'en';
  return `/audio/pero/step-${clamped}-${suffix}.mp3`;
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
        return 'こんにちは、ペロです。オペロへようこそ。';
      case 1:
        return cleanName
          ? `${cleanName}さん、はじめまして。どうぞよろしくお願いいたします。`
          : 'こんにちは。お名前を教えていただけますか？';
      case 2:
        return cleanRole
          ? `${cleanRole}をご担当されているのですね。素敵です。`
          : cleanName
            ? `${cleanName}さんは、どのようなお仕事をされていますか？`
            : 'どのようなお仕事をされていますか？';
      case 3:
        return cleanName
          ? `承知しました、${cleanName}さん。${toneJa}でお話しします。`
          : `承知しました。${toneJa}でお話しします。`;
      case 4:
        return cleanName
          ? `${cleanName}さん、英語・日本語・フィリピン語に対応しています。`
          : '英語・日本語・フィリピン語に対応しています。';
      case 5:
        return ctx.privacyAccepted
          ? 'ありがとうございます。すべて端末内で大切に保護します。'
          : 'ご安心ください。すべてこの端末内のみで安全に保護します。';
      default:
        return cleanName
          ? `準備が整いました、${cleanName}さん。いつでも始められます。`
          : '準備が整いました。いつでも始められます。';
    }
  }

  switch (ctx.step) {
    case 0:
      return "Ooh, hi there! I'm Pero — welcome to Opero.";
    case 1:
      return cleanName ? `Ooh, hi ${cleanName}! Nice to meet you!` : 'Ooh, hi! What should I call you?';
    case 2:
      if (cleanRole) {
        return cleanName ? `Ooh, ${cleanName}, ${cleanRole} sounds wonderful!` : `Ooh, ${cleanRole} sounds wonderful!`;
      }
      return cleanName ? `Ooh, ${cleanName}, what kind of work do you do?` : 'Ooh, what kind of work do you do?';
    case 3:
      return cleanName
        ? `Got it, ${cleanName} — I'll speak in a ${toneEn} tone.`
        : `Got it — I'll speak in a ${toneEn} tone.`;
    case 4:
      return cleanName
        ? `Whenever you're ready, ${cleanName} — I speak English, Japanese, and Filipino.`
        : "Whenever you're ready — I speak English, Japanese, and Filipino.";
    case 5:
      if (ctx.privacyAccepted) {
        return cleanName
          ? `Thank you, ${cleanName} — everything stays safe right here on your device.`
          : 'Thank you — everything stays safe right here on your device.';
      }
      return cleanName
        ? `Don't worry, ${cleanName} — everything stays private right here on your device.`
        : "Don't worry — everything stays private right here on your device.";
    default:
      return cleanName
        ? `Yay, ${cleanName}! Everything is ready whenever you are.`
        : 'Yay! Everything is ready whenever you are.';
  }
}

async function fetchBundledClip(path: string): Promise<ArrayBuffer | null> {
  const cached = audioBufferCache.get(path);
  if (cached) return cached;
  const existing = inflightFetch.get(path);
  if (existing) return existing;

  const job = (async (): Promise<ArrayBuffer | null> => {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      const bytes = await res.arrayBuffer();
      if (bytes.byteLength < 256) return null;
      audioBufferCache.set(path, bytes);
      return bytes;
    } catch {
      return null;
    } finally {
      inflightFetch.delete(path);
    }
  })();

  inflightFetch.set(path, job);
  return job;
}

async function fetchLiveNeuralSpeech(text: string, lang: PeroVoiceLang): Promise<ArrayBuffer | null> {
  const key = `neural::${lang}::${text.trim()}`;
  const cached = audioBufferCache.get(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(SPEAK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: controller.signal,
    });
    // Only use daemon output when it comes from the live Kokoro-82M neural server (never robotic OS say)
    const engine = res.headers.get('x-opero-tts-engine');
    if (!res.ok || res.status === 204 || engine !== 'loopback-tts') return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength < 256) return null;
    audioBufferCache.set(key, bytes);
    return bytes;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function prefetchPeroClip(bundledPath: string): void {
  if (!bundledPath) return;
  void fetchBundledClip(bundledPath);
}

export function stopPeroVoice(): void {
  activePlayToken += 1;
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // Node already stopped
    }
    activeSourceNode = null;
  }
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {
      // Ignore pause errors
    }
    activeHtmlAudio = null;
  }
}

async function playAudioBytes(rawBytes: ArrayBuffer, token: number): Promise<boolean> {
  try {
    const ctx = getVoiceAudioContext();
    if (!ctx) return false;
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
  } catch {
    return false;
  }
}

export async function speakPeroDynamic(
  text: string,
  lang: PeroVoiceLang,
  enabled: boolean,
  bundledFallbackPath: string,
  preferDynamicNeural = false,
): Promise<boolean> {
  if (!enabled || !text.trim()) return false;
  stopPeroVoice();
  const token = activePlayToken;

  // Synchronously unlock Web Audio inside the user click gesture (required by macOS WKWebView)
  const syncCtx = getVoiceAudioContext();
  if (syncCtx && syncCtx.state === 'suspended') {
    void syncCtx.resume().catch(() => {});
  }

  // For personalized lines (user's typed name/role), try live Kokoro-82M neural server first
  if (preferDynamicNeural) {
    const neuralBytes = await fetchLiveNeuralSpeech(text, lang);
    if (token !== activePlayToken) return false;
    if (neuralBytes) {
      const ok = await playAudioBytes(neuralBytes, token);
      if (ok) return true;
    }
  }

  // Play bundled Kokoro-82M neural child MP3 via Web Audio API, falling back to HTMLAudioElement
  const clipBytes = await fetchBundledClip(bundledFallbackPath);
  if (token !== activePlayToken) return false;
  if (clipBytes) {
    const ok = await playAudioBytes(clipBytes, token);
    if (ok) return true;
  }

  if (token !== activePlayToken || typeof Audio === 'undefined') return false;
  try {
    const audio = new Audio(bundledFallbackPath);
    activeHtmlAudio = audio;
    audio.onended = () => {
      if (activeHtmlAudio === audio) activeHtmlAudio = null;
    };
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
