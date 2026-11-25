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
