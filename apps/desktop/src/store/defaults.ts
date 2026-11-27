import type {
  DashboardAnalytics,
  DualCoreMemoryStats,
  ModelProfile,
  RecordingSession,
  UserProfile,
} from '@opero/shared-types';

export const PROFILE_CACHE_KEY = 'opero_profile_cache_v1';

export const DEFAULT_MODELS: readonly ModelProfile[] = [
  {
    id: 'ollama-qwen2.5-3b',
    runtime: 'ollama',
    modelName: 'qwen2.5:3b',
    displayName: 'Qwen2.5 3B (Standard)',
    ollamaTag: 'qwen2.5:3b',
    shortDescription: 'Release 1 ISMS-approved Standard model for HP ProBook 450 G8 (16 GB CPU-only, 1.94 GB model RAM, 33.1 tok/s CPU).',
    capabilitySummary: 'R1 Standard · EN/JA/FIL SOPs · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '1.9 GB',
    estimatedModelRamGb: 1.94,
    revision: '3b',
    quantization: 'Q4_K_M',
    ramTierGb: 16,
    licenseRef: 'Apache-2.0',
    capabilities: ['draft', 'summarize', 'translate'],
    ismsApproved: true,
    releaseRole: 'standard',
    active: true,
  },
  {
    id: 'ollama-qwen3-1.7b',
    runtime: 'ollama',
    modelName: 'qwen3:1.7b',
    displayName: 'Qwen3 1.7B (Lighter Fallback)',
    ollamaTag: 'qwen3:1.7b',
    shortDescription: 'Release 1 ISMS-approved Lighter Fallback for 8 GB or constrained PCs (1.13 GB model RAM, 52.2 tok/s CPU).',
    capabilitySummary: 'R1 Fallback · Reasoning · Summaries · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '1.4 GB',
    estimatedModelRamGb: 1.13,
    revision: '1.7b',
    quantization: 'Q4_K_M',
    ramTierGb: 8,
    licenseRef: 'Apache-2.0',
    capabilities: ['reasoning', 'draft', 'summarize', 'translate'],
    ismsApproved: true,
    releaseRole: 'fallback',
    active: false,
  },
  {
    id: 'offline-deterministic',
    runtime: 'offline_deterministic',
    modelName: 'Built-In Offline',
    displayName: 'Built-In Offline',
    shortDescription: 'Zero-download deterministic drafting, glossary checks, and export when Ollama is not provisioned.',
    capabilitySummary: 'Instant Offline · Structure Check · Export',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: 'Included',
    estimatedModelRamGb: 0,
    revision: 'v1.1.0',
    quantization: 'Deterministic',
    ramTierGb: 4,
    licenseRef: 'MIT',
    capabilities: ['draft', 'summarize', 'translate'],
    ismsApproved: true,
    releaseRole: 'offline',
    active: false,
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'primary',
  name: '',
  occupation: '',
  personality: 'calm_concise',
  defaultLocale: 'en-US',
  soundEnabled: true,
  onboardingCompleted: false,
  peroCapColor: '#69BCFC',
  peroJacketColor: '#69BCFC',
  createdAt: '',
  updatedAt: '',
};

export const DEFAULT_ANALYTICS: DashboardAnalytics = {
  totalSessions: 0,
  completedSessions: 0,
  meetingSessions: 0,
  talkingMinutes: 0,
  totalCapturedEvents: 0,
  totalManuals: 0,
  verifiedSteps: 0,
  dailyActivity: [0, 0, 0, 0, 0, 0, 0],
};

export const DEFAULT_MEMORY_STATS: DualCoreMemoryStats = {
  episodicCount: 0,
  semanticCount: 6,
  vectorCount: 6,
  embeddingModel: 'opero-rust-trigram-384-i8',
  embeddingDims: 384,
  estimatedRamBytes: 2688,
  sqliteWalBytes: 49152,
};

export function loadCachedProfile(): UserProfile | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function createLocalRecordingSession(projectId: string, title: string): RecordingSession {
  const now = new Date().toISOString();
  return {
    id: `sess_${Date.now()}`,
    projectId,
    title,
    startedAt: now,
    endedAt: null,
    activeDurationMs: 0,
    status: 'recording',
    captureProfile: 'standard',
    appVersion: '1.1.0',
    consentAcknowledgedAt: now,
    eventCount: 0,
    screenshotCount: 0,
  };
}

export function saveCachedProfile(profile: UserProfile): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}
