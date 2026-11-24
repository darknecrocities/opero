export type PermissionSurface = 'screen_capture' | 'accessibility' | 'microphone';

export type PermissionGrantState =
  | 'granted'
  | 'denied'
  | 'not_determined'
  | 'disabled_by_policy'
  | 'requires_relaunch'
  | 'uipi_restricted';

export interface OsPermissionItem {
  surface: PermissionSurface;
  state: PermissionGrantState;
  canPromptNatively: boolean;
  settingsDeepLink: string;
  guidance: string;
}

export interface OsPermissionSnapshot {
  platform: 'macos' | 'windows' | 'linux';
  osVersion: string;
  bundleId: string;
  screenCapture: OsPermissionItem;
  accessibility: OsPermissionItem;
  microphone: OsPermissionItem;
  checkedAtUtc: string;
}

export type MemoryCoreType = 'episodic' | 'semantic';

export interface MemoryChunk {
  id: string;
  coreType: MemoryCoreType;
  projectId: string | null;
  sourceType: 'session_trace' | 'author_edit' | 'approved_manual' | 'glossary' | 'template';
  sourceId: string;
  locale: 'en-US' | 'ja-JP' | 'fil-PH';
  title: string;
  content: string;
  verifiedBoost: number;
  pinned: boolean;
  createdAt: string;
}

export interface MemorySearchHit {
  chunk: MemoryChunk;
  rrfScore: number;
  lexicalRank: number | null;
  vectorRank: number | null;
  cosineSimilarity: number;
}

export interface DualCoreMemoryStats {
  episodicCount: number;
  semanticCount: number;
  vectorCount: number;
  embeddingModel: string;
  embeddingDims: number;
  estimatedRamBytes: number;
  sqliteWalBytes: number;
}
