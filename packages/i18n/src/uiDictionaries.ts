import type { FirstClassLocale, OperoPersonality } from '@opero/shared-types';

export interface OperoUiDictionary {
  appTagline: string;
  navDashboard: string;
  navLiveCapture: string;
  navStudio: string;
  navTemplates: string;
  navAnalyzer: string;
  navSettings: string;
  sessionsHeader: string;
  newSession: string;
  startCapture: string;
  pauseCapture: string;
  resumeCapture: string;
  stopCapture: string;
  snapFrame: string;
  tabSteps: string;
  tabSummary: string;
  tabNotes: string;
  tabTranslations: string;
  quickPromptTitle: string;
  quickPromptPlaceholder: string;
  favoritesTitle: string;
  modelRouterTitle: string;
  ocrVoiceTitle: string;
  dualCoreTitle: string;
  exportTitle: string;
  statusReady: string;
  statusRecording: string;
  statusPaused: string;
  statusProcessing: string;
  statusNeedsReview: string;
  statusVerified: string;
  statusExported: string;
  allChangesSaved: string;
  welcomeSubtitle: string;
  welcomeGetStarted: string;
  onboardingNameTitle: string;
  onboardingNamePlaceholder: string;
  onboardingOccupationTitle: string;
  onboardingOccupationPlaceholder: string;
  onboardingPersonalityTitle: string;
  onboardingLanguageTitle: string;
  onboardingModelTitle: string;
  onboardingModelSubtitle: string;
  onboardingModelRecommended: string;
  onboardingModelOffline: string;
  onboardingBack: string;
  onboardingContinue: string;
  onboardingFinish: string;
  dashboardSubtitle: string;
  analyticsBlackTitle: string;
  analyticsBlackSub: string;
  analyticsWhiteTitle: string;
  analyticsWhiteSub: string;
  analyticsSessionsLabel: string;
  analyticsCompletedLabel: string;
  analyticsTalkingLabel: string;
  analyticsStepsLabel: string;
  templatesHeading: string;
  templatesCreateManual: string;
  settingsHeading: string;
  settingsTabProfile: string;
  settingsTabLanguage: string;
  settingsTabMemory: string;
  settingsTabHistory: string;
  settingsTabPrivacy: string;
  settingsTabSound: string;
  settingsReplayWelcome: string;
  settingsSaveProfile: string;
}

export const UI_DICTIONARIES: Record<FirstClassLocale, OperoUiDictionary> = {
  'en-US': {
    appTagline: 'Your workflow. Automatically documented.',
    navDashboard: 'Dashboard',
    navLiveCapture: 'Live Capture',
    navStudio: 'OPERO Studio',
    navTemplates: 'Templates',
    navAnalyzer: 'Document Analyzer',
    navSettings: 'Settings',
    sessionsHeader: 'SESSIONS',
    newSession: 'New',
    startCapture: 'Start Capture',
    pauseCapture: 'Pause',
    resumeCapture: 'Resume',
    stopCapture: 'Stop',
    snapFrame: 'Snap Frame',
    tabSteps: 'Steps',
    tabSummary: 'Summary',
    tabNotes: 'Review Notes',
    tabTranslations: 'Translations',
    quickPromptTitle: 'Quick Prompt',
    quickPromptPlaceholder: 'Ask Dual-Core Memory or refine steps...',
    favoritesTitle: 'Quick Actions',
    modelRouterTitle: 'Model Router',
    ocrVoiceTitle: 'Language & Voice',
    dualCoreTitle: 'Memory',
    exportTitle: 'Export',
    statusReady: 'Ready',
    statusRecording: 'REC',
    statusPaused: 'Paused',
    statusProcessing: 'Processing',
    statusNeedsReview: 'Needs Review',
    statusVerified: 'Verified',
    statusExported: 'Exported',
    allChangesSaved: 'Saved',
    welcomeSubtitle: 'Your local-first workflow companion.',
    welcomeGetStarted: 'Get Started',
    onboardingNameTitle: 'What should Opero call you?',
    onboardingNamePlaceholder: 'Enter your name',
    onboardingOccupationTitle: 'What is your role or occupation?',
    onboardingOccupationPlaceholder: 'e.g. Operations Analyst, Engineer',
    onboardingPersonalityTitle: 'Choose Opero’s preferred tone',
    onboardingLanguageTitle: 'Select your default language',
    onboardingModelTitle: 'Choose your local AI model',
    onboardingModelSubtitle: 'Select the on-device intelligence engine for workflow drafting and translation.',
    onboardingModelRecommended: 'Recommended for this PC',
    onboardingModelOffline: 'Built-In Offline · 0 GB download',
    onboardingBack: 'Back',
    onboardingContinue: 'Continue',
    onboardingFinish: 'Enter OPERO',
    dashboardSubtitle: 'Ready to document your next workflow.',
    analyticsBlackTitle: 'Sessions & Meetings',
    analyticsBlackSub: 'Recorded workflows & completed runs',
    analyticsWhiteTitle: 'Talking & Documented Steps',
    analyticsWhiteSub: 'Voice activity & captured actions',
    analyticsSessionsLabel: 'Sessions',
    analyticsCompletedLabel: 'Completed',
    analyticsTalkingLabel: 'Talking min',
    analyticsStepsLabel: 'Captured actions',
    templatesHeading: 'MMI Document Templates',
    templatesCreateManual: 'Create Manual',
    settingsHeading: 'Settings',
    settingsTabProfile: 'Profile',
    settingsTabLanguage: 'Language',
    settingsTabMemory: 'Memory',
    settingsTabHistory: 'History',
    settingsTabPrivacy: 'OS Access',
    settingsTabSound: 'Sound & Motion',
    settingsReplayWelcome: 'Replay Welcome',
    settingsSaveProfile: 'Save Profile',
  },
  'ja-JP': {
    appTagline: '業務フローを自動で手順書化します。',
    navDashboard: 'ダッシュボード',
    navLiveCapture: 'ライブ収録',
    navStudio: 'OPERO スタジオ',
    navTemplates: 'テンプレート',
    navAnalyzer: 'ドキュメント解析',
    navSettings: '設定',
    sessionsHeader: 'セッション',
    newSession: '新規',
    startCapture: '収録開始',
    pauseCapture: '一時停止',
    resumeCapture: '再開',
    stopCapture: '停止',
    snapFrame: '画面スナップ',
    tabSteps: '手順一覧',
    tabSummary: '要約・前提',
    tabNotes: 'レビューメモ',
    tabTranslations: '多言語翻訳',
    quickPromptTitle: 'クイックプロンプト',
    quickPromptPlaceholder: 'メモリへの質問や手順の整形を入力してください...',
    favoritesTitle: 'クイック操作',
    modelRouterTitle: 'モデルルーター',
    ocrVoiceTitle: '言語・音声',
    dualCoreTitle: 'メモリ',
    exportTitle: 'エクスポート',
    statusReady: '準備完了',
    statusRecording: '収録中',
    statusPaused: '一時停止',
    statusProcessing: '解析中',
    statusNeedsReview: '要確認',
    statusVerified: '承認済み',
    statusExported: '出力済み',
    allChangesSaved: '保存済み',
    welcomeSubtitle: 'ローカル完結の業務手順パートナーです。',
    welcomeGetStarted: 'はじめましょう',
    onboardingNameTitle: 'お名前を教えてください',
    onboardingNamePlaceholder: 'お名前を入力してください',
    onboardingOccupationTitle: '職種・担当業務を教えてください',
    onboardingOccupationPlaceholder: '例：運用担当、エンジニア',
    onboardingPersonalityTitle: 'Operoのスタイルをお選びください',
    onboardingLanguageTitle: '標準言語を選択してください',
    onboardingModelTitle: 'ローカルAIモデルをお選びください',
    onboardingModelSubtitle: 'ワークフローの自動文書化と翻訳を行う端末内AIモデルを選択してください。',
    onboardingModelRecommended: 'このPCに推奨',
    onboardingModelOffline: '内蔵オフライン・ダウンロード不要',
    onboardingBack: '戻る',
    onboardingContinue: '次へ進みます',
    onboardingFinish: 'OPEROをはじめます',
    dashboardSubtitle: '次の業務手順を記録する準備ができています。',
    analyticsBlackTitle: 'セッション・会議記録',
    analyticsBlackSub: '収録したワークフローと完了件数',
    analyticsWhiteTitle: '発話・手順アクティビティ',
    analyticsWhiteSub: '発話時間と記録済みステップ',
    analyticsSessionsLabel: 'セッション',
    analyticsCompletedLabel: '完了済み',
    analyticsTalkingLabel: '発話（分）',
    analyticsStepsLabel: '記録操作数',
    templatesHeading: 'MMI 標準テンプレート',
    templatesCreateManual: 'マニュアル作成',
    settingsHeading: '設定',
    settingsTabProfile: 'プロフィール',
    settingsTabLanguage: '言語',
    settingsTabMemory: 'メモリ',
    settingsTabHistory: '履歴',
    settingsTabPrivacy: 'OS権限',
    settingsTabSound: 'サウンド・演出',
    settingsReplayWelcome: 'ウェルカムを再表示',
    settingsSaveProfile: 'プロフィールを保存',
  },
  'fil-PH': {
    appTagline: 'Ang iyong workflow. Awtomatikong nakadokumento.',
    navDashboard: 'Dashboard',
    navLiveCapture: 'Live Capture',
    navStudio: 'OPERO Studio',
    navTemplates: 'Mga Template',
    navAnalyzer: 'Pagsusuri ng Dokumento',
    navSettings: 'Mga Setting',
    sessionsHeader: 'MGA SESYON',
    newSession: 'Bago',
    startCapture: 'Simulan',
    pauseCapture: 'I-pause',
    resumeCapture: 'Ipagpatuloy',
    stopCapture: 'Ihinto',
    snapFrame: 'Kumuha ng Frame',
    tabSteps: 'Mga Hakbang',
    tabSummary: 'Buod',
    tabNotes: 'Mga Tala',
    tabTranslations: 'Mga Salin',
    quickPromptTitle: 'Mabilisang Utos',
    quickPromptPlaceholder: 'Magtanong sa Memory o ayusin ang hakbang...',
    favoritesTitle: 'Mabilisang Aksyon',
    modelRouterTitle: 'Model Router',
    ocrVoiceTitle: 'Wika at Boses',
    dualCoreTitle: 'Memory',
    exportTitle: 'I-export',
    statusReady: 'Handa',
    statusRecording: 'Nagrerekord',
    statusPaused: 'Naka-pause',
    statusProcessing: 'Pinoproseso',
    statusNeedsReview: 'Kailangan ng Suri',
    statusVerified: 'Beripikado',
    statusExported: 'Na-export na',
    allChangesSaved: 'Naka-save',
    welcomeSubtitle: 'Ang iyong lokal na katuwang sa dokumentasyon.',
    welcomeGetStarted: 'Magsimula',
    onboardingNameTitle: 'Ano ang dapat itawag sa iyo ni Opero?',
    onboardingNamePlaceholder: 'Ilagay ang iyong pangalan',
    onboardingOccupationTitle: 'Ano ang iyong trabaho o tungkulin?',
    onboardingOccupationPlaceholder: 'hal. Operations Analyst, Engineer',
    onboardingPersonalityTitle: 'Piliin ang tono ni Opero',
    onboardingLanguageTitle: 'Piliin ang pangunahing wika',
    onboardingModelTitle: 'Piliin ang lokal na AI model',
    onboardingModelSubtitle: 'Piliin ang local AI engine para sa paggawa ng manual at pagsasalin.',
    onboardingModelRecommended: 'Inirerekomenda para sa PC na ito',
    onboardingModelOffline: 'Built-In Offline · Walang i-download',
    onboardingBack: 'Bumalik',
    onboardingContinue: 'Magpatuloy',
    onboardingFinish: 'Buksan ang OPERO',
    dashboardSubtitle: 'Handa nang idokumento ang susunod mong workflow.',
    analyticsBlackTitle: 'Mga Sesyon at Pulong',
    analyticsBlackSub: 'Naitalang workflow at natapos na sesyon',
    analyticsWhiteTitle: 'Pagsasalita at Mga Hakbang',
    analyticsWhiteSub: 'Oras ng pagsasalita at naitalang aksyon',
    analyticsSessionsLabel: 'Mga Sesyon',
    analyticsCompletedLabel: 'Natapos',
    analyticsTalkingLabel: 'Minuto ng usap',
    analyticsStepsLabel: 'Naitalang aksyon',
    templatesHeading: 'Mga Template ng MMI',
    templatesCreateManual: 'Gumawa ng Manwal',
    settingsHeading: 'Mga Setting',
    settingsTabProfile: 'Profile',
    settingsTabLanguage: 'Wika',
    settingsTabMemory: 'Memory',
    settingsTabHistory: 'Kasaysayan',
    settingsTabPrivacy: 'OS Access',
    settingsTabSound: 'Tunog at Galaw',
    settingsReplayWelcome: 'Ulitin ang Welcome',
    settingsSaveProfile: 'I-save ang Profile',
  },
};

export const PERSONALITY_OPTIONS: Array<{
  id: OperoPersonality;
  label: Record<FirstClassLocale, string>;
  hint: Record<FirstClassLocale, string>;
}> = [
  {
    id: 'calm_concise',
    label: { 'en-US': 'Calm & Concise', 'ja-JP': '簡潔・落ち着いた表現', 'fil-PH': 'Kalmado at Maikli' },
    hint: { 'en-US': 'Short, crisp steps with zero fluff.', 'ja-JP': '無駄のない簡潔な手順表現です。', 'fil-PH': 'Diretso at malinaw na mga hakbang.' },
  },
  {
    id: 'friendly_guide',
    label: { 'en-US': 'Friendly Guide', 'ja-JP': '親しみやすいガイド', 'fil-PH': 'Palakaibigang Gabay' },
    hint: { 'en-US': 'Warm, approachable onboarding tone.', 'ja-JP': '新人の方にも分かりやすい丁寧な案内です。', 'fil-PH': 'Magiliw at madaling sundan.' },
  },
  {
    id: 'technical_direct',
    label: { 'en-US': 'Technical & Direct', 'ja-JP': '技術的・ダイレクト', 'fil-PH': 'Teknikal at Diretso' },
    hint: { 'en-US': 'Command-focused engineering runbooks.', 'ja-JP': '正確なパラメータを重視した記述です。', 'fil-PH': 'Nakatuon sa eksaktong teknikal na detalye.' },
  },
  {
    id: 'formal_sop',
    label: { 'en-US': 'Formal MMI SOP', 'ja-JP': '公式SOP（敬語・標準）', 'fil-PH': 'Pormal na MMI SOP' },
    hint: { 'en-US': 'Audit-ready corporate compliance style.', 'ja-JP': '監査対応の公式業務マニュアル形式です。', 'fil-PH': 'Handa para sa opisyal na pagsusuri.' },
  },
];

export function getTimeOfDayGreeting(
  locale: FirstClassLocale,
  name: string,
  date: Date = new Date()
): { primary: string; secondaryJa: string } {
  const hour = date.getHours();
  const cleanName = name.trim();
  const period: 'morning' | 'afternoon' | 'evening' =
    hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';

  const jaBase =
    period === 'morning' ? 'おはようございます' : period === 'afternoon' ? 'こんにちは' : 'こんばんは';
  const secondaryJa = cleanName ? `${jaBase}、${cleanName}さん` : jaBase;

  if (locale === 'ja-JP') {
    return { primary: secondaryJa, secondaryJa };
  }
  if (locale === 'fil-PH') {
    const filBase =
      period === 'morning' ? 'Magandang umaga' : period === 'afternoon' ? 'Magandang hapon' : 'Magandang gabi';
    return { primary: cleanName ? `${filBase}, ${cleanName}` : filBase, secondaryJa };
  }
  const enBase =
    period === 'morning' ? 'Good morning' : period === 'afternoon' ? 'Good afternoon' : 'Good evening';
  return { primary: cleanName ? `${enBase}, ${cleanName}` : enBase, secondaryJa };
}

export function getUiDictionary(locale: FirstClassLocale): OperoUiDictionary {
  return UI_DICTIONARIES[locale] ?? UI_DICTIONARIES['en-US'];
}
