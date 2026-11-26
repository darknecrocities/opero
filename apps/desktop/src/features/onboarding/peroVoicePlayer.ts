import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';

export type PeroVoiceLang = FirstClassLocale;

export interface DynamicVoiceContext {
  readonly step: number;
  readonly name: string;
  readonly occupation: string;
  readonly personality: OperoPersonality;
  readonly privacyAccepted: boolean;
  readonly modelName?: string;
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
  const suffix = lang === 'ja-JP' ? 'ja' : 'en';
  if (step === 5) return `/audio/pero/step-model-${suffix}.mp3`;
  if (step === 6) return `/audio/pero/step-5-${suffix}.mp3`;
  if (step >= 7) return `/audio/pero/step-6-${suffix}.mp3`;
  const clamped = Math.max(0, Math.min(4, step));
  return `/audio/pero/step-${clamped}-${suffix}.mp3`;
}

function buildToneSampleLine(personality: OperoPersonality, cleanName: string, lang: PeroVoiceLang): string {
  if (lang === 'ja-JP') {
    const who = cleanName ? `${cleanName}さん、` : '';
    switch (personality) {
      case 'friendly_guide':
        return `${who}よろしくおねがいします！わかりやすく親しみやすいガイドでサポートいたします。`;
      case 'technical_direct':
        return `了解いたしました、${who}技術的でダイレクトな表現で的確にまとめます。`;
      case 'formal_sop':
        return `承知いたしました、${who}監査にも対応する公式SOPの敬語表現で作成いたします。`;
      default:
        return `承知いたしました、${who}簡潔で落ち着いた表現でお話しします。`;
    }
  }
  if (lang === 'fil-PH') {
    const who = cleanName ? `, ${cleanName}` : '';
    switch (personality) {
      case 'friendly_guide':
        return `Sige po${who}! Magiliw at madaling sundan ang magiging gabay ko sa bawat hakbang.`;
      case 'technical_direct':
        return `Nakuha ko${who}. Diretso at eksaktong teknikal na detalye ang ibibigay ko.`;
      case 'formal_sop':
        return `Nauunawaan ko po${who}. Pormal at handa sa audit ang dokumentasyon natin.`;
      default:
        return `Ayos${who}. Kalmado, malinaw, at maikling mga hakbang ang gagamitin ko.`;
    }
  }
  const who = cleanName ? `, ${cleanName}` : '';
  switch (personality) {
    case 'friendly_guide':
      return `Got it${who}! I'll be your warm, friendly guide every step of the way!`;
    case 'technical_direct':
      return `Got it${who} — technical and direct. Exact commands, crisp steps, zero guesswork.`;
    case 'formal_sop':
      return `Got it${who}. Formal MMI SOP style selected — structured, compliant, and audit-ready.`;
    default:
      return `Got it${who} — calm and concise. Short, clear steps with zero fluff.`;
  }
}

export function buildDynamicPeroLine(ctx: DynamicVoiceContext, lang: PeroVoiceLang): string {
  const cleanName = ctx.name.trim();
  const cleanRole = ctx.occupation.trim();
  const cleanModel = ctx.modelName?.trim() ?? '';

  if (lang === 'ja-JP') {
    switch (ctx.step) {
      case 0:
        return 'こんにちは、ペロです。オペロへようこそ。';
      case 1:
        return cleanName
          ? `${cleanName}さん、はじめまして。どうぞよろしくお願いいたします。`
          : 'こんにちは。お名前を教えていただけますでしょうか？';
      case 2:
        return cleanRole
          ? `${cleanName ? `${cleanName}さん、` : ''}${cleanRole}をご担当されているのですね。素敵です。`
          : cleanName
            ? `${cleanName}さんは、どのようなお仕事を担当されていますか？`
            : 'どのようなお仕事を担当されていますか？';
      case 3:
        return buildToneSampleLine(ctx.personality, cleanName, 'ja-JP');
      case 4:
        return cleanName
          ? `${cleanName}さん、英語・日本語・フィリピン語の3言語に対応しています。`
          : '英語・日本語・フィリピン語の3言語に対応しています。';
      case 5:
        if (cleanModel) {
          return cleanName
            ? `${cleanName}さん、${cleanModel}の準備が整いました。ローカルで快適に動作します。`
            : `${cleanModel}の準備が整いました。ローカルで快適に動作します。`;
        }
        return cleanName
          ? `${cleanName}さんのPC環境に合わせて、最適なローカルAIモデルをお選びください。`
          : 'お使いのPC環境に合わせて、最適なローカルAIモデルをお選びください。';
      case 6:
        return ctx.privacyAccepted
          ? cleanName
            ? `ありがとうございます、${cleanName}さん。すべて端末内で大切に保護いたします。`
            : 'ありがとうございます。すべて端末内で大切に保護いたします。'
          : cleanName
            ? `ご安心ください、${cleanName}さん。すべてこの端末内のみで安全に保護いたします。`
            : 'ご安心ください。すべてこの端末内のみで安全に保護いたします。';
      default:
        return cleanName
          ? `準備が整いました、${cleanName}さん。いつでも始められます。`
          : '準備が整いました。いつでも始められます。';
    }
  }

  if (lang === 'fil-PH') {
    switch (ctx.step) {
      case 0:
        return 'Kumusta! Ako si Pero — maligayang pagdating sa Opero.';
      case 1:
        return cleanName ? `Kumusta, ${cleanName}! Ikinagagalak kitang makilala!` : 'Kumusta! Ano ang dapat itawag ko sa iyo?';
      case 2:
        if (cleanRole) {
          return cleanName ? `Ang galing, ${cleanName}! Magandang papel ang ${cleanRole}.` : `Ang galing! Magandang papel ang ${cleanRole}.`;
        }
        return cleanName ? `${cleanName}, ano ang iyong trabaho o tungkulin?` : 'Ano ang iyong trabaho o tungkulin?';
      case 3:
        return buildToneSampleLine(ctx.personality, cleanName, 'fil-PH');
      case 4:
        return cleanName
          ? `Handa na ako, ${cleanName} — nagsasalita ako ng English, Japanese, at Filipino.`
          : 'Handa na ako — nagsasalita ako ng English, Japanese, at Filipino.';
      case 5:
        if (cleanModel) {
          return cleanName
            ? `Magandang pili, ${cleanName}! Handa na ang ${cleanModel} sa iyong PC.`
            : `Magandang pili! Handa na ang ${cleanModel} sa iyong PC.`;
        }
        return cleanName
          ? `Piliin at i-download ang lokal na AI model na babagay sa PC mo, ${cleanName}.`
          : 'Piliin at i-download ang lokal na AI model na babagay sa PC mo.';
      case 6:
        return ctx.privacyAccepted
          ? cleanName
            ? `Salamat, ${cleanName} — mananatiling ligtas at pribado ang lahat sa iyong device.`
            : 'Salamat — mananatiling ligtas at pribado ang lahat sa iyong device.'
          : cleanName
            ? `Huwag mag-alala, ${cleanName} — lahat ay mananatiling pribado sa iyong device.`
            : 'Huwag mag-alala — lahat ay mananatiling pribado sa iyong device.';
      default:
        return cleanName
          ? `Yehey, ${cleanName}! Handang-handa na ang lahat para sa iyo.`
          : 'Yehey! Handang-handa na ang lahat para sa iyo.';
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
      return buildToneSampleLine(ctx.personality, cleanName, 'en-US');
    case 4:
      return cleanName
        ? `Whenever you're ready, ${cleanName} — I speak English, Japanese, and Filipino.`
        : "Whenever you're ready — I speak English, Japanese, and Filipino.";
    case 5:
      if (cleanModel) {
        return cleanName
          ? `Nice choice, ${cleanName} — ${cleanModel} is downloaded and ready on your PC!`
          : `Nice choice — ${cleanModel} is downloaded and ready on your PC!`;
      }
      return cleanName
        ? `Pick the local AI model that matches your PC speed, ${cleanName}.`
        : 'Pick the local AI model that matches your PC speed.';
    case 6:
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

async function fetchLiveNeuralSpeech(
  text: string,
  lang: PeroVoiceLang,
  tone: OperoPersonality = 'calm_concise',
): Promise<ArrayBuffer | null> {
  const key = `neural::${lang}::${tone}::${text.trim()}`;
  const cached = audioBufferCache.get(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(SPEAK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, tone }),
      signal: controller.signal,
    });
    const engine = res.headers.get('x-opero-tts-engine');
    if (
      !res.ok ||
      res.status === 204 ||
      (engine !== 'loopback-tts' && engine !== 'local-cache' && engine !== 'edge-neural')
    ) {
      return null;
    }
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
      // Already stopped
    }
    activeSourceNode = null;
  }
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    activeHtmlAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
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
  tone: OperoPersonality = 'calm_concise',
): Promise<boolean> {
  if (!enabled || !text.trim()) return false;
  stopPeroVoice();
  const token = activePlayToken;

  const syncCtx = getVoiceAudioContext();
  if (syncCtx && syncCtx.state === 'suspended') {
    void syncCtx.resume().catch(() => {});
  }

  if (preferDynamicNeural) {
    const neuralBytes = await fetchLiveNeuralSpeech(text, lang, tone);
    if (token !== activePlayToken) return false;
    if (neuralBytes) {
      const ok = await playAudioBytes(neuralBytes, token);
      if (ok) return true;
    }
  }

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
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
