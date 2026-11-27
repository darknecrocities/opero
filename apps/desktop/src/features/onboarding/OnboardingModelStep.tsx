import React, { useEffect, useState } from 'react';
import { getUiDictionary } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import type { FirstClassLocale, ModelProfile } from '@opero/shared-types';
import { ModelDownloadProgressBar } from '../../components/ModelDownloadProgressBar';
import { useModelPull } from '../../hooks/useModelPull';
import { getDownloadedOllamaModels, isModelDownloadedOnPc } from '../../services/modelAvailability';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';

interface OnboardingModelStepProps {
  locale: FirstClassLocale;
  selectedModelId: string;
  soundEnabled: boolean;
  onSelectModel: (modelId: string) => void;
}

const CAPABILITY_LABELS: Record<string, Record<FirstClassLocale, string>> = {
  draft: { 'en-US': 'Drafting', 'ja-JP': '下書き作成', 'fil-PH': 'Pagsulat' },
  summarize: { 'en-US': 'Summaries', 'ja-JP': '要約', 'fil-PH': 'Buod' },
  translate: { 'en-US': 'Translation', 'ja-JP': '多言語翻訳', 'fil-PH': 'Pagsasalin' },
  reasoning: { 'en-US': 'Reasoning', 'ja-JP': '推論', 'fil-PH': 'Pagsusuri' },
  vision: { 'en-US': 'Vision', 'ja-JP': '画像認識', 'fil-PH': 'Vision' },
  ocr: { 'en-US': 'OCR', 'ja-JP': '文字認識', 'fil-PH': 'OCR' },
};

const RELEASE_MODELS = DEFAULT_MODELS;

function getCapabilityLabel(cap: string, locale: FirstClassLocale): string {
  return CAPABILITY_LABELS[cap]?.[locale] ?? cap;
}

function getHardwareFitLabel(model: ModelProfile, fits: boolean, maxBudget: number, locale: FirstClassLocale): string {
  const estRam = model.estimatedModelRamGb ?? 0;
  const ramStr = `~${estRam.toFixed(1)} GB RAM`;
  const dlStr = model.downloadSizeLabel ?? 'Local';
  if (!fits) {
    if (locale === 'ja-JP') return `${ramStr} · ${dlStr}（目安 ${maxBudget} GB超）`;
    if (locale === 'fil-PH') return `${ramStr} · ${dlStr} (Lampas sa ${maxBudget} GB)`;
    return `${ramStr} · ${dlStr} (Above ${maxBudget} GB budget)`;
  }
  return `${ramStr} · ${dlStr}`;
}

function getCopy(locale: FirstClassLocale) {
  if (locale === 'ja-JP') {
    return {
      downloaded: 'ダウンロード済み',
      downloadBtn: 'ダウンロード',
      downloading: '取得中…',
      refreshBtn: '再確認',
      autoInstallHint: 'Ollamaが未導入の場合、ダウンロード開始時に自動で導入されます。',
      gateNotice: '続行するには、ローカルAIモデルを1つ以上ダウンロードして選択してください。',
    };
  }
  if (locale === 'fil-PH') {
    return {
      downloaded: 'Naka-download na',
      downloadBtn: 'I-download',
      downloading: 'Nagda-download…',
      refreshBtn: 'I-refresh',
      autoInstallHint: 'Kung wala pang Ollama sa PC mo, awtomatiko itong ida-download at ii-install.',
      gateNotice: 'Mag-download at pumili ng kahit isang lokal na AI model para makapagpatuloy.',
    };
  }
  return {
    downloaded: 'Downloaded',
    downloadBtn: 'Download',
    downloading: 'Downloading…',
    refreshBtn: 'Refresh',
    autoInstallHint: 'Ollama is not installed yet — clicking Download will automatically install it for you.',
    gateNotice: 'Download and select at least one local AI model on this computer to continue.',
  };
}

export const OnboardingModelStep: React.FC<OnboardingModelStepProps> = ({
  locale,
  selectedModelId,
  soundEnabled,
  onSelectModel,
}) => {
  const { hardwareProfile, setHardwareProfile } = useOperoStore();
  const { pullJob, isPulling, pullingTag, error, startDownload } = useModelPull();
  const [refreshing, setRefreshing] = useState(false);

  const dict = getUiDictionary(locale);
  const copy = getCopy(locale);
  const recommendedId = hardwareProfile?.recommendedModelId ?? 'ollama-qwen2.5-3b';
  const maxBudget = hardwareProfile?.maxModelRamGb ?? 6.0;
  const autoDownloadAllowed = Boolean(hardwareProfile?.autoDownloadAllowed);
  const downloadedModels = getDownloadedOllamaModels(hardwareProfile);
  const hasAnyDownloaded = downloadedModels.length > 0;

  const refreshHardware = async () => {
    setRefreshing(true);
    try {
      const { hardware } = await operoClient.getHardwareProfile();
      setHardwareProfile(hardware);
    } catch {
      // Daemon offline
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!hardwareProfile) {
      void refreshHardware();
    }
  }, []);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
        <h2 className="onboard-playful-heading onboard-stagger-1">{dict.onboardingModelTitle}</h2>
        <p className="onboard-stagger-2" style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted)', maxWidth: '470px', lineHeight: 1.45 }}>
          {dict.onboardingModelSubtitle}
        </p>
        <div className="onboard-stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2px' }}>
          {hardwareProfile && (
            <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
              {hardwareProfile.cpuName} · {hardwareProfile.totalRamGb} GB RAM · {hardwareProfile.computeMode ?? 'cpu-only'}
            </span>
          )}
          <button
            type="button"
            className="onboard-ghost-btn"
            disabled={refreshing || isPulling}
            onClick={() => void refreshHardware()}
            style={{ padding: '2px 10px', fontSize: '11px' }}
          >
            {refreshing ? '...' : copy.refreshBtn}
          </button>
        </div>
        {hardwareProfile && !autoDownloadAllowed && !hasAnyDownloaded && (
          <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', maxWidth: '470px' }}>
            ISMS Policy (Q3/Q16): Automatic model downloads are disabled. Select Built-In Offline or ask IT to pre-install{' '}
            <code className="mono">qwen2.5:3b</code> / <code className="mono">qwen3:1.7b</code>.
          </div>
        )}
      </div>

      {pullJob && (isPulling || pullJob.phase === 'completed') && (
        <div style={{ width: '100%', maxWidth: '520px' }}>
          <ModelDownloadProgressBar job={pullJob} compact />
        </div>
      )}

      {error && (
        <div role="alert" style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600, maxWidth: '520px' }}>
          {error}
        </div>
      )}

      <div role="radiogroup" aria-label={dict.onboardingModelTitle} className="onboard-model-list onboard-stagger-2">
        {RELEASE_MODELS.map((model) => {
          const downloaded = !model.ollamaTag || isModelDownloadedOnPc(model, hardwareProfile);
          const active = downloaded && model.id === selectedModelId;
          const isRecommended = model.id === recommendedId;
          const isThisDownloading = pullingTag === model.ollamaTag;
          const estRam = model.estimatedModelRamGb ?? 0;
          const fits =
            !hardwareProfile ||
            (hardwareProfile.totalRamGb >= model.ramTierGb && (estRam === 0 || estRam <= maxBudget + 0.1));

          return (
            <div
              key={model.id}
              role={downloaded ? 'radio' : 'group'}
              aria-checked={downloaded ? active : undefined}
              tabIndex={downloaded ? 0 : undefined}
              className={`onboard-model-choice ${active ? 'active' : ''} ${!downloaded ? 'not-downloaded' : ''}`}
              onClick={() => {
                if (!downloaded) return;
                playJiggSfx('click', soundEnabled);
                onSelectModel(model.id);
              }}
              onKeyDown={(e) => {
                if (downloaded && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  playJiggSfx('click', soundEnabled);
                  onSelectModel(model.id);
                }
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: active ? 700 : 600, color: 'var(--ink)' }}>
                    {model.displayName ?? model.modelName}
                  </span>
                  {downloaded && model.ollamaTag && (
                    <span className="status-pill verified" style={{ fontSize: '10px', padding: '1px 7px' }}>
                      {copy.downloaded}
                    </span>
                  )}
                  {isRecommended && (
                    <span className="onboard-model-badge recommended">{dict.onboardingModelRecommended}</span>
                  )}
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                    {model.licenseRef}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', lineHeight: 1.38 }}>
                  {model.shortDescription}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {model.capabilities.map((cap) => (
                    <span key={cap} className="onboard-cap-tag">
                      {getCapabilityLabel(cap, locale)}
                    </span>
                  ))}
                  <span className="mono" style={{ fontSize: '10px', color: fits ? 'var(--ink-muted)' : 'var(--warning)', marginLeft: '3px' }}>
                    {getHardwareFitLabel(model, fits, maxBudget, locale)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {!downloaded && model.ollamaTag ? (
                  autoDownloadAllowed ? (
                    <button
                      type="button"
                      className={`opero-btn ${isRecommended ? 'primary' : ''}`}
                      disabled={isPulling}
                      onClick={(e) => {
                        e.stopPropagation();
                        void startDownload(model.ollamaTag!, model.id, (_hw, id) => onSelectModel(id));
                      }}
                      style={{ minHeight: '30px', padding: '4px 12px', fontSize: '11.5px', borderRadius: '999px' }}
                    >
                      <JiggIcon name="download" size={13} variant="duotone" />
                      <span>
                        {isThisDownloading
                          ? pullJob?.percent != null
                            ? `${Math.round(pullJob.percent)}%`
                            : copy.downloading
                          : copy.downloadBtn}
                      </span>
                    </button>
                  ) : (
                    <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                      IT Pre-Install
                    </span>
                  )
                ) : (
                  <span aria-hidden="true" className={`onboard-model-radio ${active ? 'active' : ''}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hasAnyDownloaded && autoDownloadAllowed && (
        <div
          role="status"
          data-testid="onboarding-model-gate-notice"
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning)', maxWidth: '500px' }}
        >
          {copy.gateNotice}
        </div>
      )}
    </div>
  );
};
