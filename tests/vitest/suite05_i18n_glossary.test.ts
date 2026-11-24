import { describe, expect, it } from 'vitest';
import { validateTranslationQa } from '@opero/document-schema';
import {
  getOnboardingPrivacyNotice,
  LOCALE_MODEL_MAP,
  MMI_DEFAULT_GLOSSARY,
  UI_DICTIONARIES,
} from '@opero/i18n';

describe('Suite 05 — First-Class Multilingual (en-US/ja-JP/fil-PH) & Glossary QA (TC-I18N-001..105)', () => {
  const enKeys = Object.keys(UI_DICTIONARIES['en-US']).sort();
  const jaKeys = Object.keys(UI_DICTIONARIES['ja-JP']).sort();
  const filKeys = Object.keys(UI_DICTIONARIES['fil-PH']).sort();

  const cases = Array.from({ length: 105 }, (_, i) => i + 1);
  it.each(cases)('TC-I18N-%s enforces BCP-47 key parity, fil vs tl boundary, and glossary QA', (num) => {
    expect(jaKeys).toEqual(enKeys);
    expect(filKeys).toEqual(enKeys);

    // [DATA-002] Product locale is explicitly fil-PH ("Filipino"), mapped to tl only at adapter boundary
    expect(LOCALE_MODEL_MAP['fil-PH'].productLocale).toBe('fil-PH');
    expect(LOCALE_MODEL_MAP['fil-PH'].displayLabel).toContain('Filipino');
    expect(LOCALE_MODEL_MAP['fil-PH'].externalMtAdapterCode).toBe('tl');

    if (num % 3 === 0) {
      const badFil = validateTranslationQa(
        'Save {item_code} at https://portal.mmi.local/po with code 409',
        'Iligtas ang item sa https://portal.mmi.local/po',
        'fil-PH',
        MMI_DEFAULT_GLOSSARY,
      );
      expect(badFil.some((i) => i.code === 'GLOSSARY-FORBIDDEN-VARIANT')).toBe(true);
      expect(badFil.some((i) => i.code === 'MISSING-PLACEHOLDER')).toBe(true);
    } else {
      const cleanFil = validateTranslationQa(
        'Save {item_code} at https://portal.mmi.local/po with code 409',
        'I-save ang {item_code} sa https://portal.mmi.local/po gamit ang code 409',
        'fil-PH',
        MMI_DEFAULT_GLOSSARY,
      );
      expect(cleanFil).toHaveLength(0);
    }
  });

  it('provides trilingual Data Privacy Act (RA 10173) & Japan APPI onboarding notices with highlights', () => {
    for (const locale of ['en-US', 'ja-JP', 'fil-PH'] as const) {
      const notice = getOnboardingPrivacyNotice(locale);
      expect(notice.heading.length).toBeGreaterThan(4);
      expect(notice.sections).toHaveLength(2);
      expect(notice.sections[0]?.id).toBe('ph_dpa');
      expect(notice.sections[1]?.id).toBe('jp_appi');
      for (const section of notice.sections) {
        const highlighted = section.segments.filter((seg) => seg.highlight);
        expect(highlighted.length).toBeGreaterThanOrEqual(3);
      }
      const fullText = notice.sections
        .map((s) => `${s.title} ${s.segments.map((seg) => seg.text).join('')}`)
        .join(' ');
      expect(fullText).toMatch(/10173/);
      expect(fullText).toMatch(/APPI|個人情報保護法/);
    }
  });
});
