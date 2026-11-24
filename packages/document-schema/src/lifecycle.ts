import type { Manual, ManualLifecycleState, OperatorRole } from '@opero/shared-types';

const ALLOWED_TRANSITIONS: Record<ManualLifecycleState, readonly ManualLifecycleState[]> = {
  draft: ['in_review', 'withdrawn'],
  in_review: ['approved', 'draft', 'withdrawn'],
  approved: ['superseded', 'withdrawn'],
  superseded: ['withdrawn'],
  withdrawn: ['draft'],
};

export interface TransitionCheckResult {
  allowed: boolean;
  reason?: string;
}

export function canTransitionManualLifecycle(
  manual: Manual,
  target: ManualLifecycleState,
  role: OperatorRole,
): TransitionCheckResult {
  if (!ALLOWED_TRANSITIONS[manual.lifecycleState].includes(target)) {
    return {
      allowed: false,
      reason: `Illegal lifecycle transition from ${manual.lifecycleState} to ${target}.`,
    };
  }
  if (target === 'in_review' && manual.steps.length === 0) {
    return { allowed: false, reason: 'Manual must contain at least one step before review.' };
  }
  if (target === 'approved') {
    if (role !== 'reviewer' && role !== 'admin') {
      return { allowed: false, reason: 'Only Reviewer or Admin roles may approve publication.' };
    }
    const unverified = manual.steps.filter((s) => s.reviewStatus !== 'verified');
    if (unverified.length > 0) {
      return {
        allowed: false,
        reason: `Cannot approve manual: ${unverified.length} step(s) require human verification (${unverified.map((s) => s.id).join(', ')}).`,
      };
    }
  }
  return { allowed: true };
}
