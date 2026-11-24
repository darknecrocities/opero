import type { AnnotationOverlay, Bcp47Locale, FirstClassLocale, GlossaryTerm, WorkflowStep } from '@opero/shared-types';

export const SUPPORTED_BCP47_LOCALES: readonly Bcp47Locale[] = [
  'en', 'en-US', 'en-GB', 'ja-JP', 'fil', 'fil-PH', 'zh-Hans', 'ko-KR', 'id-ID',
];

export const FIRST_CLASS_LOCALES: readonly FirstClassLocale[] = ['en-US', 'ja-JP', 'fil-PH'];

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  stepId?: string;
  message: string;
}

export function isValidBcp47Locale(tag: string): tag is Bcp47Locale {
  return (SUPPORTED_BCP47_LOCALES as readonly string[]).includes(tag);
}

export function validateStepEvidence(
  step: WorkflowStep,
  knownEventIds?: ReadonlySet<string>,
  knownScreenshotIds?: ReadonlySet<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (step.eventRefs.length === 0 && step.screenshotRefs.length === 0) {
    issues.push({
      code: 'MISSING-EVIDENCE-CITATION',
      severity: 'error',
      stepId: step.id,
      message: 'Every generated step must cite at least one event_ref or screenshot_ref ([DATA-003]).',
    });
  }
  if (knownEventIds) {
    for (const ref of step.eventRefs) {
      if (!knownEventIds.has(ref)) {
        issues.push({
          code: 'INVALID-EVENT-REF',
          severity: 'error',
          stepId: step.id,
          message: `Unverified event citation "${ref}" not found in session manifest.`,
        });
      }
    }
  }
  if (knownScreenshotIds) {
    for (const ref of step.screenshotRefs) {
      if (!knownScreenshotIds.has(ref)) {
        issues.push({
          code: 'INVALID-SCREENSHOT-REF',
          severity: 'error',
          stepId: step.id,
          message: `Unverified screenshot citation "${ref}" not found in session manifest.`,
        });
      }
    }
  }
  return issues;
}

export function clampAnnotationGeometry(overlay: AnnotationOverlay): AnnotationOverlay {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  const x = clamp01(overlay.geometry.x);
  const y = clamp01(overlay.geometry.y);
  const w = Math.max(0.015, Math.min(1 - x, clamp01(overlay.geometry.w)));
  const h = Math.max(0.015, Math.min(1 - y, clamp01(overlay.geometry.h)));
  return {
    ...overlay,
    geometry: {
      ...overlay.geometry,
      x,
      y,
      w,
      h,
      x2: overlay.geometry.x2 !== undefined ? clamp01(overlay.geometry.x2) : undefined,
      y2: overlay.geometry.y2 !== undefined ? clamp01(overlay.geometry.y2) : undefined,
    },
  };
}

export function validateTranslationQa(
  sourceText: string,
  targetText: string,
  locale: FirstClassLocale,
  glossary: readonly GlossaryTerm[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const placeholders = sourceText.match(/\{[a-zA-Z0-9_]+\}|%[sd]/g) ?? [];
  for (const ph of placeholders) {
    if (!targetText.includes(ph)) {
      issues.push({ code: 'MISSING-PLACEHOLDER', severity: 'error', message: `Missing placeholder ${ph}` });
    }
  }
  const urls = sourceText.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  for (const u of urls) {
    if (!targetText.includes(u)) {
      issues.push({ code: 'MUTATED-URL', severity: 'error', message: `URL changed or omitted: ${u}` });
    }
  }
  const numbers = sourceText.match(/\b\d{2,}\b/g) ?? [];
  for (const n of numbers) {
    if (!targetText.includes(n)) {
      issues.push({ code: 'MUTATED-NUMBER', severity: 'warning', message: `Numeric token ${n} missing in target.` });
    }
  }
  for (const term of glossary.filter((g) => g.locale === locale)) {
    for (const forbidden of term.forbiddenVariants) {
      if (forbidden && targetText.toLowerCase().includes(forbidden.toLowerCase())) {
        issues.push({
          code: 'GLOSSARY-FORBIDDEN-VARIANT',
          severity: 'error',
          message: `Forbidden term "${forbidden}" detected; use "${term.preferredTerm}" for "${term.sourceTerm}".`,
        });
      }
    }
  }
  return issues;
}
