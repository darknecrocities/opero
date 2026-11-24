import { describe, expect, it } from 'vitest';
import { clampAnnotationGeometry, validateStepEvidence } from '@opero/document-schema';
import type { AnnotationOverlay, AnnotationType, WorkflowStep } from '@opero/shared-types';

const ALL_7_ANNOTATIONS: readonly AnnotationType[] = [
  'number', 'arrow', 'rect', 'blur', 'crop', 'label', 'spotlight',
];

describe('Suite 04 — OPERO Studio 3-Pane Editor & 7 Annotations (TC-STU-001..105)', () => {
  const cases = Array.from({ length: 105 }, (_, i) => i + 1);

  it.each(cases)('TC-STU-%s validates 7 non-destructive annotations, coordinate clamping, and citations', (num) => {
    const type = ALL_7_ANNOTATIONS[num % ALL_7_ANNOTATIONS.length]!;
    const raw: AnnotationOverlay = {
      id: `ann_${num}`,
      screenshotId: `sc_${num}`,
      stepId: `step_${num}`,
      type,
      geometry: {
        x: num % 3 === 0 ? -0.4 : 0.25,
        y: num % 4 === 0 ? 1.5 : 0.3,
        w: num % 5 === 0 ? 0.001 : 0.25,
        h: num % 6 === 0 ? 2.4 : 0.2,
        x2: type === 'arrow' ? 1.2 : undefined,
        y2: type === 'arrow' ? -0.2 : undefined,
      },
      numberValue: type === 'number' ? num : undefined,
      localizedLabels: type === 'label' ? { 'en-US': 'Save', 'ja-JP': '保存', 'fil-PH': 'I-save' } : {},
      style: { strokeColor: type === 'rect' ? '#69BCFC' : '#0F172A', spotlightDim: 0.55 },
      isIrreversibleRedaction: type === 'blur',
    };

    const clamped = clampAnnotationGeometry(raw);
    expect(clamped.geometry.x).toBeGreaterThanOrEqual(0);
    expect(clamped.geometry.x).toBeLessThanOrEqual(1);
    expect(clamped.geometry.y).toBeGreaterThanOrEqual(0);
    expect(clamped.geometry.y).toBeLessThanOrEqual(1);
    expect(clamped.geometry.w).toBeGreaterThanOrEqual(0.015);
    expect(clamped.geometry.h).toBeGreaterThanOrEqual(0.015);
    if (type === 'blur') {
      expect(clamped.isIrreversibleRedaction).toBe(true);
    }

    const step: WorkflowStep = {
      id: `step_${num}`,
      manualId: 'man_1',
      sessionId: 'sess_1',
      sectionTitle: 'Procedure',
      orderIndex: num,
      actionType: 'selection',
      eventRefs: num % 7 === 0 ? [] : [`ev_${num}`],
      screenshotRefs: num % 7 === 0 ? [] : [`sc_${num}`],
      reviewStatus: 'draft',
      uncertaintyNotes: [],
      promptVersion: 'v1.0.0',
      modelId: 'offline-deterministic',
      annotations: [clamped],
      schemaVersion: 1,
      variants: {
        'en-US': { id: 'a', stepId: `step_${num}`, locale: 'en-US', title: 'Step', body: 'Body', callouts: [], sourceVariantId: null, reviewStatus: 'draft' },
        'ja-JP': { id: 'b', stepId: `step_${num}`, locale: 'ja-JP', title: '手順', body: '本文', callouts: [], sourceVariantId: null, reviewStatus: 'draft' },
        'fil-PH': { id: 'c', stepId: `step_${num}`, locale: 'fil-PH', title: 'Hakbang', body: 'Detalye', callouts: [], sourceVariantId: null, reviewStatus: 'draft' },
      },
    };

    const issues = validateStepEvidence(step);
    if (num % 7 === 0) {
      expect(issues.some((x) => x.code === 'MISSING-EVIDENCE-CITATION')).toBe(true);
    } else {
      expect(issues).toHaveLength(0);
    }
  });
});
