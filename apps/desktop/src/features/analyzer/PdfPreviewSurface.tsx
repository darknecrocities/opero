import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { DocumentAnnotation } from '@opero/shared-types';
import type { AnalyzerTool } from './DocumentCanvas';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface VisualAnnotationDraft {
  kind: Exclude<AnalyzerTool, 'select'>;
  x: number;
  y: number;
  w: number;
  h: number;
  targetX: number | null;
  targetY: number | null;
  pageNumber: number;
  excerpt: string;
}

interface PdfPreviewSurfaceProps {
  fileUrl: string;
  annotations: DocumentAnnotation[];
  activeTool: AnalyzerTool;
  selectedAnnId: string | null;
  busyAnnotate: boolean;
  onSelectAnnotation: (id: string) => void;
  onPlaceAnnotation: (draft: VisualAnnotationDraft) => void;
  onFallbackToText: () => void;
}

interface DragRect {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}

function severityStroke(severity: string): string {
  if (severity === 'missing') return '#C43D4B';
  if (severity === 'suggestion') return '#2563EB';
  return '#0F172A';
}

export const PdfPreviewSurface: React.FC<PdfPreviewSurfaceProps> = ({
  fileUrl,
  annotations,
  activeTool,
  selectedAnnId,
  busyAnnotate,
  onSelectAnnotation,
  onPlaceAnnotation,
  onFallbackToText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragRect | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pageText, setPageText] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragRect | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPdf(true);
    setLoadError(null);
    setPageNum(1);

    const task = pdfjsLib.getDocument({ url: fileUrl, withCredentials: false });
    task.promise
      .then((doc) => {
        if (cancelled) {
          void doc.cleanup();
          return;
        }
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        setLoadingPdf(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Visual PDF preview unavailable for this document.');
          setLoadingPdf(false);
          onFallbackToText();
        }
      });

    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [fileUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    pdfDoc
      .getPage(pageNum)
      .then(async (page) => {
        if (cancelled || !canvasRef.current) return;
        const viewport = page.getViewport({ scale: 1.45 });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        renderTask = page.render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;

        const tc = await page.getTextContent();
        if (!cancelled) {
          const text = tc.items
            .map((it) => ('str' in it ? it.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          setPageText(text);
        }
      })
      .catch(() => {
        // Ignore cancelled render tasks during rapid page switches
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNum]);

  const toPct = (clientX: number, clientY: number) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 10, y: 10 };
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  // Window-level pointermove/pointerup works reliably in both macOS WKWebView and Chromium
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const pt = toPct(e.clientX, e.clientY);
      const next = dragRef.current ? { ...dragRef.current, curX: pt.x, curY: pt.y } : null;
      dragRef.current = next;
      setDrag(next);
    };
    const onUp = () => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current || activeTool === 'select') return;

      const dx = Math.abs(current.curX - current.startX);
      const dy = Math.abs(current.curY - current.startY);
      const isClick = dx < 2.2 && dy < 2.2;

      const x = isClick ? Math.max(4, current.startX - 16) : Math.min(current.startX, current.curX);
      const y = isClick ? Math.max(4, current.startY - 6) : Math.min(current.startY, current.curY);
      const w = isClick ? 32 : Math.max(8, dx);
      const h = isClick ? 12 : Math.max(6, dy);
      const targetX = activeTool === 'arrow' ? (isClick ? Math.min(94, current.startX + 18) : current.curX) : null;
      const targetY = activeTool === 'arrow' ? (isClick ? Math.min(94, current.startY + 6) : current.curY) : null;

      const ratio = Math.max(0, Math.min(0.85, y / 100));
      const startIdx = Math.floor(pageText.length * ratio);
      const excerpt =
        pageText.slice(startIdx, startIdx + 480).trim() ||
        `Page ${pageNum} visual region (${Math.round(x)}%, ${Math.round(y)}%)`;

      onPlaceAnnotation({
        kind: activeTool,
        x: activeTool === 'arrow' ? current.startX : x,
        y: activeTool === 'arrow' ? current.startY : y,
        w,
        h,
        targetX,
        targetY,
        pageNumber: pageNum,
        excerpt,
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [Boolean(drag), activeTool, pageNum, pageText, onPlaceAnnotation]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || busyAnnotate) return;
    e.preventDefault();
    const pt = toPct(e.clientX, e.clientY);
    const next = { startX: pt.x, startY: pt.y, curX: pt.x, curY: pt.y };
    dragRef.current = next;
    setDrag(next);
  };

  const pageAnns = annotations.filter((a) => a.blockId === `pdf-page-${pageNum}`);
  const armed = activeTool !== 'select';

  if (loadError) {
    return <div style={{ padding: '16px', fontSize: '13px', color: 'var(--ink-muted)' }}>{loadError}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div className="mono" style={{ fontSize: '11.5px', color: armed ? 'var(--brand-sky-deep)' : 'var(--ink-muted)', fontWeight: armed ? 600 : 400 }}>
          {loadingPdf
            ? 'Rendering PDF preview...'
            : armed
              ? `Page ${pageNum} / ${pageCount} · Click or drag to draw ${activeTool.toUpperCase()}`
              : `Page ${pageNum} of ${pageCount}`}
        </div>
        {pageCount > 1 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="opero-btn"
              disabled={pageNum <= 1}
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              style={{ minHeight: '26px', padding: '2px 9px', fontSize: '11.5px' }}
            >
              Prev
            </button>
            <button
              type="button"
              className="opero-btn"
              disabled={pageNum >= pageCount}
              onClick={() => setPageNum((p) => Math.min(pageCount, p + 1))}
              style={{ minHeight: '26px', padding: '2px 9px', fontSize: '11.5px' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div
        ref={overlayRef}
        data-testid="pdf-preview-stage"
        onPointerDown={handlePointerDown}
        style={{
          position: 'relative',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '12px',
          overflow: 'hidden',
          border: armed ? '2px solid var(--brand-sky)' : '1px solid var(--border)',
          cursor: armed ? 'crosshair' : 'default',
          userSelect: 'none',
          touchAction: 'none',
          transition: 'border-color 140ms ease',
        }}
      >
        <canvas
          ref={canvasRef}
          data-testid="pdf-preview-canvas"
          style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none' }}
        />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <defs>
            <marker id="opero-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0F172A" />
            </marker>
            <marker id="opero-arrow-head-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
            </marker>
          </defs>

          {pageAnns.map((ann) => {
            const active = ann.id === selectedAnnId;
            const stroke = active ? '#2563EB' : severityStroke(ann.severity);
            if (ann.kind === 'arrow') {
              return (
                <line
                  key={ann.id}
                  x1={ann.x}
                  y1={ann.y}
                  x2={ann.targetX ?? Math.min(94, ann.x + 18)}
                  y2={ann.targetY ?? Math.min(94, ann.y + 6)}
                  stroke={stroke}
                  strokeWidth={active ? '0.85' : '0.65'}
                  markerEnd={active ? 'url(#opero-arrow-head-active)' : 'url(#opero-arrow-head)'}
                />
              );
            }
            return (
              <rect
                key={ann.id}
                x={ann.x}
                y={ann.y}
                width={Math.max(4, ann.w)}
                height={Math.max(3, ann.h)}
                fill={active ? 'rgba(105, 188, 252, 0.24)' : 'rgba(105, 188, 252, 0.10)'}
                stroke={stroke}
                strokeWidth={active ? '0.7' : '0.5'}
                strokeDasharray={ann.kind === 'crop' ? '1.6 1.2' : undefined}
                rx="0.8"
              />
            );
          })}

          {drag && activeTool === 'arrow' && (
            <line
              x1={drag.startX}
              y1={drag.startY}
              x2={drag.curX}
              y2={drag.curY}
              stroke="#2563EB"
              strokeWidth="0.75"
              strokeDasharray="1.2 0.8"
              markerEnd="url(#opero-arrow-head-active)"
            />
          )}
          {drag && activeTool !== 'arrow' && (
            <rect
              x={Math.min(drag.startX, drag.curX)}
              y={Math.min(drag.startY, drag.curY)}
              width={Math.abs(drag.curX - drag.startX)}
              height={Math.abs(drag.curY - drag.startY)}
              fill="rgba(105, 188, 252, 0.26)"
              stroke="#2563EB"
              strokeWidth="0.65"
              strokeDasharray={activeTool === 'crop' ? '1.6 1.2' : undefined}
            />
          )}
        </svg>

        {pageAnns.map((ann) => {
          const active = ann.id === selectedAnnId;
          return (
            <button
              key={`badge-${ann.id}`}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAnnotation(ann.id);
              }}
              style={{
                position: 'absolute',
                left: `${Math.max(2, Math.min(93, ann.x))}%`,
                top: `${Math.max(2, Math.min(93, ann.y))}%`,
                transform: 'translate(-20%, -50%)',
                padding: '2px 7px',
                borderRadius: '999px',
                border: '1.5px solid #FFFFFF',
                background: active ? '#2563EB' : '#0F172A',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.24)',
              }}
              aria-label={`Select annotation ${ann.number}: ${ann.title}`}
            >
              {String(ann.number).padStart(2, '0')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
