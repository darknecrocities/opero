export type Bcp47Locale =
  | 'en'
  | 'en-US'
  | 'en-GB'
  | 'ja-JP'
  | 'fil'
  | 'fil-PH'
  | 'zh-Hans'
  | 'ko-KR'
  | 'id-ID';

export type FirstClassLocale = 'en-US' | 'ja-JP' | 'fil-PH';

export type OperatorRole = 'recorder' | 'author' | 'reviewer' | 'admin';

export type ManualLifecycleState =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'superseded'
  | 'withdrawn';

export type SessionStatus =
  | 'ready'
  | 'recording'
  | 'paused'
  | 'completed'
  | 'incomplete_recovered';

export type StepActionType =
  | 'navigation'
  | 'selection'
  | 'data_entry'
  | 'confirmation'
  | 'other';

export type StepReviewStatus = 'draft' | 'needs_review' | 'verified' | 'rejected';

export type AnnotationType =
  | 'number'
  | 'arrow'
  | 'rect'
  | 'blur'
  | 'crop'
  | 'label'
  | 'spotlight';

export type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown';

export interface Project {
  id: string;
  title: string;
  owner: string;
  department: string;
  defaultLocale: FirstClassLocale;
  glossaryId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingSession {
  id: string;
  projectId: string;
  title: string;
  startedAt: string;
  endedAt: string | null;
  activeDurationMs: number;
  status: SessionStatus;
  captureProfile: 'standard' | 'high_detail' | 'low_spec_8gb';
  appVersion: string;
  consentAcknowledgedAt: string;
  eventCount: number;
  screenshotCount: number;
}

export interface CapturedEvent {
  eventId: string;
  sessionId: string;
  timestampUtc: string;
  sequence: number;
  eventType: 'click' | 'navigation' | 'window_change' | 'text_entry_metadata';
  application: { process: string; windowTitle: string };
  coordinates: { x: number; y: number; displayScale: number };
  target: { role: string; label: string; source: 'accessibility' | 'ocr' | 'human_verified' | 'unknown' };
  screenshotRefs: string[];
  privacyFlags: ('masked' | 'excluded' | 'sensitive-review')[];
  schemaVersion: 1;
}

export interface ScreenshotAsset {
  id: string;
  sessionId: string;
  relativePath: string;
  timestampUtc: string;
  width: number;
  height: number;
  displayScale: number;
  sha256: string;
  dhash: string;
  redactionState: 'none' | 'studio_blur' | 'irreversible_redacted';
}

export interface AnnotationGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  x2?: number;
  y2?: number;
  curved?: boolean;
}

export interface AnnotationOverlay {
  id: string;
  screenshotId: string;
  stepId: string;
  type: AnnotationType;
  geometry: AnnotationGeometry;
  numberValue?: number;
  localizedLabels: Partial<Record<Bcp47Locale, string>>;
  style: {
    strokeColor: '#0F172A' | '#69BCFC' | '#C43D4B';
    spotlightDim?: number;
    radius?: number;
  };
  isIrreversibleRedaction: boolean;
}

export interface StepCallout {
  kind: 'prerequisite' | 'note' | 'warning' | 'expected_result' | 'troubleshooting';
  text: string;
}

export interface ContentVariant {
  id: string;
  stepId: string;
  locale: FirstClassLocale;
  title: string;
  body: string;
  callouts: StepCallout[];
  sourceVariantId: string | null;
  reviewStatus: StepReviewStatus;
  outdated?: boolean;
}

export interface WorkflowStep {
  id: string;
  manualId: string;
  sessionId: string | null;
  sectionTitle: string;
  orderIndex: number;
  actionType: StepActionType;
  eventRefs: string[];
  screenshotRefs: string[];
  reviewStatus: StepReviewStatus;
  uncertaintyNotes: string[];
  promptVersion: string;
  modelId: string;
  variants: Record<FirstClassLocale, ContentVariant>;
  annotations: AnnotationOverlay[];
  schemaVersion: 1;
}

export interface Manual {
  id: string;
  projectId: string;
  sessionId: string | null;
  title: string;
  templateId: string;
  sourceLocale: FirstClassLocale;
  lifecycleState: ManualLifecycleState;
  summary: string;
  prerequisites: string[];
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ManualVersion {
  id: string;
  manualId: string;
  versionNumber: number;
  author: string;
  changeSummary: string;
  lifecycleState: ManualLifecycleState;
  schemaVersion: 1;
  createdAt: string;
  snapshotJson: string;
}

export interface GlossaryTerm {
  id: string;
  sourceTerm: string;
  locale: FirstClassLocale;
  preferredTerm: string;
  forbiddenVariants: string[];
  context: string;
  glossaryVersion: number;
}

export interface ModelProfile {
  id: string;
  runtime: 'ollama' | 'llamacpp' | 'apple_metal' | 'offline_deterministic';
  modelName: string;
  displayName?: string;
  ollamaTag?: string;
  shortDescription?: string;
  capabilitySummary?: string;
  languagesLabel?: string;
  downloadSizeLabel?: string;
  estimatedModelRamGb?: number;
  revision: string;
  quantization: string;
  ramTierGb: 4 | 8 | 16 | 32;
  licenseRef: string;
  capabilities: ('draft' | 'summarize' | 'translate' | 'vision' | 'embed' | 'reasoning')[];
  active: boolean;
  researchOnly?: boolean;
}

export interface HardwareProfile {
  cpuName: string;
  cpuCores: number;
  totalRamGb: number;
  freeDiskGb: number;
  gpuName?: string;
  hasDedicatedGpu?: boolean;
  computeMode?: 'cpu-only' | 'metal' | 'dedicated-gpu' | string;
  maxModelRamGb?: number;
  recommendationReason?: string;
  osName: string;
  recommendedTier: 'offline' | 'compact' | 'balanced' | 'deep' | string;
  recommendedModelId: string;
  ollamaBinaryAvailable?: boolean;
  ollamaRunning: boolean;
  installedModels: string[];
}

export interface ModelPullJobStatus {
  jobId: string;
  modelTag: string;
  phase:
    | 'checking_runtime'
    | 'installing_ollama'
    | 'starting_ollama'
    | 'pulling_model'
    | 'verifying'
    | 'completed'
    | 'failed'
    | string;
  statusText: string;
  completedBytes: number;
  totalBytes: number;
  percent: number | null;
  speedBytesPerSec: number | null;
  error: string | null;
  hardware: HardwareProfile | null;
}

export type OperoPersonality =
  | 'calm_concise'
  | 'friendly_guide'
  | 'technical_direct'
  | 'formal_sop';

export interface UserProfile {
  id: string;
  name: string;
  occupation: string;
  personality: OperoPersonality;
  defaultLocale: FirstClassLocale;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  peroCapColor: string;
  peroJacketColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAnalytics {
  totalSessions: number;
  completedSessions: number;
  meetingSessions: number;
  talkingMinutes: number;
  totalCapturedEvents: number;
  totalManuals: number;
  verifiedSteps: number;
  dailyActivity: number[];
}

export interface DocumentBlock {
  id: string;
  kind: 'heading' | 'paragraph' | 'table' | 'note' | string;
  title: string | null;
  text: string;
  rows: string[][];
  blankCellCount: number;
  yPct: number;
  hPct: number;
}

export interface DocumentAnnotation {
  id: string;
  number: number;
  kind: 'box' | 'arrow' | 'crop' | string;
  source: 'ai' | 'manual' | string;
  blockId: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  targetX: number | null;
  targetY: number | null;
  title: string;
  excerpt: string;
  explanation: string;
  reasoning: string;
  suggestedFix: string | null;
  severity: 'info' | 'suggestion' | 'missing' | string;
}

export interface AnalyzedDocument {
  id: string;
  filename: string;
  fileFormat: string;
  byteSize: number;
  sha256: string;
  wordCount: number;
  detectedLanguages: string[];
  documentType: string;
  engineUsed: string;
  executiveSummary: string;
  keyFindings: string[];
  completenessScore: number;
  blocks: DocumentBlock[];
  annotations: DocumentAnnotation[];
  createdAt: string;
  updatedAt: string;
}

export interface RegionExplanation {
  engineUsed: string;
  title: string;
  explanation: string;
  reasoning: string;
  suggestedFix: string | null;
  severity: 'info' | 'suggestion' | 'missing' | string;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  channel: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  releaseUrl: string;
  assetName: string | null;
  assetDownloadUrl: string | null;
  expectedSha256: string | null;
}

export interface UpdateInstallResult {
  status: string;
  message: string;
  replacedExisting: boolean;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  correlationId: string;
}
