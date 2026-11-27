import type { HardwareProfile, ModelProfile } from '@opero/shared-types';
import { DEFAULT_MODELS } from '../store/defaults';

export function isOllamaTagInstalled(
  ollamaTag: string | undefined,
  hardwareProfile: HardwareProfile | null,
): boolean {
  if (!ollamaTag) return false;
  const installed = hardwareProfile?.installedModels ?? [];
  const lower = ollamaTag.toLowerCase();
  return installed.some((raw) => {
    const m = raw.toLowerCase();
    return m === lower || m.startsWith(`${lower}-`) || m === `${lower}:latest`;
  });
}

export function isModelDownloadedOnPc(
  model: ModelProfile,
  hardwareProfile: HardwareProfile | null,
): boolean {
  if (!model.ollamaTag) return false;
  return isOllamaTagInstalled(model.ollamaTag, hardwareProfile);
}

export function isModelSelectableInApp(
  model: ModelProfile,
  hardwareProfile: HardwareProfile | null,
): boolean {
  if (!model.ollamaTag) return true;
  return isOllamaTagInstalled(model.ollamaTag, hardwareProfile);
}

export function getDownloadedOllamaModels(
  hardwareProfile: HardwareProfile | null,
): readonly ModelProfile[] {
  return DEFAULT_MODELS.filter((m) => isModelDownloadedOnPc(m, hardwareProfile));
}

export function resolveValidActiveModelId(
  currentModelId: string,
  hardwareProfile: HardwareProfile | null,
): string {
  const current = DEFAULT_MODELS.find((m) => m.id === currentModelId);
  if (current && isModelDownloadedOnPc(current, hardwareProfile)) {
    return current.id;
  }
  const downloaded = getDownloadedOllamaModels(hardwareProfile);
  const recommendedDownloaded = downloaded.find(
    (m) => m.id === hardwareProfile?.recommendedModelId,
  );
  if (recommendedDownloaded) return recommendedDownloaded.id;
  if (downloaded[0]) return downloaded[0].id;
  return 'offline-deterministic';
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${Math.round(bytes)} B`;
}

export function formatSpeed(bytesPerSec: number | null | undefined): string | null {
  if (!bytesPerSec || bytesPerSec <= 0) return null;
  return `${formatBytes(bytesPerSec)}/s`;
}
