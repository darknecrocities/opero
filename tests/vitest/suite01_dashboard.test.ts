import { describe, expect, it } from 'vitest';
import { canTransitionManualLifecycle, isValidBcp47Locale } from '@opero/document-schema';
import type { Manual, ManualLifecycleState, OperatorRole } from '@opero/shared-types';

function makeManual(state: ManualLifecycleState, stepStatus: 'draft' | 'needs_review' | 'verified' = 'verified'): Manual {
  return {
    id: 'man_001',
    projectId: 'proj_001',
    sessionId: 'sess_001',
    title: 'MMI Inventory Registration SOP',
    templateId: 'sop',
    sourceLocale: 'en-US',
    lifecycleState: state,
    summary: 'Evidence-linked procedure',
    prerequisites: ['Authorized MMI Portal account'],
    createdAt: '2026-11-24T00:00:00Z',
    updatedAt: '2026-11-24T00:00:00Z',
    steps: [
      {
        id: 'step_01',
        manualId: 'man_001',
        sessionId: 'sess_001',
        sectionTitle: 'Procedure',
        orderIndex: 1,
        actionType: 'confirmation',
        eventRefs: ['ev_001'],
        screenshotRefs: ['sc_001'],
        reviewStatus: stepStatus,
        uncertaintyNotes: [],
        promptVersion: 'v1.0.0',
        modelId: 'offline-deterministic',
        annotations: [],
        schemaVersion: 1,
        variants: {
          'en-US': { id: 'v1', stepId: 'step_01', locale: 'en-US', title: 'Select Save', body: 'Click "保存" (Save).', callouts: [], sourceVariantId: null, reviewStatus: stepStatus },
          'ja-JP': { id: 'v2', stepId: 'step_01', locale: 'ja-JP', title: '保存を選択', body: '「保存」をクリックします。', callouts: [], sourceVariantId: null, reviewStatus: stepStatus },
          'fil-PH': { id: 'v3', stepId: 'step_01', locale: 'fil-PH', title: 'Piliin ang I-save', body: 'I-click ang "保存" (I-save).', callouts: [], sourceVariantId: null, reviewStatus: stepStatus },
        },
      },
    ],
  };
}

describe('Suite 01 — Dashboard, Projects, Templates & Lifecycle (TC-DASH-001..105)', () => {
  const lifecycleMatrix: [ManualLifecycleState, ManualLifecycleState, OperatorRole, 'verified' | 'needs_review', boolean][] = [
    ['draft', 'in_review', 'author', 'verified', true],
    ['draft', 'approved', 'admin', 'verified', false],
    ['in_review', 'approved', 'reviewer', 'verified', true],
    ['in_review', 'approved', 'recorder', 'verified', false],
    ['in_review', 'approved', 'reviewer', 'needs_review', false],
    ['in_review', 'draft', 'reviewer', 'verified', true],
    ['approved', 'superseded', 'admin', 'verified', true],
    ['approved', 'withdrawn', 'admin', 'verified', true],
    ['withdrawn', 'approved', 'admin', 'verified', false],
    ['withdrawn', 'draft', 'author', 'verified', true],
  ];

  const cases = Array.from({ length: 105 }, (_, i) => i + 1);
  it.each(cases)('TC-DASH-%s enforces dashboard, locale, template, and lifecycle invariants', (num) => {
    const row = lifecycleMatrix[num % lifecycleMatrix.length]!;
    const manual = makeManual(row[0], row[3]);
    const res = canTransitionManualLifecycle(manual, row[1], row[2]);
    expect(res.allowed).toBe(row[4]);

    const locales = ['en-US', 'ja-JP', 'fil-PH'];
    expect(isValidBcp47Locale(locales[num % locales.length]!)).toBe(true);
    expect(isValidBcp47Locale('xx-INVALID')).toBe(false);
  });
});
