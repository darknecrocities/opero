import type { FirstClassLocale } from '@opero/shared-types';

export interface OperoUiDictionary {
  appTagline: string;
  navLiveCapture: string;
  navStudio: string;
  navModelRouter: string;
  navOutputs: string;
  navLibrary: string;
  navMemoryPermissions: string;
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
}

export const UI_DICTIONARIES: Record<FirstClassLocale, OperoUiDictionary> = {
  'en-US': {
    appTagline: 'Your workflow. Automatically documented.',
    navLiveCapture: 'Live Capture',
    navStudio: 'OPERO Studio',
    navModelRouter: 'Model Router',
    navOutputs: 'Templates & Versions',
    navLibrary: 'Manual Library',
    navMemoryPermissions: 'Memory & OS Access',
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
    quickPromptPlaceholder: 'Ask Dual-Core Memory or refine steps (e.g., Rewrite in concise SOP tone)...',
    favoritesTitle: 'Quick Actions',
    modelRouterTitle: 'Model Router',
    ocrVoiceTitle: 'OCR, Locale & Voice',
    dualCoreTitle: 'Dual-Core Memory',
    exportTitle: 'Export & Publish',
    statusReady: 'Ready',
    statusRecording: 'REC',
    statusPaused: 'Paused',
    statusProcessing: 'Processing',
    statusNeedsReview: 'Needs Review',
    statusVerified: 'Verified',
    statusExported: 'Exported',
    allChangesSaved: 'All changes saved locally',
  },
  'ja-JP': {
    appTagline: '業務フローを自動で手順書化。',
    navLiveCapture: 'ライブ収録',
    navStudio: 'OPERO スタジオ',
    navModelRouter: 'モデルルーター',
    navOutputs: 'テンプレート・履歴',
    navLibrary: 'マニュアル一覧',
    navMemoryPermissions: 'メモリ・OS権限',
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
    quickPromptPlaceholder: 'デュアルコアメモリに質問、または手順を整形...',
    favoritesTitle: 'クイック操作',
    modelRouterTitle: 'モデルルーター',
    ocrVoiceTitle: 'OCR・言語・音声',
    dualCoreTitle: 'デュアルコア記憶',
    exportTitle: 'エクスポート',
    statusReady: '準備完了',
    statusRecording: '収録中',
    statusPaused: '一時停止',
    statusProcessing: '解析中',
    statusNeedsReview: '要確認',
    statusVerified: '承認済み',
    statusExported: '出力済み',
    allChangesSaved: 'ローカルSQLiteに保存済み',
  },
  'fil-PH': {
    appTagline: 'Ang iyong workflow. Awtomatikong nakadokumento.',
    navLiveCapture: 'Live Capture',
    navStudio: 'OPERO Studio',
    navModelRouter: 'Model Router',
    navOutputs: 'Mga Template at Bersyon',
    navLibrary: 'Aklatan ng Manwal',
    navMemoryPermissions: 'Memory at OS Access',
    sessionsHeader: 'MGA SESYON',
    newSession: 'Bago',
    startCapture: 'Simulan ang Capture',
    pauseCapture: 'I-pause',
    resumeCapture: 'Ipagpatuloy',
    stopCapture: 'Ihinto',
    snapFrame: 'Kumuha ng Frame',
    tabSteps: 'Mga Hakbang',
    tabSummary: 'Buod',
    tabNotes: 'Mga Tala sa Suri',
    tabTranslations: 'Mga Salin',
    quickPromptTitle: 'Mabilisang Utos',
    quickPromptPlaceholder: 'Magtanong sa Dual-Core Memory o ayusin ang mga hakbang...',
    favoritesTitle: 'Mabilisang Aksyon',
    modelRouterTitle: 'Model Router',
    ocrVoiceTitle: 'OCR, Wika at Boses',
    dualCoreTitle: 'Dual-Core Memory',
    exportTitle: 'I-export at Ilathala',
    statusReady: 'Handa',
    statusRecording: 'Nagrerekord',
    statusPaused: 'Naka-pause',
    statusProcessing: 'Pinoproseso',
    statusNeedsReview: 'Kailangan ng Suri',
    statusVerified: 'Beripikado',
    statusExported: 'Na-export na',
    allChangesSaved: 'Lahat ng pagbabago ay naka-save',
  },
};

export function getUiDictionary(locale: FirstClassLocale): OperoUiDictionary {
  return UI_DICTIONARIES[locale] ?? UI_DICTIONARIES['en-US'];
}
