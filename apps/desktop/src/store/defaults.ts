import type {
  DashboardAnalytics,
  DualCoreMemoryStats,
  ModelProfile,
  UserProfile,
} from '@opero/shared-types';

export const PROFILE_CACHE_KEY = 'opero_profile_cache_v1';

export const DEFAULT_MODELS: readonly ModelProfile[] = [
  {
    id: 'ollama-qwen3-1.7b',
    runtime: 'ollama',
    modelName: 'qwen3:1.7b',
    displayName: 'Qwen3 Compact',
    ollamaTag: 'qwen3:1.7b',
    shortDescription: 'Fast step-by-step reasoning for everyday laptops.',
    capabilitySummary: 'Reasoning · Summaries · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '1.4 GB',
    revision: '1.7b',
    quantization: 'Compact',
    ramTierGb: 8,
    licenseRef: 'Apache-2.0',
    capabilities: ['reasoning', 'draft', 'summarize', 'translate'],
    active: true,
  },
  {
    id: 'ollama-qwen3-4b',
    runtime: 'ollama',
    modelName: 'qwen3:4b',
    displayName: 'Qwen3 Balanced',
    ollamaTag: 'qwen3:4b',
    shortDescription: 'Sharper reasoning and document analysis with smooth speed.',
    capabilitySummary: 'Reasoning · Document Analysis · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '2.6 GB',
    revision: '4b',
    quantization: 'Balanced',
    ramTierGb: 16,
    licenseRef: 'Apache-2.0',
    capabilities: ['reasoning', 'draft', 'summarize', 'translate'],
    active: false,
  },
  {
    id: 'ollama-gemma3-4b',
    runtime: 'ollama',
    modelName: 'gemma3:4b',
    displayName: 'Gemma 3 Vision',
    ollamaTag: 'gemma3:4b',
    shortDescription: 'Reads screenshots and visual documents alongside clear writing.',
    capabilitySummary: 'Vision · Writing · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '3.3 GB',
    revision: '4b',
    quantization: 'Vision',
    ramTierGb: 16,
    licenseRef: 'Gemma Terms',
    capabilities: ['vision', 'draft', 'translate'],
    active: false,
  },
  {
    id: 'ollama-qwen3-8b',
    runtime: 'ollama',
    modelName: 'qwen3:8b',
    displayName: 'Qwen3 Deep',
    ollamaTag: 'qwen3:8b',
    shortDescription: 'Deepest multi-step reasoning and nuanced bilingual phrasing.',
    capabilitySummary: 'Deep Reasoning · Long Reports · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '5.2 GB',
    revision: '8b',
    quantization: 'Deep',
    ramTierGb: 32,
    licenseRef: 'Apache-2.0',
    capabilities: ['reasoning', 'draft', 'summarize', 'translate'],
    active: false,
  },
  {
    id: 'offline-deterministic',
    runtime: 'offline_deterministic',
    modelName: 'Built-In Offline',
    displayName: 'Built-In Offline',
    shortDescription: 'Instant built-in drafting and structure checks with no download.',
    capabilitySummary: 'Instant Offline · Structure Check · Export',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: 'Included',
    revision: 'v1.0.0',
    quantization: 'Included',
    ramTierGb: 4,
    licenseRef: 'MIT',
    capabilities: ['draft', 'summarize', 'translate'],
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

export function saveCachedProfile(profile: UserProfile): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}
