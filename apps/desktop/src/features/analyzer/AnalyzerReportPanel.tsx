import React, { useState } from 'react';
import { getFeatureStrings } from '@opero/i18n';
import { JiggIcon } from '@opero/jiggicons';
import type { AnalyzedDocument, DocumentAnnotation, ExportFormat } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';

type InspectorTab = 'summary' | 'annotations' | 'report';

interface AnalyzerReportPanelProps {
  doc: AnalyzedDocument;
  selectedAnnId: string | null;
  exportNotice: string | null;
  busyExport: boolean;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (ann: DocumentAnnotation) => void;
  onCompileAndExport: (format?: ExportFormat) => void;
}

const EXPORT_FORMATS: ExportFormat[] = ['pdf', 'docx', 'html', 'markdown'];

export const AnalyzerReportPanel: React.FC<AnalyzerReportPanelProps> = ({
  doc,
  selectedAnnId,
  exportNotice,
  busyExport,
  onSelectAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onCompileAndExport,
}) => {
  const { uiLocale } = useOperoStore();
  const feat = getFeatureStrings(uiLocale);
  const [tab, setTab] = useState<InspectorTab>('annotations');

  return (
    <section
      className="glass-regular"
      aria-label="Document Analysis & Report Inspector"
      style={{
        borderRadius: '18px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: 0,
        maxHeight: '72vh',
        overflowY: 'auto',
      }}
    >
      <div role="tablist" aria-label="Analyzer Inspector Tabs" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(
          [
            { id: 'summary', label: feat.analyzerTabSummary },
            { id: 'annotations', label: `${feat.analyzerTabAnnotations} (${doc.annotations.length})` },
            { id: 'report', label: feat.analyzerTabReport },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`opero-btn ${tab === t.id ? 'primary' : ''}`}
            onClick={() => setTab(t.id)}
            style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '4px' }}>
              {doc.documentType}
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>
              {doc.executiveSummary}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong style={{ fontSize: '13px' }}>Key Findings</strong>
            {doc.keyFindings.map((f, idx) => (
              <div
                key={`finding-${idx}`}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  fontSize: '12.5px',
                  color: 'var(--ink)',
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'annotations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {doc.annotations.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', padding: '8px' }}>
              No annotations yet. Select Box, Arrow, or Crop Piece on the left canvas to annotate and auto-explain.
            </div>
          ) : (
            doc.annotations.map((ann) => {
              const active = ann.id === selectedAnnId;
              return (
                <article
                  key={ann.id}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: active ? 'var(--brand-sky-soft)' : '#FFFFFF',
                    border: active ? '1.5px solid var(--brand-sky)' : '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onSelectAnnotation(ann.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'start',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: 'var(--ink)',
                      }}
                    >
                      #{ann.number} · {ann.title}
                    </button>
                    <button
                      type="button"
                      className="opero-btn"
                      onClick={() => onDeleteAnnotation(ann.id)}
                      style={{ minHeight: '22px', padding: '1px 7px', fontSize: '10.5px' }}
                    >
                      {feat.analyzerRemove}
                    </button>
                  </div>

                  <textarea
                    aria-label={`Explanation for annotation ${ann.number}`}
                    value={ann.explanation}
                    onChange={(e) => onUpdateAnnotation({ ...ann, explanation: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-sans)',
                      resize: 'vertical',
                    }}
                  />

                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--ink)' }}>{feat.analyzerReasoning}:</strong> {ann.reasoning}
                  </div>

                  {ann.suggestedFix && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--ink)',
                        background: '#F8FAFC',
                        borderLeft: '2px solid var(--brand-sky)',
                        padding: '6px 10px',
                        borderRadius: '0 6px 6px 0',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: 'var(--ink)' }}>{feat.analyzerSuggestion}:</strong> {ann.suggestedFix}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {tab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid var(--border)', fontSize: '12.5px', lineHeight: 1.6 }}>
            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>
              Full Analysis Report: {doc.filename}
            </strong>
            <div>{doc.executiveSummary}</div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '8px' }}>
              Engine: {doc.engineUsed} · Completeness: {doc.completenessScore}% · {doc.annotations.length} annotated insights
            </div>
          </div>

          <button
            type="button"
            className="opero-btn primary"
            disabled={busyExport}
            onClick={() => onCompileAndExport(undefined)}
          >
            <JiggIcon name="studio" size={15} variant="duotone" />
            <span>Open Full Report in OPERO Studio</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {EXPORT_FORMATS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                className="opero-btn"
                disabled={busyExport}
                onClick={() => onCompileAndExport(fmt)}
              >
                <JiggIcon name={`export-${fmt === 'markdown' ? 'md' : fmt}`} size={14} variant="duotone" />
                <span>Export {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {exportNotice && (
            <div role="status" className="status-pill verified">
              {exportNotice}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
