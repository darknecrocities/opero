import React, { useState } from 'react';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { ModelDownloadProgressBar } from '../../components/ModelDownloadProgressBar';
import { useModelPull } from '../../hooks/useModelPull';
import { isModelDownloadedOnPc, isModelSelectableInApp } from '../../services/modelAvailability';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';

export const ModelsPanel: React.FC = () => {
  const { activeModelId, hardwareProfile, soundEnabled, setActiveModelId, setHardwareProfile } = useOperoStore();
  const { pullJob, isPulling, pullingTag, error: pullError, startDownload } = useModelPull();
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  const handleDelete = async (tag: string, label: string) => {
    setDeletingTag(tag);
    setNotice(null);
    playJiggSfx('click', soundEnabled);
    try {
      const { hardware } = await operoClient.deleteModel(tag);
      setHardwareProfile(hardware);
      setNotice(`Removed ${label} from this PC.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : `Could not remove ${label}.`);
    } finally {
      setDeletingTag(null);
    }
  };

  const recommendedModel = DEFAULT_MODELS.find((m) => m.id === hardwareProfile?.recommendedModelId);
  const recommendedInstalled = recommendedModel
    ? isModelSelectableInApp(recommendedModel, hardwareProfile)
    : false;
  const autoDownloadAllowed = Boolean(hardwareProfile?.autoDownloadAllowed);

  const handleRefresh = async () => {
    setRefreshing(true);
    setNotice(null);
    try {
      const { hardware } = await operoClient.getHardwareProfile();
      setHardwareProfile(hardware);
      setNotice(`Detected ${hardware.installedModels.length} downloaded local model(s).`);
    } finally {
      setRefreshing(false);
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className="opero-btn"
            disabled={refreshing || isPulling}
            onClick={() => void handleRefresh()}
            style={{ minHeight: '32px', fontSize: '12px' }}
          >
            {refreshing ? 'Checking...' : 'Refresh'}
          </button>

          {recommendedModel && activeModelId !== recommendedModel.id && (
            recommendedInstalled ? (
              <button
                type="button"
                className="opero-btn primary"
                onClick={() => {
                  playJiggSfx('click', soundEnabled);
                  setActiveModelId(recommendedModel.id);
                  setNotice(`Applied hardware-recommended model: ${recommendedModel.displayName ?? recommendedModel.modelName}`);
                }}
                style={{ minHeight: '32px', fontSize: '12px' }}
              >
                Apply Recommended
              </button>
            ) : autoDownloadAllowed && recommendedModel.ollamaTag ? (
              <button
                type="button"
                className="opero-btn primary"
                disabled={isPulling}
                onClick={() => {
                  setNotice(null);
                  void startDownload(recommendedModel.ollamaTag!, recommendedModel.id, () => {
                    setNotice(`Downloaded and selected ${recommendedModel.displayName ?? recommendedModel.modelName}.`);
                  });
                }}
                style={{ minHeight: '32px', fontSize: '12px' }}
              >
                <JiggIcon name="download" size={14} variant="duotone" />
                <span>Download Recommended</span>
              </button>
            ) : null
          )}
        </div>
      </div>

      {pullJob && (isPulling || pullJob.phase === 'completed') && (
        <ModelDownloadProgressBar job={pullJob} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {DEFAULT_MODELS.map((m) => {
          const downloaded = isModelDownloadedOnPc(m, hardwareProfile);
          const selectable = isModelSelectableInApp(m, hardwareProfile);
          const active = selectable && m.id === activeModelId;
          const isRecommended = m.id === hardwareProfile?.recommendedModelId;
          const isThisDownloading = pullingTag === m.ollamaTag;
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
                  {downloaded && (
                    <span className="status-pill verified" style={{ fontSize: '10.5px', padding: '1px 8px' }}>
                      Downloaded
                    </span>
                  )}
                  {isRecommended && (
                    <span className="status-pill" style={{ fontSize: '10.5px', padding: '1px 8px', background: 'var(--brand-sky-soft)', color: '#0F172A' }}>
                      Recommended for this PC
                    </span>
                  )}
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    {m.licenseRef}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink)' }}>{m.shortDescription}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                  {m.capabilitySummary} · {m.languagesLabel}
                </div>
                <div style={{ fontSize: '11.5px', color: fits ? 'var(--ink-muted)' : 'var(--warning)' }}>
                  Est. Model RAM: {estRam > 0 ? `~${estRam.toFixed(1)} GB` : '0 GB'} · Download: {m.downloadSizeLabel ?? 'Included'} ·{' '}
                  {fits ? 'Fits smoothly within this PC budget' : `Exceeds ≤${maxBudget} GB CPU budget on this PC`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {m.ollamaTag && !downloaded ? (
                  autoDownloadAllowed ? (
                    <button
                      type="button"
                      className={`opero-btn ${isRecommended ? 'primary' : ''}`}
                      disabled={isPulling}
                      onClick={() => {
                        setNotice(null);
                        void startDownload(m.ollamaTag!, m.id, () => {
                          setNotice(`Downloaded and selected ${m.displayName ?? m.modelName}.`);
                        });
                      }}
                    >
                      <JiggIcon name="download" size={14} variant="duotone" />
                      <span>
                        {isThisDownloading
                          ? pullJob?.percent != null
                            ? `Downloading ${Math.round(pullJob.percent)}%`
                            : 'Downloading...'
                          : 'Download'}
                      </span>
                    </button>
                  ) : (
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                      IT Pre-Install ({m.ollamaTag})
                    </span>
                  )
                ) : (
                  <>
                    <button
                      type="button"
                      className={`opero-btn ${active ? 'primary' : ''}`}
                      disabled={!selectable}
                      onClick={() => {
                        if (!selectable) return;
                        playJiggSfx('click', soundEnabled);
                        setActiveModelId(m.id);
                      }}
                    >
                      <span>{active ? 'Selected' : 'Use Model'}</span>
                    </button>
                    {m.ollamaTag && downloaded && (
                      <button
                        type="button"
                        className="opero-btn"
                        aria-label={`Remove ${m.displayName ?? m.modelName}`}
                        disabled={isPulling || deletingTag !== null}
                        onClick={() => void handleDelete(m.ollamaTag!, m.displayName ?? m.modelName)}
                        style={{ minHeight: '32px', padding: '4px 10px', fontSize: '11.5px', color: 'var(--danger)' }}
                      >
                        {deletingTag === m.ollamaTag ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </>
                )}
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
      {pullError && (
        <div role="alert" style={{ fontSize: '12.5px', color: 'var(--danger)', fontWeight: 600 }}>
          {pullError}
        </div>
      )}
    </section>
  );
};
