import { useCallback, useEffect, useRef, useState } from 'react';
import { playJiggSfx } from '@opero/jiggicons';
import type { HardwareProfile, ModelPullJobStatus } from '@opero/shared-types';
import { operoClient } from '../services/operoClient';
import { useOperoStore } from '../store/useOperoStore';

export interface UseModelPullResult {
  pullJob: ModelPullJobStatus | null;
  isPulling: boolean;
  pullingTag: string | null;
  error: string | null;
  startDownload: (
    ollamaTag: string,
    modelId: string,
    onCompleted?: (hardware: HardwareProfile, modelId: string) => void,
  ) => Promise<void>;
  clearError: () => void;
}

export function useModelPull(): UseModelPullResult {
  const { soundEnabled, setHardwareProfile, setActiveModelId } = useOperoStore();
  const [pullJob, setPullJob] = useState<ModelPullJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);

  const stopPolling = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const startDownload = useCallback(
    async (
      ollamaTag: string,
      modelId: string,
      onCompleted?: (hardware: HardwareProfile, modelId: string) => void,
    ) => {
      stopPolling();
      setError(null);
      playJiggSfx('step', soundEnabled);

      try {
        const { jobId, status } = await operoClient.startModelPull(ollamaTag);
        if (!mountedRef.current) return;
        setPullJob(status);

        const poll = async () => {
          try {
            const { status: next } = await operoClient.getModelPullStatus(jobId);
            if (!mountedRef.current) return;
            setPullJob(next);

            if (next.phase === 'completed') {
              stopPolling();
              const hw = next.hardware ?? (await operoClient.getHardwareProfile()).hardware;
              if (!mountedRef.current) return;
              setHardwareProfile(hw);
              setActiveModelId(modelId);
              playJiggSfx('success', soundEnabled);
              onCompleted?.(hw, modelId);
            } else if (next.phase === 'failed') {
              stopPolling();
              setError(next.error ?? 'Model download failed.');
            }
          } catch (pollErr) {
            if (!mountedRef.current) return;
            stopPolling();
            setError(
              pollErr instanceof Error ? pollErr.message : 'Lost connection while tracking download.',
            );
          }
        };

        timerRef.current = window.setInterval(() => {
          void poll();
        }, 350);
      } catch (startErr) {
        if (!mountedRef.current) return;
        setError(startErr instanceof Error ? startErr.message : 'Unable to start model download.');
      }
    },
    [soundEnabled, setHardwareProfile, setActiveModelId, stopPolling],
  );

  const isPulling =
    pullJob !== null && pullJob.phase !== 'completed' && pullJob.phase !== 'failed';

  return {
    pullJob,
    isPulling,
    pullingTag: isPulling ? pullJob.modelTag : null,
    error,
    startDownload,
    clearError: () => setError(null),
  };
}
