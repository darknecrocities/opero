import React, { useMemo, useState } from 'react';
import { JiggIcon } from '@opero/jiggicons';
import type { AnalyzedDocument } from '@opero/shared-types';

interface DocumentHistorySidebarProps {
  docs: AnalyzedDocument[];
  activeDocId: string | null;
  busyUpload: boolean;
  onSelect: (doc: AnalyzedDocument) => void;
  onUploadClick: () => void;
  onDelete: (docId: string) => void;
  onClose: () => void;
}

function formatShortDate(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const DocumentHistorySidebar: React.FC<DocumentHistorySidebarProps> = ({
  docs,
  activeDocId,
  busyUpload,
  onSelect,
  onUploadClick,
  onDelete,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.filename.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q) ||
        d.fileFormat.toLowerCase().includes(q),
    );
  }, [docs, query]);

  return (
    <aside
      aria-label="Document History"
      data-testid="analyzer-history-sidebar"
      style={{
        width: '204px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 9px',
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <button
          type="button"
          className="opero-btn primary"
          disabled={busyUpload}
          onClick={onUploadClick}
          style={{ flex: 1, minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}
        >
          <JiggIcon name="add" size={14} variant="duotone" />
          <span>{busyUpload ? 'Analyzing...' : 'Upload'}</span>
        </button>
        <button
          type="button"
          className="opero-btn"
          aria-label="Close document history"
          title="Hide Document History"
          onClick={onClose}
          style={{ minHeight: '32px', width: '32px', padding: 0, flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <input
        type="search"
        aria-label="Search uploaded documents"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents..."
        style={{
          width: '100%',
          border: '1px solid var(--border)',
          borderRadius: '9px',
          padding: '6px 10px',
          fontSize: '12px',
          background: 'var(--bg-surface)',
          color: 'var(--ink)',
        }}
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', padding: '12px 6px', textAlign: 'center' }}>
            No uploaded documents yet.
          </div>
        ) : (
          filtered.map((doc) => {
            const active = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                data-testid="analyzer-history-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '10px',
                  background: active ? 'var(--bg-surface)' : 'transparent',
                  border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                  padding: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(doc)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'start',
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 7px',
                    cursor: 'pointer',
                    color: 'var(--ink)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: active ? 600 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={doc.filename}
                  >
                    {doc.filename}
                  </div>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                    {doc.fileFormat.toUpperCase()}
                    {doc.sourceLanguage ? ` · ${doc.sourceLanguage.slice(0, 2).toUpperCase()}` : ''}
                    {doc.translationTargetLocale ? `→${doc.translationTargetLocale.slice(0, 2).toUpperCase()}` : ''}
                    {' · '}{doc.wordCount}w · {formatShortDate(doc.updatedAt)}
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Delete document ${doc.filename}`}
                  title="Delete document"
                  onClick={() => onDelete(doc.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '7px',
                    flexShrink: 0,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
