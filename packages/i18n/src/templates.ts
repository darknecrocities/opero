import type { FirstClassLocale } from '@opero/shared-types';

export interface MmiTemplateDefinition {
  id:
    | 'sop'
    | 'user_guide'
    | 'internal_system'
    | 'onboarding'
    | 'troubleshooting'
    | 'technical'
    | 'administrative';
  code: string;
  icon: string;
  name: Record<FirstClassLocale, string>;
  description: Record<FirstClassLocale, string>;
  sections: Record<FirstClassLocale, string[]>;
}

export const MMI_DOCUMENT_TEMPLATES: MmiTemplateDefinition[] = [
  {
    id: 'sop',
    code: 'SOP',
    icon: 'file',
    name: {
      'en-US': 'Standard Operating Procedure',
      'ja-JP': '標準作業手順書 (SOP)',
      'fil-PH': 'Standard Operating Procedure',
    },
    description: {
      'en-US': 'Repeatable operational steps with prerequisites and sign-off.',
      'ja-JP': '前提条件と承認ゲートを備えた標準業務手順です。',
      'fil-PH': 'Mga hakbang sa operasyon na may mga kinakailangan at pagsusuri.',
    },
    sections: {
      'en-US': ['Purpose & Prerequisites', 'Standard Operating Procedure'],
      'ja-JP': ['目的と前提条件', '標準作業手順'],
      'fil-PH': ['Layunin at Mga Kinakailangan', 'Karaniwang Pamamaraan (SOP)'],
    },
  },
  {
    id: 'user_guide',
    code: 'GUIDE',
    icon: 'book',
    name: {
      'en-US': 'Software User Guide',
      'ja-JP': 'ソフトウェア操作ガイド',
      'fil-PH': 'Gabay sa Gumagamit ng Software',
    },
    description: {
      'en-US': 'Clear interface walkthroughs for everyday application users.',
      'ja-JP': '日常業務の画面操作を分かりやすく整理したガイドです。',
      'fil-PH': 'Malinaw na gabay sa araw-araw na paggamit ng aplikasyon.',
    },
    sections: {
      'en-US': ['Overview & Workspace Navigation', 'Core Task Walkthrough'],
      'ja-JP': ['概要と画面構成', '基本操作の手順'],
      'fil-PH': ['Pangkalahatang-ideya at Nabigasyon', 'Pangunahing Hakbang'],
    },
  },
  {
    id: 'internal_system',
    code: 'SYS',
    icon: 'shield',
    name: {
      'en-US': 'Internal System Instructions',
      'ja-JP': '社内システム運用手順',
      'fil-PH': 'Mga Tagubilin sa Panloob na Sistema',
    },
    description: {
      'en-US': 'Role-gated corporate system operations with audit checks.',
      'ja-JP': '権限管理と監査確認を含む社内システム運用手順です。',
      'fil-PH': 'Operasyon ng panloob na sistema na may seguridad at audit.',
    },
    sections: {
      'en-US': ['System Access & Security', 'Operational Execution & Audit'],
      'ja-JP': ['システム接続とセキュリティ', '業務処理と監査ログ確認'],
      'fil-PH': ['Access at Seguridad ng Sistema', 'Operasyon at Audit'],
    },
  },
  {
    id: 'onboarding',
    code: 'NEW',
    icon: 'user',
    name: {
      'en-US': 'Employee Onboarding Guide',
      'ja-JP': '新入社員オンボーディング',
      'fil-PH': 'Gabay sa Onboarding ng Empleyado',
    },
    description: {
      'en-US': 'Day-one workstation setup and mentored starter workflows.',
      'ja-JP': '初日の端末設定からメンター伴走の初回業務までをご案内します。',
      'fil-PH': 'Pag-setup sa unang araw at unang gabay na workflow.',
    },
    sections: {
      'en-US': ['Day-1 Environment Setup', 'First Guided Workflow'],
      'ja-JP': ['初日セットアップ', '初回業務ワークフロー'],
      'fil-PH': ['Pag-setup sa Unang Araw', 'Unang Gabay na Workflow'],
    },
  },
  {
    id: 'troubleshooting',
    code: 'FIX',
    icon: 'wrench',
    name: {
      'en-US': 'Troubleshooting Guide',
      'ja-JP': 'トラブルシューティング',
      'fil-PH': 'Gabay sa Pag-aayos ng Problema',
    },
    description: {
      'en-US': 'Symptom triage, root-cause checks, and verified rollback.',
      'ja-JP': '発生事象の一次切り分けから復旧・ロールバック手順までを整理します。',
      'fil-PH': 'Pagsusuri ng sintomas, solusyon, at beripikadong pagbabalik.',
    },
    sections: {
      'en-US': ['Observed Symptom & Triage', 'Resolution & Rollback'],
      'ja-JP': ['発生事象と一次切り分け', '復旧手順とロールバック'],
      'fil-PH': ['Sintomas at Pagsusuri', 'Solusyon at Pagbabalik'],
    },
  },
  {
    id: 'technical',
    code: 'TECH',
    icon: 'cpu',
    name: {
      'en-US': 'Technical Procedure',
      'ja-JP': '技術手順書',
      'fil-PH': 'Teknikal na Pamamaraan',
    },
    description: {
      'en-US': 'Deterministic engineering runbooks with backup verification.',
      'ja-JP': '環境条件とバックアップ検証を含むエンジニアリング手順です。',
      'fil-PH': 'Teknikal na pamamaraan na may beripikasyon at backup.',
    },
    sections: {
      'en-US': ['Environment & Preconditions', 'Execution & Validation'],
      'ja-JP': ['実行環境と前提条件', '実行と検証'],
      'fil-PH': ['Kapaligiran at Kinakailangan', 'Pagpapatupad at Beripikasyon'],
    },
  },
  {
    id: 'administrative',
    code: 'ADMIN',
    icon: 'briefcase',
    name: {
      'en-US': 'Administrative Workflow',
      'ja-JP': '事務・管理ワークフロー',
      'fil-PH': 'Administratibong Workflow',
    },
    description: {
      'en-US': 'Policy approvals, form filing, and compliant retention.',
      'ja-JP': '承認確認・申請登録・規程に基づく保管手順を標準化します。',
      'fil-PH': 'Pag-apruba ng patakaran, paghahain, at maayos na pag-iingat.',
    },
    sections: {
      'en-US': ['Policy & Approval Check', 'Form Filing & Retention'],
      'ja-JP': ['規程・承認要件の確認', '申請登録と保管'],
      'fil-PH': ['Patakaran at Pag-apruba', 'Paghahain at Pag-iingat'],
    },
  },
];
