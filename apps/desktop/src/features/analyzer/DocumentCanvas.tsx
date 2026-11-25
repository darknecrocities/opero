import React, { useEffect, useState } from 'react';
import { getFeatureStrings } from '@opero/i18n';
import { JiggIcon } from '@opero/jiggicons';
import type { AnalyzedDocument, DocumentAnnotation, DocumentBlock } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';
import { PdfPreviewSurface, type VisualAnnotationDraft } from './PdfPreviewSurface';

export type AnalyzerTool = 'select' | 'box' | 'arrow' | 'crop';

interface DocumentCanvasProps {
  doc: AnalyzedDocument;
  fileUrl?: string | null;
  activeTool: AnalyzerTool;
  selectedAnnId: string | null;
  busyBlockId: string | null;
  onSelectTool: (tool: AnalyzerTool) => void;
  onSelectAnnotation: (annId: string) => void;
  onAnnotateBlock: (block: DocumentBlock, tool: Exclude<AnalyzerTool, 'select'>) => void;
  onPlaceVisualAnnotation: (draft: VisualAnnotationDraft) => void;
}

function severityBorder(severity: string): string {
  if (severity === 'missing') return '#C43D4B';
  if (severity === 'suggestion') return '#2563EB';
  return '#0F172A';
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  doc,
  fileUrl,
  activeTool,
  selectedAnnId,
  busyBlockId,
  onSelectTool,
  onSelectAnnotation,
  onAnnotateBlock,
  onPlaceVisualAnnotation,
}) => {
  const { uiLocale } = useOperoStore();
  const feat = getFeatureStrings(uiLocale);
  const canVisualPdf = doc.fileFormat === 'pdf' && Boolean(fileUrl);
  const [viewMode, setViewMode] = useState<'preview' | 'text'>(canVisualPdf ? 'preview' : 'text');

  useEffect(() => {
    setViewMode(doc.fileFormat === 'pdf' && Boolean(fileUrl) ? 'preview' : 'text');
  }, [doc.id, doc.fileFormat, fileUrl]);

  const tools: { id: AnalyzerTool; icon: string; label: string }[] = [
    { id: 'select', icon: 'eye', label: feat.analyzerToolInspect },
    { id: 'box', icon: 'rect', label: feat.analyzerToolBox },
    { id: 'arrow', icon: 'arrow', label: feat.analyzerToolArrow },
    { id: 'crop', icon: 'crop', label: feat.analyzerToolCrop },
  ];

  const annsByBlock = new Map<string, DocumentAnnotation[]>();
  for (const ann of doc.annotations) {
    if (ann.blockId) {
      const list = annsByBlock.get(ann.blockId) ?? [];
      list.push(ann);
      annsByBlock.set(ann.blockId, list);
    }
  }

  return (
    <section
      aria-label="Document Annotation Canvas"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: 0,
      }}
    >
      <div
        className="glass-regular"
        style={{
          borderRadius: '14px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`opero-btn ${activeTool === t.id ? 'primary' : ''}`}
              onClick={() => onSelectTool(t.id)}
              style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}
            >
              <JiggIcon name={t.icon} size={14} variant="duotone" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {canVisualPdf && (
            <div style={{ display: 'inline-flex', gap: '4px', padding: '2px', borderRadius: '10px', background: 'var(--bg-subtle)' }}>
              <button
                type="button"
                className={`opero-btn ${viewMode === 'preview' ? 'primary' : ''}`}
                onClick={() => setViewMode('preview')}
                style={{ minHeight: '26px', padding: '2px 9px', fontSize: '11.5px' }}
              >
                Visual Preview
              </button>
              <button
                type="button"
                className={`opero-btn ${viewMode === 'text' ? 'primary' : ''}`}
                onClick={() => setViewMode('text')}
                style={{ minHeight: '26px', padding: '2px 9px', fontSize: '11.5px' }}
              >
                Extracted Text
              </button>
            </div>
          )}
          <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
            {activeTool === 'select'
              ? 'Click any badge to inspect reasoning'
              : viewMode === 'preview'
                ? `Click or drag on the PDF to draw ${activeTool.toUpperCase()} & auto-explain`
                : `Click any paragraph or table to place ${activeTool.toUpperCase()} & auto-explain`}
          </span>
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '18px 20px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '72vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border)',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)' }}>
              {doc.filename}
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
              {doc.fileFormat.toUpperCase()} · {doc.wordCount} words · {doc.detectedLanguages.join(' / ')} · {doc.completenessScore}% {feat.analyzerCompleteSuffix}
            </div>
          </div>
        </div>

        {viewMode === 'preview' && canVisualPdf && fileUrl ? (
          <PdfPreviewSurface
            fileUrl={fileUrl}
            annotations={doc.annotations}
            activeTool={activeTool}
            selectedAnnId={selectedAnnId}
            busyAnnotate={busyBlockId === 'visual-pdf'}
            onSelectAnnotation={onSelectAnnotation}
            onPlaceAnnotation={onPlaceVisualAnnotation}
            onFallbackToText={() => setViewMode('text')}
          />
        ) : (
          doc.blocks.map((blk) => {
            const blkAnns = annsByBlock.get(blk.id) ?? [];
            const primaryAnn = blkAnns[0];
            const isSelected = blkAnns.some((a) => a.id === selectedAnnId);
            const isInteractive = activeTool !== 'select';
            const borderCol = primaryAnn ? severityBorder(primaryAnn.severity) : 'transparent';

            return (
              <div
                key={blk.id}
                data-testid="analyzer-block"
                onClick={() => {
                  if (isInteractive && busyBlockId !== blk.id) {
                    onAnnotateBlock(blk, activeTool);
                  }
                }}
                style={{
                  position: 'relative',
                  padding: primaryAnn ? '12px 14px' : '8px 10px',
                  borderRadius: '12px',
                  cursor: isInteractive ? 'crosshair' : 'default',
                  border: primaryAnn
                    ? `${isSelected ? 2 : 1.5}px ${primaryAnn.kind === 'crop' ? 'dashed' : 'solid'} ${borderCol}`
                    : isInteractive
                      ? '1px dashed var(--brand-sky)'
                      : '1px solid transparent',
                  background: isSelected
                    ? 'var(--brand-sky-soft)'
                    : blk.kind === 'note'
                      ? '#F4F9FF'
                      : '#FFFFFF',
                  transition: 'border-color 160ms ease, background-color 160ms ease',
                }}
              >
                {blkAnns.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center' }}>
                    {blkAnns.map((ann) => (
                      <button
                        key={ann.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnnotation(ann.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-strong)',
                          cursor: 'pointer',
                          background: ann.id === selectedAnnId ? '#0F172A' : '#F4F9FF',
                          color: ann.id === selectedAnnId ? '#FFFFFF' : '#0F172A',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {ann.kind === 'arrow' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <span>{String(ann.number).padStart(2, '0')} · {ann.kind.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                )}

                {blk.kind === 'heading' ? (
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                    {blk.text}
                  </h3>
                ) : blk.kind === 'table' && blk.rows.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        {blk.rows.map((row, rIdx) => (
                          <tr key={`${blk.id}-r-${rIdx}`}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={`${blk.id}-r-${rIdx}-c-${cIdx}`}
                                style={{
                                  border: '1px solid var(--border)',
                                  padding: '6px 8px',
                                  background: cell.trim() === '' ? '#FEF2F2' : rIdx === 0 ? '#F4F9FF' : '#FFFFFF',
                                  fontWeight: rIdx === 0 ? 600 : 400,
                                  color: cell.trim() === '' ? '#C43D4B' : 'var(--ink)',
                                }}
                              >
                                {cell.trim() === '' ? '(blank)' : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-line', color: 'var(--ink)' }}>
                    {blk.text}
                  </p>
                )}

                {busyBlockId === blk.id && (
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--brand-sky-deep)', fontWeight: 600 }}>
                    Analyzing region with Local AI...
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
