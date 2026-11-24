import React, { useEffect, useRef, useState } from 'react';
import { getUiDictionary } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import type { AnalyzedDocument, DocumentAnnotation, DocumentBlock, ExportFormat } from '@opero/shared-types';
import { operoClient } from '../../services/operoClient';
import { useOperoStore } from '../../store/useOperoStore';
import { AnalyzerReportPanel } from './AnalyzerReportPanel';
import { DocumentCanvas, type AnalyzerTool } from './DocumentCanvas';

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
  const dict = getUiDictionary(uiLocale);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<AnalyzedDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<AnalyzedDocument | null>(null);
  const [activeTool, setActiveTool] = useState<AnalyzerTool>('select');
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [busyUpload, setBusyUpload] = useState(false);
  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);
  const [busyExport, setBusyExport] = useState(false);
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

  const handleUploadFile = async (file: File) => {
    setBusyUpload(true);
    setError(null);
    setExportNotice(null);
    try {
      const contentBase64 = await readFileAsBase64(file);
      const { document } = await operoClient.ingestDocument({
        filename: file.name,
        contentBase64,
        locale: targetLocale,
        preferredModel: activeModelId,
      });
      setDocs((prev) => [document, ...prev.filter((d) => d.id !== document.id)]);
      setActiveDoc(document);
      setSelectedAnnId(document.annotations[0]?.id ?? null);
      playJiggSfx('success', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document analysis failed.');
    } finally {
      setBusyUpload(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUploadFile(file);
    e.target.value = '';
  };

  const handleAnnotateBlock = async (block: DocumentBlock, tool: Exclude<AnalyzerTool, 'select'>) => {
    if (!activeDoc) return;
    setBusyBlockId(block.id);
    setError(null);
    try {
      const { explanation } = await operoClient.explainRegion({
        excerpt: block.text,
        contextTitle: block.title ?? block.kind,
        kind: tool,
        locale: targetLocale,
        preferredModel: activeModelId,
      });
      const nextAnn: DocumentAnnotation = {
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
        title: explanation.title,
        excerpt: block.text.slice(0, 160),
        explanation: explanation.explanation,
        reasoning: explanation.reasoning,
        suggestedFix: explanation.suggestedFix,
        severity: explanation.severity,
      };
      const updatedAnns = [...activeDoc.annotations, nextAnn];
      const { document } = await operoClient.saveDocumentAnnotations(activeDoc.id, updatedAnns);
      setActiveDoc(document);
      setSelectedAnnId(nextAnn.id);
      playJiggSfx('step', soundEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain selected region.');
    } finally {
      setBusyBlockId(null);
    }
  };

  const persistAnnotations = async (next: DocumentAnnotation[]) => {
    if (!activeDoc) return;
    const renumbered = next.map((a, idx) => ({ ...a, number: idx + 1 }));
    setActiveDoc({ ...activeDoc, annotations: renumbered });
    try {
      const { document } = await operoClient.saveDocumentAnnotations(activeDoc.id, renumbered);
      setActiveDoc(document);
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
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F9FF 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>
            {dict.navAnalyzer}
          </h1>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)' }}>
            Feed .pdf, .docx, .doc, .txt, or .md · Auto & manual Box/Arrow/Crop annotations with AI reasoning
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {activeDoc && <span className="status-pill verified">{activeDoc.engineUsed}</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            aria-label="Upload document for analysis"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="opero-btn primary"
            disabled={busyUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            <JiggIcon name="add" size={15} variant="duotone" />
            <span>{busyUpload ? 'Analyzing...' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {docs.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {docs.slice(0, 6).map((d) => (
            <button
              key={d.id}
              type="button"
              className={`opero-btn ${activeDoc?.id === d.id ? 'primary' : ''}`}
              onClick={() => {
                setActiveDoc(d);
                setSelectedAnnId(d.annotations[0]?.id ?? null);
              }}
              style={{ minHeight: '28px', padding: '2px 10px', fontSize: '12px' }}
            >
              {d.filename}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="status-pill paused">
          {error}
        </div>
      )}

      {!activeDoc ? (
        <div
          className="glass-regular"
          style={{
            borderRadius: '22px',
            padding: '44px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            textAlign: 'center',
          }}
        >
          <JiggIcon name="docs" size={38} variant="duotone" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
            Upload a document to summarize, annotate, and generate a full report
          </div>
          <p style={{ margin: 0, maxWidth: '460px', fontSize: '13px', color: 'var(--ink-muted)' }}>
            Supports PDF, Word (.docx / .doc), Markdown, and plain text. Local-first analysis with automatic Box & Arrow callouts, manual crop-to-explain, and PDF/DOCX/HTML/MD export.
          </p>
          <button
            type="button"
            className="opero-btn primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <JiggIcon name="add" size={15} variant="duotone" />
            <span>Choose Document (.pdf, .docx, .txt)</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          <DocumentCanvas
            doc={activeDoc}
            activeTool={activeTool}
            selectedAnnId={selectedAnnId}
            busyBlockId={busyBlockId}
            onSelectTool={setActiveTool}
            onSelectAnnotation={setSelectedAnnId}
            onAnnotateBlock={(blk, tool) => void handleAnnotateBlock(blk, tool)}
          />
          <AnalyzerReportPanel
            doc={activeDoc}
            selectedAnnId={selectedAnnId}
            exportNotice={exportNotice}
            busyExport={busyExport}
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
          />
        </div>
      )}
    </div>
  );
};
