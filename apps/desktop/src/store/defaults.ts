import type {
  DashboardAnalytics,
  DualCoreMemoryStats,
  ModelProfile,
  UserProfile,
} from '@opero/shared-types';

export const PROFILE_CACHE_KEY = 'opero_profile_cache_v1';

export const DEFAULT_MODELS: readonly ModelProfile[] = [
  {
    id: 'ollama-qwen2.5-1.5b',
    runtime: 'ollama',
    modelName: 'qwen2.5:1.5b',
    displayName: 'Qwen2.5 Ultra-Light',
    ollamaTag: 'qwen2.5:1.5b',
    shortDescription: 'Fastest CPU-only drafting for 8 GB laptops and quick Japanese/English manuals.',
    capabilitySummary: 'CPU-Fast · Drafting · Summaries',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '1.0 GB',
    estimatedModelRamGb: 1.4,
    revision: '1.5b',
    quantization: 'Q4_K_M',
    ramTierGb: 8,
    licenseRef: 'Apache-2.0',
    capabilities: ['draft', 'summarize', 'translate'],
    active: false,
  },
  {
    id: 'ollama-qwen3-1.7b',
    runtime: 'ollama',
    modelName: 'qwen3:1.7b',
    displayName: 'Qwen3 Compact',
    ollamaTag: 'qwen3:1.7b',
    shortDescription: 'Fast step-by-step reasoning with Chain of Thought for everyday laptops.',
    capabilitySummary: 'Reasoning · Summaries · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '1.4 GB',
    estimatedModelRamGb: 1.8,
    revision: '1.7b',
    quantization: 'Q4_K_M',
    ramTierGb: 8,
    licenseRef: 'Apache-2.0',
    capabilities: ['reasoning', 'draft', 'summarize', 'translate'],
    active: true,
  },
  {
    id: 'ollama-qwen2.5-3b',
    runtime: 'ollama',
    modelName: 'qwen2.5:3b',
    displayName: 'Qwen2.5 CPU Baseline (3B)',
    ollamaTag: 'qwen2.5:3b',
    shortDescription: 'Ideal CPU-only balance for 16 GB office PCs (HP ProBook 450 G8, well under 6 GB RAM).',
    capabilitySummary: 'CPU-Optimized · EN/JA Manuals · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '1.9 GB',
    estimatedModelRamGb: 2.4,
    revision: '3b',
    quantization: 'Q4_K_M',
    ramTierGb: 16,
    licenseRef: 'Apache-2.0',
    capabilities: ['draft', 'summarize', 'translate'],
    active: false,
  },
  {
    id: 'ollama-phi4-mini-3.8b',
    runtime: 'ollama',
    modelName: 'phi4-mini:3.8b',
    displayName: 'Phi-4 Mini (MIT)',
    ollamaTag: 'phi4-mini:3.8b',
    shortDescription: 'Crisp procedural instructions and technical runbooks under 3 GB model RAM.',
    capabilitySummary: 'Structured SOPs · Technical Steps',
    languagesLabel: 'English, Japanese',
    downloadSizeLabel: '2.5 GB',
    estimatedModelRamGb: 2.8,
    revision: '3.8b',
    quantization: 'Q4_K_M',
    ramTierGb: 16,
    licenseRef: 'MIT',
    capabilities: ['reasoning', 'draft', 'summarize'],
    active: false,
  },
  {
    id: 'ollama-qwen3-4b',
    runtime: 'ollama',
    modelName: 'qwen3:4b',
    displayName: 'Qwen3 Balanced',
    ollamaTag: 'qwen3:4b',
    shortDescription: 'Sharper reasoning, polite Japanese manuals, and document analysis within 6 GB RAM.',
    capabilitySummary: 'Reasoning · Document Analysis · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '2.6 GB',
    estimatedModelRamGb: 3.4,
    revision: '4b',
    quantization: 'Q4_K_M',
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
    shortDescription: 'Reads screenshots and visual documents alongside clear writing (within 6 GB RAM).',
    capabilitySummary: 'Vision · Writing · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '3.3 GB',
    estimatedModelRamGb: 3.8,
    revision: '4b',
    quantization: 'Q4_K_M',
    ramTierGb: 16,
    licenseRef: 'Gemma Terms',
    capabilities: ['vision', 'draft', 'translate'],
    active: false,
  },
  {
    id: 'ollama-qwen2.5-7b',
    runtime: 'ollama',
    modelName: 'qwen2.5:7b',
    displayName: 'Qwen2.5 Pro Japanese (7B)',
    ollamaTag: 'qwen2.5:7b',
    shortDescription: 'High-accuracy Japanese business writing for 24–32 GB RAM or dedicated GPU workstations.',
    capabilitySummary: 'Formal Japanese · Long Manuals · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '4.7 GB',
    estimatedModelRamGb: 5.5,
    revision: '7b',
    quantization: 'Q4_K_M',
    ramTierGb: 32,
    licenseRef: 'Apache-2.0',
    capabilities: ['draft', 'summarize', 'translate'],
    active: false,
  },
  {
    id: 'ollama-qwen3-8b',
    runtime: 'ollama',
    modelName: 'qwen3:8b',
    displayName: 'Qwen3 Deep',
    ollamaTag: 'qwen3:8b',
    shortDescription: 'Deepest multi-step reasoning and nuanced bilingual phrasing for high-RAM/GPU PCs.',
    capabilitySummary: 'Deep Reasoning · Long Reports · Translation',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: '5.2 GB',
    estimatedModelRamGb: 6.0,
    revision: '8b',
    quantization: 'Q4_K_M',
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
    shortDescription: 'Instant built-in drafting and structure checks with zero download or model RAM.',
    capabilitySummary: 'Instant Offline · Structure Check · Export',
    languagesLabel: 'English, Japanese, Tagalog',
    downloadSizeLabel: 'Included',
    estimatedModelRamGb: 0,
    revision: 'v1.0.0',
    quantization: 'Deterministic',
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
