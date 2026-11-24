import packData from './jiggicons-pack.json';

export type JiggVariant = 'duotone' | 'outline' | 'solid' | 'glass';

interface MotionChannelSpec {
  push?: [number, number, number][];
  hold?: [number, number, number, number][];
  turn?: [number, number, number][];
  spring?: [number, number];
  follow?: [number, string];
  gain?: number;
  relative?: boolean;
}

export interface JiggIconDef {
  id: string;
  svg: Record<string, { markup: string }>;
  motion?: {
    ms: number;
    outline?: [number, number, number, Record<string, MotionChannelSpec>][];
    solid?: [number, number, number, Record<string, MotionChannelSpec>][];
  };
}

export const JIGGICONS_PACK = packData as unknown as Record<string, JiggIconDef>;
export const JIGGICON_IDS = Object.keys(JIGGICONS_PACK) as readonly string[];

const RATE = 120;
const CHANNELS = ['x', 'y', 'r', 'sq', 's', 'o'] as const;
const VARIANTS: readonly JiggVariant[] = ['duotone', 'outline', 'solid', 'glass'];
const running = new WeakMap<Element, () => void>();

const materialOf = (variant: JiggVariant): 'outline' | 'solid' =>
  variant === 'glass' ? 'solid' : variant === 'duotone' ? 'outline' : variant;

function bump(t: number, start: number, end: number): number {
  if (t <= start || t >= end) return 0;
  return Math.sin((Math.PI * (t - start)) / (end - start)) ** 2;
}

function plateau(t: number, start: number, end: number, ramp: number): number {
  if (t <= start || t >= end) return 0;
  if (t < start + ramp) return Math.sin(((Math.PI / 2) * (t - start)) / ramp) ** 2;
  if (t > end - ramp) return Math.sin(((Math.PI / 2) * (end - t)) / ramp) ** 2;
  return 1;
}

function stepCurve(t: number, start: number, end: number): number {
  if (t <= start) return 0;
  if (t >= end) return 1;
  const u = (t - start) / (end - start);
  return u * u * (3 - 2 * u);
}

function springIntegrate(target: Float64Array, frequency: number, damping: number): Float64Array {
  const result = new Float64Array(target.length);
  let position = 0;
  let velocity = 0;
  const omega = 2 * Math.PI * frequency;
  const substeps = 4;
  const dt = 1 / (RATE * substeps);
  for (let i = 0; i < target.length; i++) {
    const tgt = target[i] ?? 0;
    for (let k = 0; k < substeps; k++) {
      const accel = omega ** 2 * (tgt - position) - 2 * damping * omega * velocity;
      velocity += accel * dt;
      position += velocity * dt;
    }
    result[i] = position;
  }
  return result;
}

type BakedSeries = Float64Array & { rest?: number };

export function bakeJiggMotion(
  layers: [number, number, number, Record<string, MotionChannelSpec>][],
  ms: number,
): Record<string, BakedSeries>[] {
  const count = Math.round((ms / 1000) * RATE) + 1;
  const time = Array.from({ length: count }, (_, i) => i / RATE);
  const result: Record<string, BakedSeries>[] = layers.map(() => ({}));

  layers.forEach(([, , , channels], index) => {
    const bucket = result[index];
    if (!bucket) return;
    for (const name of CHANNELS) {
      const channel = channels[name];
      if (!channel) continue;
      let drive: Float64Array;
      if (channel.follow) {
        const [leaderIdx, leaderCh] = channel.follow;
        const source = result[leaderIdx]?.[leaderCh] ?? new Float64Array(count);
        const gain = channel.gain ?? 1;
        drive = Float64Array.from(source, (v) => v * gain);
      } else {
        drive = Float64Array.from(time, (t) =>
          (channel.push ?? []).reduce((s, [a, st, en]) => s + a * bump(t, st, en), 0) +
          (channel.hold ?? []).reduce((s, [a, st, en, r]) => s + a * plateau(t, st, en, r), 0) +
          (channel.turn ?? []).reduce((s, [a, st, en]) => s + a * stepCurve(t, st, en), 0),
        );
      }
      let values: BakedSeries = channel.spring
        ? springIntegrate(drive, channel.spring[0], channel.spring[1])
        : drive;
      let rest = (channel.turn ?? []).reduce((s, [a]) => s + a, 0) * (channel.follow ? 0 : 1);
      if (channel.follow) {
        const leader = result[channel.follow[0]]?.[channel.follow[1]];
        rest = (leader?.rest ?? 0) * (channel.gain ?? 1);
        if (channel.relative && leader) {
          values = Float64Array.from(values, (v, i) => v - (leader[i] ?? 0));
          rest -= leader.rest ?? 0;
        }
      }
      values.rest = rest;
      bucket[name] = values;
    }
  });
  return result;
}

export function keyframesOfChannels(channels: Record<string, BakedSeries>): Keyframe[] | null {
  const names = Object.keys(channels);
  if (!names.length) return null;
  const first = channels[names[0] ?? ''];
  if (!first) return null;
  const count = first.length;
  const frames: Keyframe[] = [];
  for (let i = 0; i < count; i += 2) {
    const last = i + 2 >= count;
    const at = (k: string) => channels[k]?.[i] ?? 0;
    const sq = last ? 0 : at('sq');
    const s = last ? 1 : 1 + at('s');
    const x = last ? 0 : at('x');
    const y = last ? 0 : at('y');
    const r = last ? channels.r?.rest ?? 0 : at('r');
    const o = last ? 1 : Math.max(0, Math.min(1, 1 + at('o')));
    frames.push({
      offset: last ? 1 : i / (count - 1),
      transform: `translate(${(x / 24) * 100}%, ${(y / 24) * 100}%) rotate(${r}deg) scale(${s * (1 + sq)}, ${s * (1 - sq)})`,
      opacity: o,
    });
    if (last) break;
  }
  return frames;
}

export function pickJiggVariant(def: JiggIconDef, variant: JiggVariant): JiggVariant {
  if (def.svg[variant]) return variant;
  return VARIANTS.find((v) => Boolean(def.svg[v])) ?? 'outline';
}

export function getScopedJiggMarkup(def: JiggIconDef, variant: JiggVariant, uid: string): string {
  const resolved = pickJiggVariant(def, variant);
  const markup = def.svg[resolved]?.markup ?? '';
  if (!uid) return markup;
  const prefix = `jigg-${def.id}-${resolved}`;
  return markup.replaceAll(`${prefix}-`, `${prefix}-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}-`);
}

export function playJiggAnimation(root: Element | null, def: JiggIconDef, variant: JiggVariant): () => void {
  if (!root || !def.motion) return () => {};
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  }
  running.get(root)?.();
  const layers = def.motion[materialOf(variant)] ?? def.motion.outline;
  if (!layers) return () => {};
  const baked = bakeJiggMotion(layers, def.motion.ms);
  const animations: Animation[] = [];
  root.querySelectorAll('[data-rig-layer]').forEach((el) => {
    if (typeof (el as HTMLElement).animate !== 'function') return;
    const idx = Number((el as HTMLElement).dataset.rigLayer);
    const frames = keyframesOfChannels(baked[idx] ?? {});
    if (frames) animations.push((el as HTMLElement).animate(frames, { duration: def.motion?.ms ?? 450 }));
  });
  if (!animations.length) return () => {};
  const halt = () => {
    if (running.get(root) !== halt) return;
    animations.forEach((a) => a.cancel());
    running.delete(root);
  };
  const tail = animations[animations.length - 1];
  if (tail) tail.onfinish = () => { if (running.get(root) === halt) running.delete(root); };
  running.set(root, halt);
  return halt;
}
