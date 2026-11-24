import React, { useState } from 'react';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import type { UpdateCheckResult } from '@opero/shared-types';
import { operoClient } from '../../services/operoClient';
import { useOperoStore } from '../../store/useOperoStore';

export const UpdatesPanel: React.FC = () => {
  const { soundEnabled } = useOperoStore();
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [info, setInfo] = useState<UpdateCheckResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    playJiggSfx('click', soundEnabled);
    setChecking(true);
    setError(null);
    setMessage(null);
    try {
      const { update } = await operoClient.checkForUpdates();
      setInfo(update);
      playJiggSfx('success', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check official releases right now.');
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!info?.assetDownloadUrl) return;
    playJiggSfx('step', soundEnabled);
    setInstalling(true);
    setError(null);
    try {
      const { result } = await operoClient.installUpdate(info.assetDownloadUrl, info.expectedSha256);
      setMessage(result.message);
      playJiggSfx('success', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update installation failed.');
    } finally {
      setInstalling(false);
    }
  };

  return (
    <section
      className="glass-regular"
      aria-label="Official App Updates"
      style={{
        borderRadius: '20px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        maxWidth: '620px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>
            Official Updates
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
            Channel: <span className="mono">main</span> · Replaces existing install cleanly (data preserved)
          </div>
        </div>
        <button
          type="button"
          className="opero-btn primary"
          disabled={checking || installing}
          onClick={() => void handleCheck()}
        >
          <JiggIcon name="refresh" size={15} variant="duotone" />
          <span>{checking ? 'Checking...' : 'Check for Updates'}</span>
        </button>
      </div>

      {info && (
        <div
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: '#FFFFFF',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div className="mono" style={{ fontSize: '12px' }}>
              Installed: <strong>v{info.currentVersion}</strong> · Official: <strong>v{info.latestVersion}</strong>
            </div>
            <span className={`status-pill ${info.updateAvailable ? 'paused' : 'verified'}`}>
              {info.updateAvailable ? `Update available: v${info.latestVersion}` : 'Up to date'}
            </span>
          </div>

          {info.releaseNotes && (
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-muted)', whiteSpace: 'pre-line', maxHeight: '140px', overflowY: 'auto' }}>
              {info.releaseNotes}
            </p>
          )}

          {info.assetDownloadUrl && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="opero-btn primary"
                disabled={installing}
                onClick={() => void handleInstall()}
              >
                <JiggIcon name="download" size={15} variant="duotone" />
                <span>
                  {installing
                    ? 'Downloading & Replacing...'
                    : info.updateAvailable
                      ? `Download & Replace with v${info.latestVersion}`
                      : `Reinstall Clean Official v${info.latestVersion}`}
                </span>
              </button>
              {info.expectedSha256 && (
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                  SHA-256: {info.expectedSha256.slice(0, 12)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {message && (
        <div role="status" className="status-pill verified">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="status-pill paused">
          {error}
        </div>
      )}
    </section>
  );
};
