import React, { useState } from 'react';
import { getFeatureStrings } from '@opero/i18n';
import { JiggIcon } from '@opero/jiggicons';
import type { AnalyzedDocument, DocumentAnnotation, ExportFormat, FirstClassLocale } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';
import { AgentMessageContent } from '../agent/AgentMessageContent';
import { AnalyzerStructuredSections } from './AnalyzerStructuredSections';

type InspectorTab = 'full' | 'export';

interface AnalyzerReportPanelProps {
  doc: AnalyzedDocument;
  selectedAnnId: string | null;
  exportNotice: string | null;
  busyExport: boolean;
  busyReanalyze: boolean;
  busyTranslate: boolean;
  busyAsk: boolean;
  askAnswer: { question: string; answer: string; engineUsed: string } | null;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (ann: DocumentAnnotation) => void;
  onCompileAndExport: (format?: ExportFormat) => void;
  onDownloadReport: (format: ExportFormat) => void;
  onReanalyze: () => void;
  onTranslate: (targetLocale: FirstClassLocale) => void;
  onAskPero: (question: string) => void;
  onOpenAgent: () => void;
}

const EXPORT_FORMATS: ExportFormat[] = ['pdf', 'docx', 'html', 'markdown'];

export const AnalyzerReportPanel: React.FC<AnalyzerReportPanelProps> = ({
  doc,
  selectedAnnId,
  exportNotice,
  busyExport,
  busyReanalyze,
  busyTranslate,
  busyAsk,
  askAnswer,
  onSelectAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onCompileAndExport,
  onDownloadReport,
  onReanalyze,
  onTranslate,
  onAskPero,
  onOpenAgent,
}) => {
  const { uiLocale } = useOperoStore();
  const feat = getFeatureStrings(uiLocale);
  const [tab, setTab] = useState<InspectorTab>('full');
  const [question, setQuestion] = useState('');
  const isOfflineEngine = doc.engineUsed.toLowerCase().includes('offline');

  return (
    <section
      className="glass-regular"
      aria-label="Document Analysis & Report Inspector"
      data-testid="analyzer-report-panel"
      style={{
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: 0,
        maxHeight: '82vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div role="tablist" aria-label="Analyzer Inspector Tabs" style={{ display: 'inline-flex', gap: '4px' }}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'full'}
            className={`opero-btn ${tab === 'full' ? 'primary' : ''}`}
            onClick={() => setTab('full')}
            style={{ minHeight: '30px', padding: '3px 10px', fontSize: '12px' }}
          >
            {feat.analyzerTabReport}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'export'}
            className={`opero-btn ${tab === 'export' ? 'primary' : ''}`}
            onClick={() => setTab('export')}
            style={{ minHeight: '30px', padding: '3px 10px', fontSize: '12px' }}
          >
            Export
          </button>
        </div>
        <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
          {doc.engineUsed}
        </span>
      </div>

      {tab === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 8-Section Structured Analysis Report + Auto-Translation + Pero Agent Sync */}
          <AnalyzerStructuredSections
            doc={doc}
            busyTranslate={busyTranslate}
            onTranslate={onTranslate}
            onOpenAgent={onOpenAgent}
          />

          {/* Executive Summary Card */}
          <div style={{ padding: '13px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-sky-deep)' }}>
                {doc.documentType}
              </span>
              {isOfflineEngine && (
                <button
                  type="button"
                  className="opero-btn"
                  disabled={busyReanalyze}
                  onClick={onReanalyze}
                  style={{ minHeight: '24px', padding: '2px 8px', fontSize: '11px' }}
                >
                  {busyReanalyze ? 'Re-analyzing...' : 'Analyze with Local AI'}
                </button>
              )}
            </div>
            <p data-testid="analyzer-executive-summary" style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: 'var(--ink)' }}>
              {doc.executiveSummary}
            </p>
          </div>

          {/* Key Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
              {uiLocale === 'ja-JP' ? '主要ポイント' : 'Key Points'} ({doc.keyFindings.length})
            </strong>
            <ol
              data-testid="analyzer-key-points"
              style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}
            >
              {doc.keyFindings.map((f, idx) => (
                <li
                  key={`finding-${idx}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    color: 'var(--ink)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '6px',
                      background: 'var(--brand-sky-soft)',
                      color: 'var(--brand-sky-deep)',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Inline Ask Pero about this document */}
          <div style={{ padding: '12px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
              {uiLocale === 'ja-JP' ? 'Peroにこの書類について質問する' : 'Ask Pero about this document'}
            </strong>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (question.trim() && !busyAsk) {
                  onAskPero(question.trim());
                  setQuestion('');
                }
              }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <input
                type="text"
                aria-label="Ask Pero about this document"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={uiLocale === 'ja-JP' ? '例: 重要なルールや期限を教えてください' : 'e.g. Explain the key dates, limits, or rules...'}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid var(--border)',
                  borderRadius: '9px',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  background: 'var(--bg-subtle)',
                  color: 'var(--ink)',
                }}
              />
              <button type="submit" className="opero-btn primary" disabled={busyAsk || !question.trim()} style={{ minHeight: '32px', padding: '4px 11px', fontSize: '12px' }}>
                <span>{busyAsk ? '...' : 'Ask'}</span>
              </button>
            </form>
            {askAnswer && (
              <div
                data-testid="analyzer-ask-answer"
                style={{
                  padding: '9px 11px',
                  borderRadius: '10px',
                  background: 'var(--brand-sky-soft)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-sky-deep)' }}>
                  Q: {askAnswer.question} · {askAnswer.engineUsed}
                </div>
                <AgentMessageContent content={askAnswer.answer} animateReveal />
              </div>
            )}
          </div>

          {/* Annotations & Reasoning */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
              {feat.analyzerTabAnnotations} ({doc.annotations.length})
            </strong>
            {doc.annotations.length === 0 ? (
              <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', padding: '6px 2px' }}>
                Select Box, Arrow, or Crop above the preview to annotate and explain any region.
              </div>
            ) : (
              doc.annotations.map((ann) => {
                const active = ann.id === selectedAnnId;
                return (
                  <article
                    key={ann.id}
                    style={{
                      padding: '11px',
                      borderRadius: '11px',
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
                          fontSize: '12.5px',
                          color: 'var(--ink)',
                        }}
                      >
                        #{String(ann.number).padStart(2, '0')} · {ann.kind.toUpperCase()} · {ann.title}
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
                      <div style={{ fontSize: '12px', color: 'var(--ink)', background: '#F8FAFC', borderLeft: '2px solid var(--brand-sky)', padding: '5px 9px', borderRadius: '0 6px 6px 0' }}>
                        <strong>{feat.analyzerSuggestion}:</strong> {ann.suggestedFix}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                onClick={() => onDownloadReport(fmt)}
              >
                <JiggIcon name={`export-${fmt === 'markdown' ? 'md' : fmt}`} size={14} variant="duotone" />
                <span>Download {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}</span>
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
