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

  const recommendedModel = DEFAULT_MODELS.find((m) => m.id === hardwareProfile?.recommendedModelId);

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
        maxWidth: '760px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
            Choose Your AI Model
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '3px', lineHeight: 1.5 }}>
            {hardwareProfile
              ? `${hardwareProfile.cpuName} (${hardwareProfile.cpuCores} threads) · ${hardwareProfile.totalRamGb} GB RAM · ${hardwareProfile.gpuName ?? 'Integrated'} (${hardwareProfile.computeMode ?? 'cpu-only'}) · Model RAM budget ≤ ${hardwareProfile.maxModelRamGb ?? 6} GB`
              : 'Pick the commercial-safe local model that best matches your PC memory and CPU/GPU speed.'}
          </div>
          {hardwareProfile?.recommendationReason && (
            <div style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '6px' }}>
              Auto-Recommendation: <strong>{recommendedModel?.displayName ?? hardwareProfile.recommendedModelId}</strong> — {hardwareProfile.recommendationReason}
            </div>
          )}
        </div>

        {recommendedModel && activeModelId !== recommendedModel.id && (
          <button
            type="button"
            className="opero-btn primary"
            onClick={() => {
              playJiggSfx('click', soundEnabled);
              setActiveModelId(recommendedModel.id);
              setNotice(`Applied hardware-recommended model: ${recommendedModel.displayName ?? recommendedModel.modelName}`);
            }}
            style={{ minHeight: '32px', fontSize: '12px', flexShrink: 0 }}
          >
            Apply Recommended
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {DEFAULT_MODELS.map((m) => {
          const active = m.id === activeModelId;
          const isRecommended = m.id === hardwareProfile?.recommendedModelId;
          const installed = isInstalled(m.ollamaTag);
          const maxBudget = hardwareProfile?.maxModelRamGb ?? 6.0;
          const estRam = m.estimatedModelRamGb ?? 0;
          const fits =
            !hardwareProfile ||
            (hardwareProfile.totalRamGb >= m.ramTierGb && (estRam === 0 || estRam <= maxBudget + 0.1));

          return (
            <div
              key={m.id}
              style={{
                padding: '13px 16px',
                borderRadius: '14px',
                background: active ? 'var(--brand-sky-soft)' : 'var(--bg-surface)',
                border: active ? '1.5px solid var(--brand-sky)' : isRecommended ? '1.5px solid var(--border-strong)' : '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>
                    {m.displayName ?? m.modelName}
                  </span>
                  {isRecommended && (
                    <span className="status-pill verified" style={{ fontSize: '10.5px', padding: '1px 8px' }}>
                      Recommended for this PC
                    </span>
                  )}
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    {m.licenseRef}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
                  {m.shortDescription}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                  {m.capabilitySummary} · {m.languagesLabel}
                </div>
                <div style={{ fontSize: '11.5px', color: fits ? 'var(--ink-muted)' : 'var(--warning)' }}>
                  Est. Model RAM: {estRam > 0 ? `~${estRam.toFixed(1)} GB` : '0 GB'} · Download: {m.downloadSizeLabel ?? 'Included'} ·{' '}
                  {fits ? 'Fits smoothly within this PC budget' : `Exceeds ≤${maxBudget} GB CPU budget on this PC`}
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
