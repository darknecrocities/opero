import React, { useEffect, useRef, useState } from 'react';
import { getFeatureStrings, getUiDictionary } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import type { AnalyzedDocument, DocumentAnnotation, DocumentBlock, ExportFormat } from '@opero/shared-types';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';
import { AnalyzerLoadingMascot } from './AnalyzerLoadingMascot';
import { AnalyzerReportPanel } from './AnalyzerReportPanel';
import { DocumentCanvas, type AnalyzerTool } from './DocumentCanvas';
import { DocumentHistorySidebar } from './DocumentHistorySidebar';
import type { VisualAnnotationDraft } from './PdfPreviewSurface';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const idx = res.indexOf(',');
      resolve(idx >= 0 ? res.slice(idx + 1) : res);
    };
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export const DocumentAnalyzerView: React.FC = () => {
  const { uiLocale, targetLocale, activeModelId, soundEnabled, projects, openManualInStudio } = useOperoStore();
  const selectedOllamaTag = DEFAULT_MODELS.find((m) => m.id === activeModelId)?.ollamaTag;
  const dict = getUiDictionary(uiLocale);
  const feat = getFeatureStrings(uiLocale);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [historyOpen, setHistoryOpen] = useState(true);
  const [docs, setDocs] = useState<AnalyzedDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<AnalyzedDocument | null>(null);
  const [activeTool, setActiveTool] = useState<AnalyzerTool>('select');
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [busyUpload, setBusyUpload] = useState(false);
  const [uploadingFilename, setUploadingFilename] = useState('');
  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);
  const [busyExport, setBusyExport] = useState(false);
  const [busyReanalyze, setBusyReanalyze] = useState(false);
  const [busyAsk, setBusyAsk] = useState(false);
  const [askAnswer, setAskAnswer] = useState<{ question: string; answer: string; engineUsed: string } | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void operoClient
      .listAnalyzedDocs()
      .then(({ documents }) => {
        setDocs(documents);
        if (documents[0]) {
          setActiveDoc(documents[0]);
          setSelectedAnnId(documents[0].annotations[0]?.id ?? null);
        }
      })
      .catch(() => {
        // Offline preview mode
      });
  }, []);

  const syncDocState = (updated: AnalyzedDocument) => {
    setActiveDoc(updated);
    setDocs((prev) => [updated, ...prev.filter((d) => d.id !== updated.id)]);
  };

  const handleUploadFile = async (file: File) => {
    setBusyUpload(true);
    setUploadingFilename(file.name);
    setError(null);
    setExportNotice(null);
    setAskAnswer(null);
    try {
      const contentBase64 = await readFileAsBase64(file);
      const { document } = await operoClient.ingestDocument({
        filename: file.name,
        contentBase64,
        locale: targetLocale,
        preferredModel: selectedOllamaTag,
      });
      syncDocState(document);
      setSelectedAnnId(document.annotations[0]?.id ?? null);
      playJiggSfx('success', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document analysis failed.');
    } finally {
      setBusyUpload(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    playJiggSfx('click', soundEnabled);
    try {
      await operoClient.deleteAnalyzedDoc(docId);
      const remaining = docs.filter((d) => d.id !== docId);
      setDocs(remaining);
      if (activeDoc?.id === docId) {
        const next = remaining[0] ?? null;
        setActiveDoc(next);
        setSelectedAnnId(next?.annotations[0]?.id ?? null);
        setAskAnswer(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document.');
    }
  };

  const handleReanalyze = async () => {
    if (!activeDoc) return;
    setBusyReanalyze(true);
    setError(null);
    try {
      const { document } = await operoClient.reanalyzeDocument(activeDoc.id, {
        locale: targetLocale,
        preferredModel: selectedOllamaTag,
      });
      syncDocState(document);
      playJiggSfx('success', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed.');
    } finally {
      setBusyReanalyze(false);
    }
  };

  const handleAskPero = async (q: string) => {
    if (!activeDoc) return;
    setBusyAsk(true);
    setError(null);
    try {
      const res = await operoClient.askAboutDocument(activeDoc.id, {
        question: q,
        locale: targetLocale,
        preferredModel: selectedOllamaTag,
      });
      setAskAnswer({ question: q, answer: res.answer, engineUsed: res.engineUsed });
      playJiggSfx('success', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query Local AI.');
    } finally {
      setBusyAsk(false);
    }
  };

  const applyOptimisticAndExplain = async (
    baseAnn: DocumentAnnotation,
    excerpt: string,
    contextTitle: string,
    busyKey: string,
  ) => {
    if (!activeDoc) return;
    const optimisticAnns = [...activeDoc.annotations, baseAnn];
    setActiveDoc({ ...activeDoc, annotations: optimisticAnns });
    setSelectedAnnId(baseAnn.id);
    setBusyBlockId(busyKey);
    setError(null);
    playJiggSfx('step', soundEnabled);

    try {
      const { explanation } = await operoClient.explainRegion({
        excerpt,
        contextTitle,
        kind: baseAnn.kind,
        locale: targetLocale,
        preferredModel: selectedOllamaTag,
      });
      const resolvedAnns = optimisticAnns.map((a) =>
        a.id === baseAnn.id
          ? {
              ...a,
              title: explanation.title,
              explanation: explanation.explanation,
              reasoning: explanation.reasoning,
              suggestedFix: explanation.suggestedFix,
              severity: explanation.severity,
            }
          : a,
      );
      const { document } = await operoClient.saveDocumentAnnotations(activeDoc.id, resolvedAnns);
      syncDocState(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain selected region.');
    } finally {
      setBusyBlockId(null);
    }
  };

  const handleAnnotateBlock = async (block: DocumentBlock, tool: Exclude<AnalyzerTool, 'select'>) => {
    if (!activeDoc) return;
    const pending: DocumentAnnotation = {
      id: `ann_${Date.now()}`,
      number: activeDoc.annotations.length + 1,
      kind: tool,
      source: 'manual',
      blockId: block.id,
      x: 6,
      y: block.yPct,
      w: 88,
      h: block.hPct,
      targetX: tool === 'arrow' ? 18 : null,
      targetY: tool === 'arrow' ? block.yPct : null,
      title: block.title ?? `${tool.toUpperCase()} Note`,
      excerpt: block.text.slice(0, 160),
      explanation: 'Pero is explaining this section with Local AI...',
      reasoning: 'Analyzing context...',
      suggestedFix: null,
      severity: 'info',
    };
    await applyOptimisticAndExplain(pending, block.text, block.title ?? block.kind, block.id);
  };

  const handlePlaceVisualAnnotation = async (draft: VisualAnnotationDraft) => {
    if (!activeDoc) return;
    const pending: DocumentAnnotation = {
      id: `ann_${Date.now()}`,
      number: activeDoc.annotations.length + 1,
      kind: draft.kind,
      source: 'manual',
      blockId: `pdf-page-${draft.pageNumber}`,
      x: draft.x,
      y: draft.y,
      w: draft.w,
      h: draft.h,
      targetX: draft.targetX,
      targetY: draft.targetY,
      title: `Page ${draft.pageNumber} (${draft.kind.toUpperCase()})`,
      excerpt: draft.excerpt.slice(0, 160),
      explanation: 'Pero is explaining this highlighted region with Local AI...',
      reasoning: 'Analyzing PDF region...',
      suggestedFix: null,
      severity: 'info',
    };
    await applyOptimisticAndExplain(pending, draft.excerpt, `Page ${draft.pageNumber} (${draft.kind.toUpperCase()})`, 'visual-pdf');
  };

  const persistAnnotations = async (next: DocumentAnnotation[]) => {
    if (!activeDoc) return;
    const renumbered = next.map((a, idx) => ({ ...a, number: idx + 1 }));
    setActiveDoc({ ...activeDoc, annotations: renumbered });
    try {
      const { document } = await operoClient.saveDocumentAnnotations(activeDoc.id, renumbered);
      syncDocState(document);
    } catch {
      // Keep local edits visible
    }
  };

  const handleCompileAndExport = async (format?: ExportFormat) => {
    if (!activeDoc) return;
    setBusyExport(true);
    setError(null);
    try {
      const { manual, artifact } = await operoClient.compileDocumentReport(activeDoc.id, {
        projectId: projects[0]?.id,
        locale: targetLocale,
        exportFormat: format,
      });
      if (artifact) {
        setExportNotice(`Exported ${artifact.format.toUpperCase()} (${artifact.byteSize} B)`);
        playJiggSfx('success', soundEnabled);
      } else {
        openManualInStudio(manual);
        playJiggSfx('nav', soundEnabled);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report export failed.');
    } finally {
      setBusyExport(false);
    }
  };

  return (
    <div
      className="opero-view-enter"
      style={{ height: '100%', display: 'flex', background: 'transparent', minHeight: 0, overflow: 'hidden' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md"
        aria-label="Upload document for analysis"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUploadFile(file);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />

      {historyOpen && (
        <DocumentHistorySidebar
          docs={docs}
          activeDocId={activeDoc?.id ?? null}
          busyUpload={busyUpload}
          onSelect={(d) => {
            setActiveDoc(d);
            setSelectedAnnId(d.annotations[0]?.id ?? null);
            setAskAnswer(null);
            setExportNotice(null);
          }}
          onUploadClick={() => fileInputRef.current?.click()}
          onDelete={(id) => void handleDeleteDoc(id)}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!historyOpen && (
              <button
                type="button"
                className="opero-btn"
                aria-label="Show document history"
                onClick={() => setHistoryOpen(true)}
                style={{ minHeight: '30px', padding: '4px 9px', fontSize: '12px' }}
              >
                <JiggIcon name="docs" size={14} variant="duotone" />
                <span>History ({docs.length})</span>
              </button>
            )}
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>
                {dict.navAnalyzer}
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{feat.analyzerSubtitle}</div>
            </div>
          </div>

          <button
            type="button"
            className="opero-btn primary"
            disabled={busyUpload}
            onClick={() => fileInputRef.current?.click()}
            style={{ minHeight: '34px', padding: '5px 12px', fontSize: '12.5px' }}
          >
            <JiggIcon name="add" size={14} variant="duotone" />
            <span>{busyUpload ? 'Analyzing...' : feat.analyzerUploadBtn}</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="status-pill paused">
            {error}
          </div>
        )}

        {busyUpload ? (
          <AnalyzerLoadingMascot filename={uploadingFilename} />
        ) : !activeDoc ? (
          <div
            className="glass-regular"
            style={{
              borderRadius: '20px',
              padding: '44px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <JiggIcon name="docs" size={36} variant="duotone" />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700 }}>
              {feat.analyzerEmptyTitle}
            </div>
            <p style={{ margin: 0, maxWidth: '440px', fontSize: '13px', color: 'var(--ink-muted)' }}>
              {feat.analyzerEmptyBody}
            </p>
            <button type="button" className="opero-btn primary" onClick={() => fileInputRef.current?.click()}>
              <JiggIcon name="add" size={14} variant="duotone" />
              <span>{feat.analyzerUploadBtn}</span>
            </button>
          </div>
        ) : (
          <div
            data-testid="analyzer-split-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '12px',
              alignItems: 'start',
              minWidth: 0,
            }}
          >
            <DocumentCanvas
              doc={activeDoc}
              fileUrl={activeDoc.fileFormat === 'pdf' ? operoClient.getDocumentFileUrl(activeDoc.id) : null}
              activeTool={activeTool}
              selectedAnnId={selectedAnnId}
              busyBlockId={busyBlockId}
              onSelectTool={setActiveTool}
              onSelectAnnotation={setSelectedAnnId}
              onAnnotateBlock={(blk, tool) => void handleAnnotateBlock(blk, tool)}
              onPlaceVisualAnnotation={(draft) => void handlePlaceVisualAnnotation(draft)}
            />
            <AnalyzerReportPanel
              doc={activeDoc}
              selectedAnnId={selectedAnnId}
              exportNotice={exportNotice}
              busyExport={busyExport}
              busyReanalyze={busyReanalyze}
              busyAsk={busyAsk}
              askAnswer={askAnswer}
              onSelectAnnotation={setSelectedAnnId}
              onDeleteAnnotation={(id) =>
                void persistAnnotations(activeDoc.annotations.filter((a) => a.id !== id))
              }
              onUpdateAnnotation={(updated) =>
                void persistAnnotations(
                  activeDoc.annotations.map((a) => (a.id === updated.id ? updated : a)),
                )
              }
              onCompileAndExport={(fmt) => void handleCompileAndExport(fmt)}
              onReanalyze={() => void handleReanalyze()}
              onAskPero={(q) => void handleAskPero(q)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
