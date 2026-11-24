import React, { useState } from 'react';
import { getUiDictionary, MMI_DOCUMENT_TEMPLATES, type MmiTemplateDefinition } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import type { ExportFormat } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';

const FORMATS: ExportFormat[] = ['pdf', 'docx', 'html', 'markdown'];

export const TemplatesView: React.FC = () => {
  const { uiLocale, soundEnabled, lastExportNotice, createManualFromTemplate, runExport } = useOperoStore();
  const [selectedId, setSelectedId] = useState<MmiTemplateDefinition['id']>('sop');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dict = getUiDictionary(uiLocale);
  const selected = MMI_DOCUMENT_TEMPLATES.find((t) => t.id === selectedId) ?? MMI_DOCUMENT_TEMPLATES[0]!;

  const handleCreate = async (tpl: MmiTemplateDefinition) => {
    setBusyId(tpl.id);
    setNotice(null);
    try {
      const manual = await createManualFromTemplate(tpl.id, tpl.name[uiLocale]);
      if (manual) {
        setNotice(`Created "${manual.title}" (${manual.steps.length} steps)`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleExportTemplate = async (tpl: MmiTemplateDefinition, format: ExportFormat) => {
    setBusyId(`${tpl.id}-${format}`);
    setNotice(null);
    try {
      const manual = await createManualFromTemplate(tpl.id, tpl.name[uiLocale]);
      if (manual) {
        await runExport(format, manual);
        setNotice(`Exported ${tpl.code} as ${format.toUpperCase()}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="opero-view-enter"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F9FF 100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>
          {dict.templatesHeading}
        </h1>
        {(notice || lastExportNotice) && (
          <div role="status" className="status-pill verified">
            <JiggIcon name="verified" size={14} variant="duotone" />
            <span>{notice ?? lastExportNotice}</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px',
        }}
      >
        {MMI_DOCUMENT_TEMPLATES.map((tpl) => {
          const isSelected = tpl.id === selected.id;
          return (
            <article
              key={tpl.id}
              className="glass-regular opero-card"
              style={{
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                border: isSelected ? '2px solid var(--brand-sky)' : '1px solid var(--border-strong)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <JiggIcon name={tpl.icon} size={20} variant="duotone" />
                  <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                    {tpl.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playJiggSfx('click', soundEnabled);
                    setSelectedId(tpl.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'start',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                  }}
                >
                  {tpl.name[uiLocale]}
                </button>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                  {tpl.description[uiLocale]}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="opero-btn primary"
                  disabled={busyId === tpl.id}
                  onClick={() => void handleCreate(tpl)}
                  style={{ width: '100%' }}
                >
                  <JiggIcon name="add" size={14} variant="duotone" />
                  <span>{dict.templatesCreateManual}</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                  {FORMATS.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      className="opero-btn mono"
                      disabled={busyId === `${tpl.id}-${fmt}`}
                      onClick={() => void handleExportTemplate(tpl, fmt)}
                      style={{ minHeight: '30px', padding: '2px 4px', fontSize: '11px' }}
                    >
                      {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section
        className="glass-regular"
        aria-label="Selected template structure"
        style={{ borderRadius: '18px', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>
            {selected.name[uiLocale]}
          </strong>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
            {selected.sections[uiLocale].length} sections
          </span>
        </div>
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--ink-muted)' }}>
          {selected.sections[uiLocale].map((sec) => (
            <li key={sec}>{sec}</li>
          ))}
        </ol>
      </section>
    </div>
  );
};
