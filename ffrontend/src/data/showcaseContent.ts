import type {
  DownloadArtifact,
  ExportFormatCard,
  FeatureCardItem,
  FlowStepItem,
  LocalAiMode,
  OroMotionSample,
  PanoramaAnchorMeta,
  ProductModuleMeta,
  ShortcutKeyItem,
  TeamUseCase,
  TechStackItem,
  TrilingualSample,
} from '../types/showcase';

export const PANORAMA_ANCHORS: readonly PanoramaAnchorMeta[] = [
  { id: 'overview', label: 'Overview', axis: 'horizontal' },
  { id: 'features', label: 'Features', axis: 'horizontal' },
  { id: 'workspace', label: 'Workspace', axis: 'horizontal' },
  { id: 'flow', label: 'Flow', axis: 'vertical' },
  { id: 'outputs', label: 'Outputs', axis: 'vertical' },
  { id: 'download', label: 'Coming Soon', axis: 'vertical' },
] as const;

export const HERO_WHISPERS: readonly string[] = [
  'hey! click me',
  'Opero!',
] as const;

export const FEATURE_CARDS: readonly FeatureCardItem[] = [
  { id: 'capture', title: 'Explicit Capture', description: 'Start, pause, and snap desktop steps only when you choose.' },
  { id: 'ocr', title: 'Local OCR', description: 'Reads on-screen labels and UI context directly on your device.' },
  { id: 'studio', title: 'OPERO Studio', description: 'Refine every step and screenshot on a clean document canvas.' },
  { id: 'annotations', title: '7 Annotations', description: 'Add numbered markers, arrows, highlights, and export redactions.' },
  { id: 'templates', title: 'SOP Templates', description: 'Structure operational manuals consistently in one click.' },
  { id: 'multilingual', title: 'Multilingual', description: 'Author English and Japanese side by side. Filipino coming soon.' },
  { id: 'versions', title: 'Version History', description: 'Track manual revisions and step verification over time.' },
  { id: 'export', title: 'Clean Exports', description: 'Export reviewed manuals to PDF and Word. HTML & Markdown soon.' },
  { id: 'menubar', title: 'System Tray', description: 'Lives quietly in your Windows system tray, ready when you need it.' },
  { id: 'local', title: 'Completely Local', description: 'Captures and SQLite records stay on your PC under your control.' },
] as const;

export const PRODUCT_MODULES: readonly ProductModuleMeta[] = [
  { id: 'dashboard', name: 'Dashboard', shortcut: 'Ctrl+0' },
  { id: 'capture-center', name: 'Capture', shortcut: 'Alt+Space' },
  { id: 'intelligence', name: 'Intelligence', shortcut: 'Ctrl+5' },
  { id: 'studio', name: 'Studio', shortcut: 'Ctrl+1' },
  { id: 'templates', name: 'Templates', shortcut: 'Ctrl+2' },
  { id: 'version-control', name: 'Versions', shortcut: 'Ctrl+3' },
  { id: 'settings', name: 'Settings', shortcut: 'Ctrl+,' },
] as const;

export const ORO_MOTION_SAMPLES: readonly OroMotionSample[] = [
  { id: 'wave-hello', label: 'Greet', whisper: 'hi! i’m Pero' },
  { id: 'camera-snap', label: 'Capture', whisper: 'snapping step...' },
  { id: 'monocle-inspect', label: 'Inspect', whisper: 'reading local OCR' },
  { id: 'writing-manual', label: 'Draft', whisper: 'drafting your guide' },
  { id: 'privacy-shield', label: 'Privacy', whisper: 'stays on your PC' },
  { id: 'export-document', label: 'Export', whisper: 'PDF & Word ready!' },
] as const;

export const VERTICAL_FLOW_STEPS: readonly FlowStepItem[] = [
  { number: '01', title: 'Capture', caption: 'Snap explicit steps.', iconId: 'capture' },
  { number: '02', title: 'Understand', caption: 'Group UI + OCR locally.', iconId: 'ocr' },
  { number: '03', title: 'Generate', caption: 'Draft structured manuals.', iconId: 'templates' },
  { number: '04', title: 'Edit', caption: 'Annotate & verify.', iconId: 'annotations' },
  { number: '05', title: 'Export', caption: 'PDF & Word (HTML/MD soon).', iconId: 'export' },
] as const;

export const TECH_STACK_ITEMS: readonly TechStackItem[] = [
  { id: 'tauri', name: 'Tauri 2', role: 'Desktop Shell' },
  { id: 'rust', name: 'Rust', role: 'Native Core' },
  { id: 'react', name: 'React', role: 'Studio UI' },
  { id: 'typescript', name: 'TypeScript', role: 'Type Safety' },
  { id: 'sqlite', name: 'SQLite', role: 'Local WAL + RAG' },
  { id: 'ollama', name: 'Ollama', role: 'Local LLM' },
  { id: 'paddleocr', name: 'PaddleOCR', role: 'On-Device OCR' },
  { id: 'vite', name: 'Vite', role: 'Fast Build' },
  { id: 'tailwind', name: 'Tailwind CSS', role: 'Design System' },
  { id: 'motion', name: 'Motion', role: 'Spring Physics' },
] as const;

export const TRILINGUAL_SAMPLES: readonly TrilingualSample[] = [
  {
    code: 'en-US',
    label: 'English',
    heading: 'Select Add New Item',
    body: 'Click Add New Item in the top bar to open the sample entry form.',
  },
  {
    code: 'ja-JP',
    label: '日本語',
    heading: '「新規追加」を選択します',
    body: '上部バーの「新規追加」をクリックして登録フォームを開いてください。',
  },
  {
    code: 'fil-PH',
    label: 'Filipino (Coming soon)',
    heading: 'Piliin ang Add New Item',
    body: 'I-click ang Add New Item sa itaas na bar upang buksan ang form. (Planned for a later release.)',
  },
] as const;

export const SHORTCUT_KEYS: readonly ShortcutKeyItem[] = [
  { id: 'capture', keys: ['Alt', 'Space'], label: 'Start Capture', reaction: 'camera-snap', whisper: 'snap! frame captured' },
  { id: 'studio', keys: ['Ctrl', '1'], label: 'Open Studio', reaction: 'annotating-arrows', whisper: 'studio canvas ready' },
  { id: 'intelligence', keys: ['Ctrl', '5'], label: 'Local AI', reaction: 'thinking-processing', whisper: 'thinking locally...' },
  { id: 'export', keys: ['Ctrl', 'E'], label: 'Export PDF / Word', reaction: 'export-document', whisper: 'exported to PDF!' },
] as const;

export const EXPORT_FORMATS: readonly ExportFormatCard[] = [
  { ext: '.pdf', title: 'Print-Ready PDF', note: 'Redacted, paginated, ready for reviews.' },
  { ext: '.docx', title: 'Word Document', note: 'Editable handoff for office teams.' },
  { ext: '.md · Coming soon', title: 'Clean Markdown', note: 'Planned for a later release.' },
  { ext: '.html · Coming soon', title: 'Standalone HTML', note: 'Planned for a later release.' },
] as const;

export const TEAM_USE_CASES: readonly TeamUseCase[] = [
  { team: 'Operations & SOP', outcome: 'Turn daily desktop workflows into verified step-by-step manuals.' },
  { team: 'IT & Onboarding', outcome: 'Document setup once instead of repeating the same walkthrough.' },
  { team: 'Bilingual Teams', outcome: 'Keep English and Japanese teams aligned on one source manual (Filipino soon).' },
] as const;

export const LOCAL_AI_MODES: readonly LocalAiMode[] = [
  { name: 'Capture Only', spec: '0 GB AI RAM', note: 'Record, annotate, and export even with no LLM installed.' },
  { name: 'Ollama Local', spec: 'Qwen3 / Gemma 3', note: 'Draft & translate offline through your local Ollama runtime.' },
  { name: 'llama.cpp Direct', spec: 'GGUF Local', note: 'Run quantized models directly without external cloud APIs.' },
] as const;

export const DOWNLOADS_ENABLED = false;

export const DOWNLOAD_ARTIFACTS: readonly DownloadArtifact[] = [
  {
    platform: 'windows',
    name: 'Windows',
    architecture: '64-bit Installer (x64)',
    version: 'Coming soon',
    releaseDate: 'Coming soon',
    fileName: 'OPERO-Setup-x64.exe',
    sizeLabel: 'Coming soon',
    downloadUrl: '#',
    sha256: 'Coming soon',
    requirement: 'Windows 10 (1903+) or Windows 11 (64-bit)',
  },
  {
    platform: 'macos',
    name: 'macOS',
    architecture: 'Apple Silicon',
    version: 'Coming later',
    releaseDate: 'Coming later',
    fileName: 'OPERO-macOS.dmg',
    sizeLabel: 'Coming later',
    downloadUrl: '#',
    sha256: 'Coming later',
    requirement: 'Planned for a later release',
  },
] as const;
