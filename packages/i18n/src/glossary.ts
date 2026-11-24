import type { FirstClassLocale, GlossaryTerm } from '@opero/shared-types';

export interface ModelLocaleMapping {
  productLocale: FirstClassLocale;
  displayLabel: string;
  paddleOcrCode: string;
  tesseractCode: string;
  whisperCode: string;
  externalMtAdapterCode: string;
  fontStack: string;
}

/**
 * [DATA-002] Explicit BCP-47 adapter boundary:
 * User-facing product UI ALWAYS labels Filipino as `fil-PH` ("Filipino").
 * Internal third-party model codes (e.g. `tl` for legacy ASR/MT) map ONLY at this boundary.
 */
export const LOCALE_MODEL_MAP: Record<FirstClassLocale, ModelLocaleMapping> = {
  'en-US': {
    productLocale: 'en-US',
    displayLabel: 'English (en-US)',
    paddleOcrCode: 'en',
    tesseractCode: 'eng',
    whisperCode: 'en',
    externalMtAdapterCode: 'en',
    fontStack: "'Inter', -apple-system, sans-serif",
  },
  'ja-JP': {
    productLocale: 'ja-JP',
    displayLabel: '日本語 (ja-JP)',
    paddleOcrCode: 'japan',
    tesseractCode: 'jpn',
    whisperCode: 'ja',
    externalMtAdapterCode: 'ja',
    fontStack: "'Inter', 'Noto Sans JP', sans-serif",
  },
  'fil-PH': {
    productLocale: 'fil-PH',
    displayLabel: 'Filipino (fil-PH)',
    paddleOcrCode: 'latin',
    tesseractCode: 'eng',
    whisperCode: 'tl',
    externalMtAdapterCode: 'tl',
    fontStack: "'Inter', 'Noto Sans JP', sans-serif",
  },
};

export const MMI_DEFAULT_GLOSSARY: readonly GlossaryTerm[] = [
  {
    id: 'gl-save-ja',
    sourceTerm: 'Save',
    locale: 'ja-JP',
    preferredTerm: '保存',
    forbiddenVariants: ['セーブ'],
    context: 'Preserve actual UI button label in quotes alongside procedural verb.',
    glossaryVersion: 1,
  },
  {
    id: 'gl-save-fil',
    sourceTerm: 'Save',
    locale: 'fil-PH',
    preferredTerm: 'I-save',
    forbiddenVariants: ['Iligtas'],
    context: 'MMI-approved operational Filipino verb for saving records.',
    glossaryVersion: 1,
  },
  {
    id: 'gl-dashboard-ja',
    sourceTerm: 'Dashboard',
    locale: 'ja-JP',
    preferredTerm: 'ダッシュボード',
    forbiddenVariants: [],
    context: 'Standard navigation label.',
    glossaryVersion: 1,
  },
  {
    id: 'gl-dashboard-fil',
    sourceTerm: 'Dashboard',
    locale: 'fil-PH',
    preferredTerm: 'Dashboard',
    forbiddenVariants: ['Pisara'],
    context: 'Keep English UI product label verbatim.',
    glossaryVersion: 1,
  },
  {
    id: 'gl-submit-ja',
    sourceTerm: 'Submit',
    locale: 'ja-JP',
    preferredTerm: '送信',
    forbiddenVariants: [],
    context: 'Form submission action verb.',
    glossaryVersion: 1,
  },
  {
    id: 'gl-submit-fil',
    sourceTerm: 'Submit',
    locale: 'fil-PH',
    preferredTerm: 'Isumite',
    forbiddenVariants: ['Ipasa na lang'],
    context: 'Formal procedural action verb.',
    glossaryVersion: 1,
  },
  {
    id: 'gl-record-fil',
    sourceTerm: 'Record',
    locale: 'fil-PH',
    preferredTerm: 'I-record',
    forbiddenVariants: [],
    context: 'Use I-record for workflow recording; Itala for database ledger entry.',
    glossaryVersion: 1,
  },
];
