import { useCallback, useEffect, useRef, useState } from 'react';
import { playJiggSfx } from '@opero/jiggicons';
import type { HardwareProfile, ModelPullJobStatus } from '@opero/shared-types';
import { operoClient } from '../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../store/useOperoStore';

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

const MAX_TRANSIENT_ERRORS = 8;

export function useModelPull(): UseModelPullResult {
  const { soundEnabled, setHardwareProfile, setActiveModelId } = useOperoStore();
  const [pullJob, setPullJob] = useState<ModelPullJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const pollTokenRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    pollTokenRef.current += 1;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const beginPollingJob = useCallback(
    (
      jobId: string,
      modelId: string,
      onCompleted?: (hardware: HardwareProfile, modelId: string) => void,
    ) => {
      stopPolling();
      const myToken = pollTokenRef.current;
      let transientErrors = 0;

      const scheduleNext = (delayMs: number) => {
        if (!mountedRef.current || pollTokenRef.current !== myToken) return;
        timerRef.current = window.setTimeout(() => {
          void pollOnce();
        }, delayMs);
      };

      const pollOnce = async () => {
        if (!mountedRef.current || pollTokenRef.current !== myToken) return;
        try {
          const { status: next } = await operoClient.getModelPullStatus(jobId);
          if (!mountedRef.current || pollTokenRef.current !== myToken) return;
          transientErrors = 0;
          setError(null);
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
          } else {
            scheduleNext(450);
          }
        } catch (pollErr) {
          if (!mountedRef.current || pollTokenRef.current !== myToken) return;
          transientErrors += 1;
          if (transientErrors <= MAX_TRANSIENT_ERRORS) {
            scheduleNext(900);
            return;
          }
          stopPolling();
          const msg =
            pollErr instanceof Error && !/aborted/i.test(pollErr.message)
              ? pollErr.message
              : 'Connection interrupted while tracking download. Click Refresh to check status.';
          setError(msg);
        }
      };

      scheduleNext(350);
    },
    [soundEnabled, setHardwareProfile, setActiveModelId, stopPolling],
  );

  useEffect(() => {
    mountedRef.current = true;
    void operoClient
      .getActiveModelPull()
      .then(({ status }) => {
        if (!mountedRef.current || !status) return;
        setPullJob(status);
        const matched = DEFAULT_MODELS.find((m) => m.ollamaTag === status.modelTag);
        if (matched) {
          beginPollingJob(status.jobId, matched.id);
        }
      })
      .catch(() => {});

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [beginPollingJob, stopPolling]);

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
        beginPollingJob(jobId, modelId, onCompleted);
      } catch (startErr) {
        if (!mountedRef.current) return;
        setError(startErr instanceof Error ? startErr.message : 'Unable to start model download.');
      }
    },
    [soundEnabled, stopPolling, beginPollingJob],
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
