import type { FirstClassLocale } from '@opero/shared-types';

export interface FeatureUiStrings {
  navMeetings: string;
  navAgent: string;
  hideNav: string;
  showNav: string;
  hideRail: string;
  showRail: string;
  glassMode: string;
  solidMode: string;
  aiModelTitle: string;
  allModelsBtn: string;
  manualLanguageLabel: string;
  appLanguageLabel: string;
  voiceLabel: string;
  micOn: string;
  micOff: string;
  manageBtn: string;
  analyzerTitle: string;
  analyzerSubtitle: string;
  analyzerUploadBtn: string;
  analyzerEmptyTitle: string;
  analyzerEmptyBody: string;
  analyzerToolInspect: string;
  analyzerToolBox: string;
  analyzerToolArrow: string;
  analyzerToolCrop: string;
  analyzerTabSummary: string;
  analyzerTabAnnotations: string;
  analyzerTabReport: string;
  analyzerKeyFindings: string;
  analyzerReasoning: string;
  analyzerSuggestion: string;
  analyzerRemove: string;
  analyzerOpenStudio: string;
  analyzerCompleteSuffix: string;
  meetingsTitle: string;
  meetingsSubtitle: string;
  meetingsRecordBtn: string;
  meetingsStopCompileBtn: string;
  meetingsSourceLabel: string;
  meetingsSourceBoth: string;
  meetingsSourceMic: string;
  meetingsSourceSystem: string;
  meetingsSpokenLabel: string;
  meetingsTranslateToLabel: string;
  meetingsTabScript: string;
  meetingsTabSummary: string;
  meetingsTabActions: string;
  meetingsTabExport: string;
  meetingsEmptyTitle: string;
  meetingsEmptyBody: string;
  meetingsCompilingTitle: string;
  meetingsCompilingStep1: string;
  meetingsCompilingStep2: string;
  meetingsCompilingStep3: string;
  meetingsImportSampleBtn: string;
  agentTitle: string;
  agentSubtitle: string;
  agentInputPlaceholder: string;
  agentSendBtn: string;
  agentNewChatBtn: string;
  agentToolsUsed: string;
  agentStarter1: string;
  agentStarter2: string;
  agentStarter3: string;
}

export const FEATURE_UI_STRINGS: Record<FirstClassLocale, FeatureUiStrings> = {
  'en-US': {
    navMeetings: 'Meeting Notes',
    navAgent: 'Pero Agent',
    hideNav: 'Hide Nav',
    showNav: 'Show Nav',
    hideRail: 'Hide Rail',
    showRail: 'Show Rail',
    glassMode: 'Glass',
    solidMode: 'Solid',
    aiModelTitle: 'AI Model',
    allModelsBtn: 'All Models',
    manualLanguageLabel: 'Document Language',
    appLanguageLabel: 'App Language',
    voiceLabel: 'Voice',
    micOn: 'Mic: ON',
    micOff: 'Mic: OFF',
    manageBtn: 'Manage',
    analyzerTitle: 'Document Analyzer',
    analyzerSubtitle: 'Analyze PDF, Word, Markdown, or text files with Box, Arrow, and Crop explanations.',
    analyzerUploadBtn: 'Upload Document',
    analyzerEmptyTitle: 'Upload a document to summarize, annotate, and export',
    analyzerEmptyBody: 'Supports PDF, Word (.docx / .doc), Markdown, and plain text. Local-first analysis with manual or automatic annotations.',
    analyzerToolInspect: 'Inspect',
    analyzerToolBox: 'Box',
    analyzerToolArrow: 'Arrow',
    analyzerToolCrop: 'Crop',
    analyzerTabSummary: 'Summary',
    analyzerTabAnnotations: 'Annotations',
    analyzerTabReport: 'Full Report',
    analyzerKeyFindings: 'Key Findings',
    analyzerReasoning: 'Reasoning',
    analyzerSuggestion: 'Suggestion',
    analyzerRemove: 'Remove',
    analyzerOpenStudio: 'Open Full Report in Studio',
    analyzerCompleteSuffix: 'complete',
    meetingsTitle: 'Meeting Notes',
    meetingsSubtitle: 'Record OS-level system audio & microphone across any app, transcribe, translate, and compile notes.',
    meetingsRecordBtn: 'Record Meeting',
    meetingsStopCompileBtn: 'Stop & Compile Notes',
    meetingsSourceLabel: 'Audio Source',
    meetingsSourceBoth: 'System Audio + Mic',
    meetingsSourceMic: 'Microphone Only',
    meetingsSourceSystem: 'System Audio Only',
    meetingsSpokenLabel: 'Spoken',
    meetingsTranslateToLabel: 'Translate to',
    meetingsTabScript: 'Bilingual Script',
    meetingsTabSummary: 'Summary',
    meetingsTabActions: 'Decisions & Actions',
    meetingsTabExport: 'Export',
    meetingsEmptyTitle: 'Record a live meeting from Zoom, Teams, Meet, or any app',
    meetingsEmptyBody: 'OPERO captures OS-level audio locally, transcribes and translates automatically, and compiles structured meeting notes.',
    meetingsCompilingTitle: 'Pero is compiling your meeting notes',
    meetingsCompilingStep1: 'Transcribing OS-level audio stream',
    meetingsCompilingStep2: 'Translating bilingual transcript',
    meetingsCompilingStep3: 'Compiling summary, decisions & action items',
    meetingsImportSampleBtn: 'Compile Transcript / Demo',
    agentTitle: 'Pero Agent',
    agentSubtitle: 'Autonomous local assistant connected to Memory, Documents, Meetings, and Templates.',
    agentInputPlaceholder: 'Ask Pero to search MMI knowledge, summarize a meeting, or create a manual...',
    agentSendBtn: 'Send',
    agentNewChatBtn: 'New Chat',
    agentToolsUsed: 'Actions taken',
    agentStarter1: 'Who is the Representative Director of Man Machine Interface?',
    agentStarter2: 'Summarize my latest meeting notes in Japanese',
    agentStarter3: 'Create a Standard Operating Procedure manual from template',
  },
  'ja-JP': {
    navMeetings: '議事録・会議記録',
    navAgent: 'Pero エージェント',
    hideNav: 'ナビを隠す',
    showNav: 'ナビを表示',
    hideRail: '右パネルを隠す',
    showRail: '右パネルを表示',
    glassMode: 'ガラス',
    solidMode: '標準',
    aiModelTitle: 'AI モデル',
    allModelsBtn: 'すべて表示',
    manualLanguageLabel: '出力言語',
    appLanguageLabel: 'アプリ言語',
    voiceLabel: '音声',
    micOn: 'マイク: ON',
    micOff: 'マイク: OFF',
    manageBtn: '管理',
    analyzerTitle: 'ドキュメント解析',
    analyzerSubtitle: 'PDF・Word・テキストをローカル解析し、枠・矢印・切り抜き注釈と理由を生成します。',
    analyzerUploadBtn: 'ファイルを選択',
    analyzerEmptyTitle: 'ドキュメントを読み込んで要約・注釈・レポートを作成します',
    analyzerEmptyBody: 'PDF、Word (.docx / .doc)、Markdown、テキストに対応しています。ローカル処理で安全に解析・出力できます。',
    analyzerToolInspect: '確認',
    analyzerToolBox: '枠注釈',
    analyzerToolArrow: '矢印',
    analyzerToolCrop: '切り抜き',
    analyzerTabSummary: '要約',
    analyzerTabAnnotations: '注釈',
    analyzerTabReport: 'レポート出力',
    analyzerKeyFindings: '主な所見',
    analyzerReasoning: '根拠',
    analyzerSuggestion: '改善案',
    analyzerRemove: '削除',
    analyzerOpenStudio: 'スタジオで開く',
    analyzerCompleteSuffix: '入力済み',
    meetingsTitle: '議事録・会議記録',
    meetingsSubtitle: 'ZoomやTeamsなど他アプリの会議音声をOSレベルで録音・文字起こし・翻訳し、議事録を自動作成します。',
    meetingsRecordBtn: '会議を録音',
    meetingsStopCompileBtn: '停止して議事録を作成',
    meetingsSourceLabel: '音声ソース',
    meetingsSourceBoth: 'システム音声 + マイク',
    meetingsSourceMic: 'マイクのみ',
    meetingsSourceSystem: 'システム音声のみ',
    meetingsSpokenLabel: '発話言語',
    meetingsTranslateToLabel: '翻訳先',
    meetingsTabScript: 'バイリンガル文字起こし',
    meetingsTabSummary: '要約',
    meetingsTabActions: '決定事項・タスク',
    meetingsTabExport: '出力',
    meetingsEmptyTitle: '他アプリの会議音声をそのまま録音・翻訳します',
    meetingsEmptyBody: 'Zoom、Teams、Google Meetなどの音声をローカルで記録し、文字起こし・翻訳・議事録を自動でまとめます。',
    meetingsCompilingTitle: 'Peroが議事録を作成しています',
    meetingsCompilingStep1: 'OS音声を文字起こししています…',
    meetingsCompilingStep2: 'バイリンガル翻訳を実行しています…',
    meetingsCompilingStep3: '要約・決定事項・タスクを整理しています…',
    meetingsImportSampleBtn: '文字起こしから作成',
    agentTitle: 'Pero エージェント',
    agentSubtitle: 'メモリ・ドキュメント・議事録・テンプレートを自律操作するローカルAIアシスタントです。',
    agentInputPlaceholder: 'MMIの会社情報検索、議事録の要約、SOP作成などを依頼してください...',
    agentSendBtn: '送信',
    agentNewChatBtn: '新規チャット',
    agentToolsUsed: '実行した操作',
    agentStarter1: 'マン・マシンインターフェースの代表取締役は誰ですか？',
    agentStarter2: '最新の会議議事録を日本語で要約してください',
    agentStarter3: 'テンプレートから標準作業手順書（SOP）を作成してください',
  },
  'fil-PH': {
    navMeetings: 'Mga Tala ng Pulong',
    navAgent: 'Pero Agent',
    hideNav: 'Itago ang Nav',
    showNav: 'Ipakita ang Nav',
    hideRail: 'Itago ang Panel',
    showRail: 'Ipakita ang Panel',
    glassMode: 'Glass',
    solidMode: 'Solid',
    aiModelTitle: 'AI Model',
    allModelsBtn: 'Lahat ng Model',
    manualLanguageLabel: 'Wika ng Dokumento',
    appLanguageLabel: 'Wika ng App',
    voiceLabel: 'Boses',
    micOn: 'Mic: ON',
    micOff: 'Mic: OFF',
    manageBtn: 'Pamahalaan',
    analyzerTitle: 'Pagsusuri ng Dokumento',
    analyzerSubtitle: 'Suriin ang PDF, Word, o text nang lokal na may Box, Arrow, at Crop na paliwanag.',
    analyzerUploadBtn: 'Mag-upload ng Dokumento',
    analyzerEmptyTitle: 'Mag-upload ng dokumento upang ibuod, lagyan ng tala, at i-export',
    analyzerEmptyBody: 'Suportado ang PDF, Word (.docx / .doc), Markdown, at plain text nang lokal at pribado.',
    analyzerToolInspect: 'Suriin',
    analyzerToolBox: 'Kahon',
    analyzerToolArrow: 'Palaso',
    analyzerToolCrop: 'Gupit',
    analyzerTabSummary: 'Buod',
    analyzerTabAnnotations: 'Mga Tala',
    analyzerTabReport: 'Buong Ulat',
    analyzerKeyFindings: 'Mahahalagang Nakita',
    analyzerReasoning: 'Paliwanag',
    analyzerSuggestion: 'Mungkahi',
    analyzerRemove: 'Alisin',
    analyzerOpenStudio: 'Buksan sa Studio',
    analyzerCompleteSuffix: 'kumpleto',
    meetingsTitle: 'Mga Tala ng Pulong',
    meetingsSubtitle: 'I-record ang system audio at mikropono mula sa ibang app, i-transcribe, isalin, at gawing tala.',
    meetingsRecordBtn: 'I-record ang Pulong',
    meetingsStopCompileBtn: 'Ihinto at Gumawa ng Tala',
    meetingsSourceLabel: 'Pinagmulan ng Audio',
    meetingsSourceBoth: 'System Audio + Mic',
    meetingsSourceMic: 'Mikropono Lamang',
    meetingsSourceSystem: 'System Audio Lamang',
    meetingsSpokenLabel: 'Sinalita',
    meetingsTranslateToLabel: 'Isalin sa',
    meetingsTabScript: 'Bilingguwal na Iskrip',
    meetingsTabSummary: 'Buod',
    meetingsTabActions: 'Mga Desisyon at Aksyon',
    meetingsTabExport: 'I-export',
    meetingsEmptyTitle: 'I-record ang pulong mula sa Zoom, Teams, Meet, o ibang app',
    meetingsEmptyBody: 'Lokal na kinukuha ng OPERO ang audio, isinasalin, at binubuo ang malinaw na tala ng pulong.',
    meetingsCompilingTitle: 'Binubuo ni Pero ang iyong mga tala ng pulong',
    meetingsCompilingStep1: 'Tinatranscribe ang audio ng pulong',
    meetingsCompilingStep2: 'Isinasalin ang bilingguwal na iskrip',
    meetingsCompilingStep3: 'Binubuo ang buod at mga aksyon',
    meetingsImportSampleBtn: 'Bumuo mula sa Iskrip',
    agentTitle: 'Pero Agent',
    agentSubtitle: 'Lokal na AI assistant na nakakonekta sa Memory, Dokumento, Pulong, at Template.',
    agentInputPlaceholder: 'Magtanong tungkol sa MMI, ibuod ang pulong, o gumawa ng manwal...',
    agentSendBtn: 'Ipadala',
    agentNewChatBtn: 'Bagong Usapan',
    agentToolsUsed: 'Mga ginawang hakbang',
    agentStarter1: 'Sino ang Representative Director ng Man Machine Interface?',
    agentStarter2: 'Ibuod ang pinakahuling tala ng pulong',
    agentStarter3: 'Gumawa ng SOP manual mula sa template',
  },
};

export function getFeatureStrings(locale: FirstClassLocale): FeatureUiStrings {
  return FEATURE_UI_STRINGS[locale] ?? FEATURE_UI_STRINGS['en-US'];
}
