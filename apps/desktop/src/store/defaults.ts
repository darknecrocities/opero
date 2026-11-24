import type {
  DashboardAnalytics,
  DualCoreMemoryStats,
  ModelProfile,
  UserProfile,
} from '@opero/shared-types';

export const PROFILE_CACHE_KEY = 'opero_profile_cache_v1';

export const DEFAULT_MODELS: readonly ModelProfile[] = [
  {
    id: 'ollama-qwen3-4b',
    runtime: 'ollama',
    modelName: 'qwen3:4b-instruct-q4_K_M',
    revision: 'q4_K_M',
    quantization: '4-bit',
    ramTierGb: 16,
    licenseRef: 'Apache-2.0',
    capabilities: ['draft', 'summarize', 'translate'],
    active: true,
  },
  {
    id: 'ollama-gemma3-4b',
    runtime: 'ollama',
    modelName: 'gemma3:4b-it-qat',
    revision: 'qat',
    quantization: '4-bit',
    ramTierGb: 16,
    licenseRef: 'Gemma Terms',
    capabilities: ['draft', 'translate', 'vision'],
    active: false,
  },
  {
    id: 'apple-metal-local',
    runtime: 'apple_metal',
    modelName: 'Apple Silicon On-Device (MLX)',
    revision: 'metal-fp16',
    quantization: '4-bit',
    ramTierGb: 16,
    licenseRef: 'Local Hardware',
    capabilities: ['draft', 'summarize'],
    active: false,
  },
  {
    id: 'offline-deterministic',
    runtime: 'offline_deterministic',
    modelName: 'Offline Evidence + OCR Engine',
    revision: 'v1.0.0',
    quantization: 'Zero-Weight',
    ramTierGb: 8,
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
