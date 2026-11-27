import { create } from 'zustand';
import type { HardwareProfile, OllamaRuntimeStatus } from '@opero/shared-types';
import { operoClient } from '../services/operoClient';
import { DEFAULT_MODELS } from './defaults';

export interface EnsureRuntimeOptions {
  pullIfMissing?: boolean;
  force?: boolean;
  onHardwareUpdated?: (hw: HardwareProfile) => void;
}

export interface RuntimeStoreState {
  runtime: OllamaRuntimeStatus | null;
  starting: boolean;
  manualOffline: boolean;
  autoStartAttemptedKey: string | null;
  setManualOffline: (offline: boolean) => void;
  refreshRuntime: (modelTag?: string) => Promise<OllamaRuntimeStatus | null>;
  ensureRuntime: (modelTag?: string, opts?: EnsureRuntimeOptions) => Promise<OllamaRuntimeStatus | null>;
}

let inFlightEnsure: Promise<OllamaRuntimeStatus | null> | null = null;

export async function waitForDaemonHealth(maxAttempts = 8, delayMs = 300) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operoClient.health();
    } catch (err) {
      lastError = err;
      if (attempt + 1 < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError ?? new Error('OPERO daemon unavailable');
}

export function resolvePreferredOllamaTag(
  activeModelId: string,
  hardwareProfile: HardwareProfile | null,
  manualOffline: boolean,
): string | null {
  if (manualOffline) return 'offline';
  const activeModel = DEFAULT_MODELS.find((m) => m.id === activeModelId);
  if (activeModel?.ollamaTag) return activeModel.ollamaTag;
  if (hardwareProfile?.installedModels?.[0]) return hardwareProfile.installedModels[0];
  if (hardwareProfile?.ollamaBinaryAvailable) return 'qwen2.5:3b';
  return null;
}

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => ({
  runtime: null,
  starting: false,
  manualOffline: false,
  autoStartAttemptedKey: null,

  setManualOffline: (manualOffline) => {
    set({ manualOffline, autoStartAttemptedKey: manualOffline ? 'offline' : null });
  },

  refreshRuntime: async (modelTag) => {
    try {
      const { runtime } = await operoClient.getModelRuntimeStatus(modelTag);
      set({ runtime });
      return runtime;
    } catch {
      return null;
    }
  },

  ensureRuntime: async (modelTag, opts) => {
    const cleanTag = modelTag?.trim() || undefined;
    if (cleanTag === 'offline') {
      return get().refreshRuntime('offline');
    }

    const attemptKey = cleanTag ?? '__default__';
    if (!opts?.force && inFlightEnsure) {
      return inFlightEnsure;
    }

    set({ starting: true, autoStartAttemptedKey: attemptKey });
    const run = (async () => {
      try {
        const { runtime } = await operoClient.ensureModelRuntime({
          modelTag: cleanTag,
          pullIfMissing: opts?.pullIfMissing ?? false,
        });
        set({ runtime });
        if (runtime.running && opts?.onHardwareUpdated) {
          const hw = await operoClient.getHardwareProfile().catch(() => null);
          if (hw?.hardware) opts.onHardwareUpdated(hw.hardware);
        }
        return runtime;
      } catch {
        return get().refreshRuntime(cleanTag);
      } finally {
        inFlightEnsure = null;
        set({ starting: false });
      }
    })();

    inFlightEnsure = run;
    return run;
  },
}));
