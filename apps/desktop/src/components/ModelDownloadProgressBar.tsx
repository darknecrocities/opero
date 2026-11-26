import React from 'react';
import type { ModelPullJobStatus } from '@opero/shared-types';
import { formatBytes, formatSpeed } from '../services/modelAvailability';

interface ModelDownloadProgressBarProps {
  job: ModelPullJobStatus;
  compact?: boolean;
}

const PHASE_PREFIX: Record<string, string> = {
  checking_runtime: 'Checking Ollama runtime',
  installing_ollama: 'Auto-installing Ollama',
  starting_ollama: 'Starting Ollama server',
  pulling_model: 'Downloading model',
  verifying: 'Verifying integrity',
  completed: 'Download complete',
  failed: 'Download failed',
};

export const ModelDownloadProgressBar: React.FC<ModelDownloadProgressBarProps> = ({
  job,
  compact = false,
}) => {
  const hasRealPercent = typeof job.percent === 'number' && Number.isFinite(job.percent);
  const clampedPct = hasRealPercent ? Math.max(0, Math.min(100, job.percent as number)) : null;
  const speedText = formatSpeed(job.speedBytesPerSec);
  const bytesText =
    job.totalBytes > 0
      ? `${formatBytes(job.completedBytes)} / ${formatBytes(job.totalBytes)}`
      : job.completedBytes > 0
        ? formatBytes(job.completedBytes)
        : null;

  const headline = job.statusText || PHASE_PREFIX[job.phase] || job.phase;

  return (
    <div
      role="status"
      aria-live="polite"
      className="opero-pull-progress"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '5px' : '7px',
        padding: compact ? '8px 10px' : '10px 14px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.04)',
        border: '1px solid var(--border)',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: compact ? '11px' : '12px',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {headline}
        </span>
        {clampedPct !== null && (
          <span className="mono" style={{ fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>
            {clampedPct.toFixed(1)}%
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-label={headline}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedPct !== null ? Math.round(clampedPct) : undefined}
        style={{
          position: 'relative',
          width: '100%',
          height: compact ? '6px' : '8px',
          borderRadius: '999px',
          background: 'rgba(15, 23, 42, 0.1)',
          overflow: 'hidden',
        }}
      >
        {clampedPct !== null ? (
          <div
            style={{
              height: '100%',
              width: `${clampedPct}%`,
              borderRadius: '999px',
              background:
                job.phase === 'completed'
                  ? 'var(--success)'
                  : 'linear-gradient(90deg, #0F172A 0%, #69BCFC 100%)',
              transition: 'width 180ms linear',
            }}
          />
        ) : (
          <div className="opero-progress-indeterminate" />
        )}
      </div>

      {(bytesText || speedText) && (
        <div
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: compact ? '10px' : '11px',
            color: 'var(--ink-muted)',
          }}
        >
          <span>{bytesText ?? job.modelTag}</span>
          {speedText && <span>{speedText}</span>}
        </div>
      )}
    </div>
  );
};
