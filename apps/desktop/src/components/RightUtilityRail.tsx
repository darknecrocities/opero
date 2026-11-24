import React from 'react';
import { getUiDictionary, LOCALE_MODEL_MAP } from '@opero/i18n';
import { JiggIcon } from '@opero/jiggicons';
import type { ExportFormat, FirstClassLocale } from '@opero/shared-types';
import { DEFAULT_MODELS, useOperoStore } from '../store/useOperoStore';

export const RightUtilityRail: React.FC = () => {
  const {
    uiLocale,
    targetLocale,
    activeModelId,
    speechEnabled,
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

  const exportRows: { fmt: ExportFormat; icon: string; label: string; keyHint: string }[] = [
    { fmt: 'pdf', icon: 'export-pdf', label: 'Export PDF Manual', keyHint: '⌘E' },
    { fmt: 'docx', icon: 'export-docx', label: 'Export Word (.docx)', keyHint: '⌘⇧D' },
    { fmt: 'markdown', icon: 'export-md', label: 'Export as Markdown', keyHint: '⌘⇧M' },
    { fmt: 'html', icon: 'export-html', label: 'Export Offline HTML', keyHint: '⌘⇧H' },
  ];

  return (
    <aside className="opero-right-rail" aria-label="Model Router, Dual-Core Memory, and Export Controls">
      <section className="rail-panel" aria-label={dict.modelRouterTitle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <JiggIcon name="router" size={16} variant="duotone" />
            <span>{dict.modelRouterTitle}</span>
          </strong>
          <span className="status-pill verified" style={{ fontSize: '10px', padding: '2px 7px' }}>Local-Only</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {DEFAULT_MODELS.map((m) => {
            const active = m.id === activeModelId;
            return (
              <button
                key={m.id}
                type="button"
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setActiveModelId(m.id)}
                style={{ padding: '7px 9px', border: active ? '1px solid var(--border-strong)' : '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'start' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.modelName}</span>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                    {m.ramTierGb}GB · {m.quantization} · {m.licenseRef}
                  </span>
                </div>
                {active && <JiggIcon name="verified" size={15} variant="duotone" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rail-panel" aria-label={dict.ocrVoiceTitle}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <JiggIcon name="translate" size={16} variant="duotone" />
          <span>{dict.ocrVoiceTitle}</span>
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Target Manual Language (BCP-47)</span>
            <select
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
            <span>App UI Locale</span>
            <select
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
              <span>Opt-In Whisper ASR</span>
            </span>
            <button
              type="button"
              className="opero-btn"
              onClick={() => setSpeechEnabled(!speechEnabled)}
              style={{ minHeight: '28px', padding: '2px 8px', fontSize: '11px' }}
            >
              {speechEnabled ? 'Mic: OPT-IN' : 'Mic: OFF'}
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
            onClick={() => setNavMode('memory')}
            style={{ minHeight: '24px', padding: '2px 7px', fontSize: '11px' }}
          >
            Inspect
          </button>
        </div>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Core 1: {memoryStats.episodicCount}</span>
          <span>Core 2: {memoryStats.semanticCount}</span>
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
            <div className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
              {h.chunk.coreType} · {h.chunk.locale} · RRF {h.rrfScore.toFixed(3)}
            </div>
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
          <div role="status" className="mono" style={{ fontSize: '11px', color: 'var(--success)', paddingTop: '4px' }}>
            {lastExportNotice}
          </div>
        )}
      </section>
    </aside>
  );
};
