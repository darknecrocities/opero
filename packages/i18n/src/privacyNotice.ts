import type { FirstClassLocale } from '@opero/shared-types';

export interface PrivacyTextSegment {
  readonly text: string;
  readonly highlight?: boolean;
}

export interface PrivacyLawSection {
  readonly id: 'ph_dpa' | 'jp_appi';
  readonly title: string;
  readonly segments: readonly PrivacyTextSegment[];
}

export interface OnboardingPrivacyNotice {
  readonly heading: string;
  readonly textboxLabel: string;
  readonly sections: readonly PrivacyLawSection[];
  readonly acknowledgeLabel: string;
}

export const ONBOARDING_PRIVACY_NOTICES: Record<FirstClassLocale, OnboardingPrivacyNotice> = {
  'en-US': {
    heading: 'Data Privacy Notice',
    textboxLabel: 'Data Privacy Act and Japan APPI Notice',
    sections: [
      {
        id: 'ph_dpa',
        title: 'Data Privacy Act of 2012 (Republic Act No. 10173 — Philippines)',
        segments: [
          { text: 'In compliance with the ' },
          { text: 'Data Privacy Act of 2012 (Republic Act No. 10173)', highlight: true },
          { text: ', OPERO processes your workflow captures, OCR text, meeting transcripts, and profile details ' },
          { text: '100% local-first on your device', highlight: true },
          { text: ' following the principles of ' },
          { text: 'transparency, legitimate purpose, and proportionality', highlight: true },
          { text: '. You retain full data subject rights — including the ' },
          { text: 'right to inspect, export, or permanently erase', highlight: true },
          { text: ' all stored records from local SQLite memory at any time.' },
        ],
      },
      {
        id: 'jp_appi',
        title: 'Act on the Protection of Personal Information (APPI / 個人情報保護法 — Japan)',
        segments: [
          { text: 'In accordance with Japan’s ' },
          { text: 'Act on the Protection of Personal Information (APPI / 個人情報保護法, Act No. 57 of 2003)', highlight: true },
          { text: ', all personal and workplace data stays ' },
          { text: 'strictly on-device with zero external transmission', highlight: true },
          { text: ' or third-party provision. OPERO enforces ' },
          { text: 'Security Control Measures (安全管理措置)', highlight: true },
          { text: ': ' },
          { text: 'passwords and sensitive keystrokes are never captured by default', highlight: true },
          { text: ', and exported manuals support irreversible pixel redaction.' },
        ],
      },
    ],
    acknowledgeLabel:
      'I have read and agree to the Data Privacy Act (RA 10173) and Japan APPI notice.',
  },
  'ja-JP': {
    heading: '個人情報保護・プライバシーに関するご案内',
    textboxLabel: '個人情報保護法およびデータプライバシー法のご案内',
    sections: [
      {
        id: 'ph_dpa',
        title: 'フィリピン データプライバシー法（2012年共和国法第10173号 / RA 10173）',
        segments: [
          { text: 'フィリピンの' },
          { text: '2012年データプライバシー法（RA 10173）', highlight: true },
          { text: 'に基づき、OPEROは画面キャプチャ、OCRテキスト、会議文字起こし、プロフィール情報を' },
          { text: 'お客様の端末内のみで100%ローカル処理', highlight: true },
          { text: 'します。' },
          { text: '透明性・正当な目的・比例性', highlight: true },
          { text: 'の原則に従い、ユーザーはいつでもローカルSQLite内のデータを' },
          { text: '閲覧・エクスポート・完全削除する権利', highlight: true },
          { text: 'を有します。' },
        ],
      },
      {
        id: 'jp_appi',
        title: '日本の個人情報の保護に関する法律（個人情報保護法 / APPI・平成15年法律第57号）',
        segments: [
          { text: '日本の' },
          { text: '個人情報保護法（APPI・平成15年法律第57号）', highlight: true },
          { text: 'に準拠し、業務データおよび個人情報は' },
          { text: '外部サーバーや第三者へ一切送信されません', highlight: true },
          { text: '。OPEROは' },
          { text: '安全管理措置', highlight: true },
          { text: 'として、' },
          { text: 'パスワードや機密キー入力を標準で記録しない設計', highlight: true },
          { text: 'を採用し、出力時の不可逆マスキングに対応しています。' },
        ],
      },
    ],
    acknowledgeLabel:
      'データプライバシー法（RA 10173）および日本の個人情報保護法（APPI）の内容を確認し同意します。',
  },
  'fil-PH': {
    heading: 'Paunawa sa Data Privacy',
    textboxLabel: 'Paunawa sa Data Privacy Act at Japan APPI',
    sections: [
      {
        id: 'ph_dpa',
        title: 'Data Privacy Act of 2012 (Republic Act No. 10173 — Pilipinas)',
        segments: [
          { text: 'Bilang pagsunod sa ' },
          { text: 'Data Privacy Act of 2012 (Republic Act No. 10173)', highlight: true },
          { text: ', pinoproseso ng OPERO ang iyong workflow captures, OCR text, meeting transcripts, at profile ' },
          { text: 'nang 100% local-first sa iyong device', highlight: true },
          { text: ' alinsunod sa ' },
          { text: 'transparency, legitimate purpose, at proportionality', highlight: true },
          { text: '. Nasa iyo ang buong karapatan na ' },
          { text: 'suriin, i-export, o tuluyang burahin', highlight: true },
          { text: ' ang lahat ng naka-save na datos sa lokal na SQLite anumang oras.' },
        ],
      },
      {
        id: 'jp_appi',
        title: 'Act on the Protection of Personal Information (APPI / 個人情報保護法 — Japan)',
        segments: [
          { text: 'Alinsunod sa ' },
          { text: 'Act on the Protection of Personal Information ng Japan (APPI / 個人情報保護法, Act No. 57 of 2003)', highlight: true },
          { text: ', nananatili ang personal at pang-trabahong datos ' },
          { text: 'sa iyong device lamang nang walang external transmission', highlight: true },
          { text: ' sa mga third party. Ipinatutupad ng OPERO ang ' },
          { text: 'Security Control Measures (安全管理措置)', highlight: true },
          { text: ': ' },
          { text: 'hindi nire-record ang mga password at sensitibong keystroke bilang default', highlight: true },
          { text: ', at may permanenteng pixel redaction sa pag-export.' },
        ],
      },
    ],
    acknowledgeLabel:
      'Nabasa ko at sumasang-ayon ako sa Data Privacy Act (RA 10173) at Japan APPI notice.',
  },
};

export function getOnboardingPrivacyNotice(locale: FirstClassLocale): OnboardingPrivacyNotice {
  return ONBOARDING_PRIVACY_NOTICES[locale] ?? ONBOARDING_PRIVACY_NOTICES['en-US'];
}
