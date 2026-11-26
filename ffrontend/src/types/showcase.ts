import type { PeroMotionId } from '../assets/mascot';

export type PanoramaAnchorId =
  | 'overview'
  | 'features'
  | 'workspace'
  | 'flow'
  | 'outputs'
  | 'download';

export interface PanoramaAnchorMeta {
  id: PanoramaAnchorId;
  label: string;
  axis: 'horizontal' | 'vertical';
}

export type FeatureMotionIconId =
  | 'capture'
  | 'ocr'
  | 'studio'
  | 'annotations'
  | 'templates'
  | 'multilingual'
  | 'versions'
  | 'export'
  | 'menubar'
  | 'local';

export interface FeatureCardItem {
  id: FeatureMotionIconId;
  title: string;
  description: string;
}

export type ProductModuleId =
  | 'dashboard'
  | 'capture-center'
  | 'intelligence'
  | 'studio'
  | 'templates'
  | 'version-control'
  | 'settings';

export interface ProductModuleMeta {
  id: ProductModuleId;
  name: string;
  shortcut: string;
}

export interface OroMotionSample {
  id: PeroMotionId;
  label: string;
  whisper: string;
}

export interface FlowStepItem {
  number: string;
  title: string;
  caption: string;
  iconId: FeatureMotionIconId;
}

export interface TrilingualSample {
  code: 'en-US' | 'ja-JP' | 'fil-PH';
  label: string;
  heading: string;
  body: string;
}

export interface ShortcutKeyItem {
  id: string;
  keys: readonly string[];
  label: string;
  reaction: PeroMotionId;
  whisper: string;
}

export type TechStackId =
  | 'tauri'
  | 'rust'
  | 'react'
  | 'typescript'
  | 'sqlite'
  | 'ollama'
  | 'paddleocr'
  | 'vite'
  | 'tailwind'
  | 'motion';

export interface TechStackItem {
  id: TechStackId;
  name: string;
  role: string;
}

export interface ExportFormatCard {
  ext: string;
  title: string;
  note: string;
}

export interface TeamUseCase {
  team: string;
  outcome: string;
}

export interface LocalAiMode {
  name: string;
  spec: string;
  note: string;
}

export interface DownloadArtifact {
  platform: 'macos' | 'windows';
  name: string;
  architecture: string;
  version: string;
  releaseDate: string;
  fileName: string;
  sizeLabel: string;
  downloadUrl: string;
  sha256: string;
  requirement: string;
}
