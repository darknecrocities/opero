import React, { useState } from 'react';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';

export const ModelsPanel: React.FC = () => {
  const { activeModelId, hardwareProfile, soundEnabled, setActiveModelId, setHardwareProfile } = useOperoStore();
  const [downloadingTag, setDownloadingTag] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isInstalled = (ollamaTag?: string): boolean => {
    if (!ollamaTag) return true;
    const list = hardwareProfile?.installedModels ?? [];
    return list.some((m) => m === ollamaTag || m.startsWith(`${ollamaTag}-`));
  };

  const handleDownload = async (tag: string, modelId: string) => {
    playJiggSfx('step', soundEnabled);
    setDownloadingTag(tag);
    setError(null);
    setNotice(null);
    try {
      const { hardware } = await operoClient.pullModel(tag);
      setHardwareProfile(hardware);
      setActiveModelId(modelId);
      setNotice(`Downloaded and selected ${tag}.`);
      playJiggSfx('success', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download model right now.');
    } finally {
      setDownloadingTag(null);
    }
  };

  return (
    <section
      className="glass-regular"
      aria-label="AI Models and Hardware Fit"
      style={{
        borderRadius: '20px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '720px',
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
          Choose Your AI Model
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '3px' }}>
          {hardwareProfile
            ? `Your computer: ${hardwareProfile.cpuName} · ${hardwareProfile.totalRamGb} GB memory · ${hardwareProfile.freeDiskGb} GB free storage`
            : 'Pick the model that best matches your computer memory and speed preference.'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {DEFAULT_MODELS.map((m) => {
          const active = m.id === activeModelId;
          const installed = isInstalled(m.ollamaTag);
          const fits = !hardwareProfile || hardwareProfile.totalRamGb >= m.ramTierGb;

          return (
            <div
              key={m.id}
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: active ? 'var(--brand-sky-soft)' : '#FFFFFF',
                border: active ? '1.5px solid var(--brand-sky)' : '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '220px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                  {m.displayName ?? m.modelName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                  {m.shortDescription}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                  {m.capabilitySummary} · {m.languagesLabel}
                </div>
                <div style={{ fontSize: '11.5px', color: fits ? 'var(--ink-muted)' : 'var(--warning)' }}>
                  Needs {m.ramTierGb} GB+ memory · Download: {m.downloadSizeLabel ?? 'Included'} ·{' '}
                  {fits ? 'Runs smoothly on this computer' : 'May run slowly on this computer'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {m.ollamaTag && !installed && hardwareProfile?.ollamaRunning && (
                  <button
                    type="button"
                    className="opero-btn"
                    disabled={downloadingTag !== null}
                    onClick={() => void handleDownload(m.ollamaTag!, m.id)}
                  >
                    <JiggIcon name="download" size={14} variant="duotone" />
                    <span>{downloadingTag === m.ollamaTag ? 'Downloading...' : 'Download'}</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`opero-btn ${active ? 'primary' : ''}`}
                  onClick={() => {
                    playJiggSfx('click', soundEnabled);
                    setActiveModelId(m.id);
                  }}
                >
                  <span>{active ? 'Selected' : 'Use Model'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {notice && (
        <div role="status" style={{ fontSize: '12.5px', color: 'var(--success)', fontWeight: 600 }}>
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" style={{ fontSize: '12.5px', color: 'var(--danger)', fontWeight: 600 }}>
          {error}
        </div>
      )}
    </section>
  );
};
