export type PeroBoneId =
  | 'root'
  | 'head'
  | 'cap'
  | 'flipperLeft'
  | 'flipperRight'
  | 'lanyard'
  | 'tail'
  | 'footLeft'
  | 'footRight'
  | 'face'
  | 'prop';

export interface BoneConstraint {
  pivot: [number, number];
  tx: [number, number];
  ty: [number, number];
  rot: [number, number];
  scale: [number, number];
}

export interface BonePoseInput {
  tx: number;
  ty: number;
  rot: number;
  scale: number;
}

/**
 * [UI-006] Section 06 Constrained 11-Bone 4-DOF Rig Bounds (512x512 space).
 */
export const PERO_11_BONE_BOUNDS: Record<PeroBoneId, BoneConstraint> = {
  root: { pivot: [256, 464], tx: [-38, 38], ty: [-24, 22], rot: [-16, 16], scale: [0.85, 1.12] },
  head: { pivot: [256, 292], tx: [-12, 12], ty: [-10, 12], rot: [-22, 22], scale: [0.94, 1.07] },
  cap: { pivot: [256, 120], tx: [-9, 9], ty: [-12, 7], rot: [-22, 22], scale: [0.94, 1.07] },
  flipperLeft: { pivot: [162, 328], tx: [-10, 10], ty: [-12, 10], rot: [-52, 52], scale: [0.88, 1.12] },
  flipperRight: { pivot: [348, 328], tx: [-10, 10], ty: [-12, 10], rot: [-52, 52], scale: [0.88, 1.12] },
  lanyard: { pivot: [256, 322], tx: [-8, 8], ty: [-6, 8], rot: [-25, 25], scale: [0.90, 1.12] },
  tail: { pivot: [156, 412], tx: [-6, 6], ty: [-6, 6], rot: [-28, 28], scale: [0.88, 1.14] },
  footLeft: { pivot: [194, 460], tx: [-16, 16], ty: [-28, 10], rot: [-28, 28], scale: [0.92, 1.08] },
  footRight: { pivot: [324, 460], tx: [-16, 16], ty: [-28, 10], rot: [-28, 28], scale: [0.92, 1.08] },
  face: { pivot: [262, 232], tx: [-8, 8], ty: [-7, 7], rot: [-5, 5], scale: [0.82, 1.28] },
  prop: { pivot: [410, 210], tx: [-28, 28], ty: [-28, 28], rot: [-25, 25], scale: [0.75, 1.25] },
};

const clampRange = (v: number, [min, max]: [number, number]): number =>
  Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

export function clampPeroBonePose(bone: PeroBoneId, pose: BonePoseInput): BonePoseInput {
  const b = PERO_11_BONE_BOUNDS[bone];
  return {
    tx: clampRange(pose.tx, b.tx),
    ty: clampRange(pose.ty, b.ty),
    rot: clampRange(pose.rot, b.rot),
    scale: clampRange(pose.scale, b.scale),
  };
}
