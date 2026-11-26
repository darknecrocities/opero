import React from 'react';
import { getFeatureStrings, getUiDictionary, LOCALE_MODEL_MAP } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import type { ExportFormat, FirstClassLocale } from '@opero/shared-types';
import { DEFAULT_MODELS, useOperoStore } from '../store/useOperoStore';

export const RightUtilityRail: React.FC = () => {
  const {
    uiLocale,
    targetLocale,
    activeModelId,
    hardwareProfile,
    speechEnabled,
    soundEnabled,
    memoryStats,
    memoryHits,
    lastExportNotice,
    setTargetLocale,
    setUiLocale,
    setActiveModelId,
    setSpeechEnabled,
    setNavMode,
    runExport,
  } = useOperoStore();
  const dict = getUiDictionary(uiLocale);
  const feat = getFeatureStrings(uiLocale);
  const activeModel = DEFAULT_MODELS.find((m) => m.id === activeModelId) ?? DEFAULT_MODELS[0];

  const exportRows: { fmt: ExportFormat; icon: string; label: string; keyHint: string }[] = [
    { fmt: 'pdf', icon: 'export-pdf', label: 'PDF', keyHint: '⌘E' },
    { fmt: 'docx', icon: 'export-docx', label: 'Word (.docx)', keyHint: '⌘⇧D' },
    { fmt: 'markdown', icon: 'export-md', label: 'Markdown', keyHint: '⌘⇧M' },
    { fmt: 'html', icon: 'export-html', label: 'HTML', keyHint: '⌘⇧H' },
  ];

  return (
    <aside className="opero-right-rail" aria-label="Workspace Utility Rail">
      <section className="rail-panel" aria-label={feat.aiModelTitle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <JiggIcon name="router" size={16} variant="duotone" />
            <span>{feat.aiModelTitle}</span>
          </strong>
          <button
            type="button"
            className="opero-btn"
            onClick={() => setNavMode('settings')}
            style={{ minHeight: '24px', padding: '2px 7px', fontSize: '11px' }}
          >
            {feat.allModelsBtn}
          </button>
        </div>

        <select
          aria-label="Active AI Model"
          value={activeModelId}
          onChange={(e) => {
            playJiggSfx('click', soundEnabled);
            setActiveModelId(e.target.value);
          }}
          style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '7px 8px',
            fontSize: '12.5px',
            fontWeight: 600,
            background: 'var(--bg-surface)',
            color: 'var(--ink)',
          }}
        >
          {DEFAULT_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName ?? m.modelName} ({m.ramTierGb} GB+)
            </option>
          ))}
        </select>

        {activeModel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', lineHeight: 1.45 }}>
              {activeModel.shortDescription}
            </div>
            {hardwareProfile && (
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                {hardwareProfile.cpuName} · {hardwareProfile.totalRamGb} GB
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rail-panel" aria-label={dict.ocrVoiceTitle}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <JiggIcon name="translate" size={16} variant="duotone" />
          <span>{dict.ocrVoiceTitle}</span>
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>{feat.manualLanguageLabel}</span>
            <select
              aria-label="Document Language"
              value={targetLocale}
              onChange={(e) => setTargetLocale(e.target.value as FirstClassLocale)}
              style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', fontSize: '12px', background: 'var(--bg)', color: 'var(--ink)' }}
            >
              {Object.values(LOCALE_MODEL_MAP).map((loc) => (
                <option key={loc.productLocale} value={loc.productLocale}>
                  {loc.displayLabel}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>{feat.appLanguageLabel}</span>
            <select
              aria-label="App Language"
              value={uiLocale}
              onChange={(e) => setUiLocale(e.target.value as FirstClassLocale)}
              style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', fontSize: '12px', background: 'var(--bg)', color: 'var(--ink)' }}
            >
              <option value="en-US">English (en-US)</option>
              <option value="ja-JP">日本語 (ja-JP)</option>
              <option value="fil-PH">Filipino (fil-PH)</option>
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <span style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <JiggIcon name="voice" size={14} variant="outline" />
              <span>{feat.voiceLabel}</span>
            </span>
            <button
              type="button"
              className="opero-btn"
              onClick={() => {
                playJiggSfx('click', soundEnabled);
                setSpeechEnabled(!speechEnabled);
              }}
              style={{ minHeight: '28px', padding: '2px 8px', fontSize: '11px' }}
            >
              {speechEnabled ? feat.micOn : feat.micOff}
            </button>
          </div>
        </div>
      </section>

      <section className="rail-panel" aria-label={dict.dualCoreTitle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <JiggIcon name="memory" size={16} variant="duotone" />
            <span>{dict.dualCoreTitle}</span>
          </strong>
          <button
            type="button"
            className="opero-btn"
            onClick={() => setNavMode('settings')}
            style={{ minHeight: '24px', padding: '2px 7px', fontSize: '11px' }}
          >
            {feat.manageBtn}
          </button>
        </div>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>E: {memoryStats.episodicCount}</span>
          <span>S: {memoryStats.semanticCount}</span>
          <span>{(memoryStats.estimatedRamBytes / 1024).toFixed(1)} KB</span>
        </div>
        {memoryHits.slice(0, 2).map((h) => (
          <div
            key={h.chunk.id}
            style={{
              fontSize: '11px',
              padding: '6px 8px',
              borderRadius: '8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontWeight: 600 }}>{h.chunk.title}</div>
          </div>
        ))}
      </section>

      <section className="rail-panel" aria-label={dict.exportTitle}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <JiggIcon name="export" size={16} variant="duotone" />
          <span>{dict.exportTitle}</span>
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {exportRows.map((row) => (
            <button
              key={row.fmt}
              type="button"
              className="nav-item"
              onClick={() => void runExport(row.fmt)}
              style={{ padding: '7px 8px', border: '1px solid var(--border)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <JiggIcon name={row.icon} size={15} variant="duotone" />
                <span>{row.label}</span>
              </span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{row.keyHint}</span>
            </button>
          ))}
        </div>
        {lastExportNotice && (
          <div role="status" className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)', paddingTop: '4px' }}>
            {lastExportNotice}
          </div>
        )}
      </section>
    </aside>
  );
};
