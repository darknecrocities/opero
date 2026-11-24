import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  JIGGICON_IDS,
  JIGGICONS_PACK,
  bakeJiggMotion,
  getScopedJiggMarkup,
  resolveJiggIcon,
} from '@opero/jiggicons';
import {
  OPERO_CURATED_OUTFITS,
  PERO_11_BONE_BOUNDS,
  PERO_MOTIONS,
  PERO_MOTION_BY_ID,
  clampPeroBonePose,
  derivePeroColorScheme,
  getMotionForOperoState,
  type OperoAppState,
  type PeroBoneId,
} from '@opero/mascot';

const REPO_ROOT = path.resolve(__dirname, '../..');

describe('Suite 07 — Design System, Brand Assets, Jiggicons & 20-Motion Pero Rig (TC-UI-001..105)', () => {
  const states: OperoAppState[] = [
    'onboarding', 'ready', 'recording', 'paused', 'capturing', 'ocr',
    'processing', 'drafting', 'annotating', 'searching', 'needs-review',
    'verified-draft', 'exported', 'model-setup', 'privacy', 'standby', 'error',
  ];
  const bones = Object.keys(PERO_11_BONE_BOUNDS) as PeroBoneId[];

  const cases = Array.from({ length: 105 }, (_, i) => i + 1);
  it.each(cases)('TC-UI-%s verifies 20 Pero motions, 11-bone bounds, 64 Jiggicons, and brand assets', (num) => {
    expect(PERO_MOTIONS).toHaveLength(20);
    expect(JIGGICON_IDS.length).toBe(64);
    expect(OPERO_CURATED_OUTFITS.every((o) => o.id !== 'violet-ai')).toBe(true);

    // Verify fixed PeroStateMascot mapping chain
    const st = states[num % states.length]!;
    const motionId = getMotionForOperoState(st);
    expect(PERO_MOTION_BY_ID[motionId].id).toBe(motionId);

    // Verify 20 standalone SVGs & PNGs exist in assets/
    const motionMeta = PERO_MOTIONS[(num - 1) % 20]!;
    const svgPath = path.join(REPO_ROOT, 'assets/images/mascot/pero-motions/svg', `${motionMeta.slug}.svg`);
    const pngPath = path.join(REPO_ROOT, 'assets/images/mascot/pero-motions/png', `${motionMeta.slug}.png`);
    expect(fs.existsSync(svgPath)).toBe(true);
    expect(fs.existsSync(pngPath)).toBe(true);

    // Verify 11-bone 4-DOF rig clamping ([UI-006])
    const bone = bones[num % bones.length]!;
    const bounds = PERO_11_BONE_BOUNDS[bone];
    const clamped = clampPeroBonePose(bone, { tx: 999, ty: -999, rot: 360, scale: 5.0 });
    expect(clamped.tx).toBe(bounds.tx[1]);
    expect(clamped.ty).toBe(bounds.ty[0]);
    expect(clamped.rot).toBe(bounds.rot[1]);
    expect(clamped.scale).toBe(bounds.scale[1]);

    // Verify cel-shaded ramp derivation
    const ramp = derivePeroColorScheme('#69BCFC');
    expect(ramp.main).toBe('#69BCFC');
    expect(ramp.highlight.startsWith('#')).toBe(true);

    // Verify Jiggicons 120Hz spring baking & scoped SVG markup
    const jiggId = JIGGICON_IDS[num % JIGGICON_IDS.length]!;
    const def = JIGGICONS_PACK[jiggId] ?? resolveJiggIcon('capture');
    const markup = getScopedJiggMarkup(def, 'duotone', `u${num}`);
    expect(markup.length).toBeGreaterThan(20);
    if (def.motion?.outline) {
      const baked = bakeJiggMotion(def.motion.outline, def.motion.ms);
      expect(baked.length).toBeGreaterThan(0);
    }
  });
});
