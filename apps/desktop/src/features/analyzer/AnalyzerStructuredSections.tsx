import React, { useState } from 'react';
import type { AnalyzedDocument, FirstClassLocale } from '@opero/shared-types';

interface AnalyzerStructuredSectionsProps {
  doc: AnalyzedDocument;
  busyTranslate: boolean;
  onTranslate: (targetLocale: FirstClassLocale) => void;
  onOpenAgent: () => void;
}

const TARGET_LANGS: { locale: FirstClassLocale; label: string }[] = [
  { locale: 'en-US', label: 'EN' },
  { locale: 'ja-JP', label: '日本語' },
  { locale: 'fil-PH', label: 'FIL' },
];

export const AnalyzerStructuredSections: React.FC<AnalyzerStructuredSectionsProps> = ({
  doc,
  busyTranslate,
  onTranslate,
  onOpenAgent,
}) => {
  const sections = doc.structuredSections ?? [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    overview: true,
    translation: true,
    key_findings: true,
    action_items: true,
    risks_gaps: true,
    glossary_terms: false,
    structure_outline: false,
    annotations_log: true,
  });

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} data-testid="analyzer-structured-sections">
      <div
        style={{
          padding: '10px 12px',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brand-sky-deep)' }}>
            {doc.sourceLanguage || doc.detectedLanguages[0] || 'en-US'}
            {doc.translationTargetLocale ? ` → ${doc.translationTargetLocale}` : ''}
          </span>
          {doc.ragIndexed !== false && (
            <span className="status-pill verified" style={{ fontSize: '10px', padding: '1px 7px' }}>
              Synced with Pero Agent
            </span>
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {TARGET_LANGS.map((l) => (
            <button
              key={l.locale}
              type="button"
              className={`opero-btn ${doc.translationTargetLocale === l.locale ? 'primary' : ''}`}
              disabled={busyTranslate}
              onClick={() => onTranslate(l.locale)}
              style={{ minHeight: '24px', padding: '1px 7px', fontSize: '10.5px' }}
            >
              {busyTranslate ? '…' : l.label}
            </button>
          ))}
          <button
            type="button"
            className="opero-btn"
            onClick={onOpenAgent}
            style={{ minHeight: '24px', padding: '1px 8px', fontSize: '10.5px' }}
          >
            Ask in Pero Agent
          </button>
        </div>
      </div>

      {sections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ fontSize: '12px', color: 'var(--ink)' }}>
            Structured Analysis Report ({sections.length} Sections)
          </strong>
          {sections.map((sec) => {
            const isOpen = expanded[sec.id] ?? sec.number <= 4;
            return (
              <div
                key={sec.id}
                data-testid={`analyzer-section-${sec.id}`}
                style={{
                  borderRadius: '11px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(sec.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '9px 11px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--ink)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 700 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: '5px',
                        background: 'var(--brand-sky-soft)',
                        color: 'var(--brand-sky-deep)',
                      }}
                    >
                      {String(sec.number).padStart(2, '0')}
                    </span>
                    <span>{sec.title}</span>
                  </span>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 11px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
                      {sec.summary}
                    </p>
                    {sec.id === 'translation' && (doc.translatedBlocks?.length ?? 0) > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {doc.translatedBlocks!.slice(0, 6).map((tb) => (
                          <div
                            key={tb.blockId}
                            style={{
                              padding: '7px 9px',
                              borderRadius: '8px',
                              background: 'var(--bg-subtle)',
                              fontSize: '11.5px',
                              lineHeight: 1.45,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px',
                            }}
                          >
                            <div style={{ color: 'var(--ink-muted)' }}>{tb.sourceText}</div>
                            <div style={{ color: 'var(--ink)', fontWeight: 600 }}>{tb.translatedText}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {sec.items.map((item, idx) => (
                          <li key={`${sec.id}-${idx}`} style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--ink)' }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
