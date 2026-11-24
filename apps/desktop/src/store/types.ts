import type {
  AnnotationOverlay,
  DashboardAnalytics,
  DualCoreMemoryStats,
  ExportFormat,
  FirstClassLocale,
  HardwareProfile,
  Manual,
  MemorySearchHit,
  OperoPersonality,
  OperatorRole,
  OsPermissionSnapshot,
  PermissionSurface,
  Project,
  RecordingSession,
  UserProfile,
} from '@opero/shared-types';
import type { OperoAppState } from '@opero/mascot';

export type WorkspaceNavMode =
  | 'dashboard'
  | 'capture'
  | 'studio'
  | 'templates'
  | 'analyzer'
  | 'meetings'
  | 'agent'
  | 'settings';

export interface CompilingOverlayState {
  visible: boolean;
  title: string;
  stepIndex: number;
  steps: string[];
}

export interface ImpulseSample {
  seq: number;
  label: string;
  eventType: string;
  timestamp: string;
  intensity: number;
}

export interface ExportHistoryItem {
  id: string;
  format: ExportFormat;
  locale: FirstClassLocale;
  title: string;
  byteSize: number;
  sha256: string;
  createdAt: string;
}

export interface OperoStoreState {
  navMode: WorkspaceNavMode;
  previousNavMode: WorkspaceNavMode;
  leftOpen: boolean;
  rightOpen: boolean;
  solidFallback: boolean;
  uiLocale: FirstClassLocale;
  targetLocale: FirstClassLocale;
  role: OperatorRole;
  speechEnabled: boolean;
  soundEnabled: boolean;
  activeModelId: string;
  hardwareProfile: HardwareProfile | null;
  peroState: OperoAppState;
  peroCapColor: string;
  peroJacketColor: string;
  daemonOnline: boolean;
  userProfile: UserProfile;
  showOnboarding: boolean;
  analytics: DashboardAnalytics;
  projects: Project[];
  sessions: RecordingSession[];
  activeSessionId: string | null;
  activeManual: Manual | null;
  impulses: ImpulseSample[];
  elapsedMs: number;
  permissions: OsPermissionSnapshot | null;
  memoryStats: DualCoreMemoryStats;
  memoryHits: MemorySearchHit[];
  exportHistory: ExportHistoryItem[];
  quickPromptReply: string | null;
  lastExportNotice: string | null;
  statusMessage: string | null;
  toastNotice: string | null;
  compilingOverlay: CompilingOverlayState | null;
  pendingAgentPrompt: string | null;

  setNavMode: (mode: WorkspaceNavMode) => void;
  toggleSettingsView: () => void;
  showToast: (msg: string | null) => void;
  setCompilingOverlay: (overlay: CompilingOverlayState | null) => void;
  openAgentWithPrompt: (prompt: string) => void;
  clearPendingAgentPrompt: () => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleSolidFallback: () => void;
  toggleSound: () => void;
  setUiLocale: (locale: FirstClassLocale) => void;
  setTargetLocale: (locale: FirstClassLocale) => void;
  setRole: (role: OperatorRole) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  setActiveModelId: (id: string) => void;
  setHardwareProfile: (hw: HardwareProfile) => void;
  setPeroOutfit: (cap: string, jacket: string) => void;
  setActiveSessionId: (id: string | null) => void;
  openManualInStudio: (manual: Manual) => void;
  tickTimer: (deltaMs: number) => void;

  bootstrap: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  saveOnboardingProfile: (input: {
    name: string;
    occupation: string;
    personality: OperoPersonality;
    defaultLocale: FirstClassLocale;
    soundEnabled?: boolean;
    onboardingCompleted?: boolean;
  }) => Promise<void>;
  replayOnboarding: () => void;
  createManualFromTemplate: (templateId: string, title?: string) => Promise<Manual | null>;
  startRecordingFlow: (title: string) => Promise<void>;
  pauseOrResumeFlow: () => Promise<void>;
  stopAndDraftFlow: () => Promise<void>;
  snapWorkflowAction: (label: string, windowTitle?: string) => Promise<void>;
  verifyStep: (stepId: string) => void;
  updateStepText: (stepId: string, locale: FirstClassLocale, title: string, body: string) => void;
  addAnnotation: (stepId: string, overlay: AnnotationOverlay) => void;
  runQuickPrompt: (prompt: string) => Promise<void>;
  requestOsPermission: (surface: PermissionSurface) => Promise<void>;
  openOsSettings: (surface: PermissionSurface) => Promise<void>;
  runExport: (format: ExportFormat, manualOverride?: Manual) => Promise<void>;
}
