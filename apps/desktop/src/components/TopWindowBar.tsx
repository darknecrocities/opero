import React, { useEffect, useRef, useState } from 'react';
import { getFeatureStrings, getUiDictionary } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { OperoLogo } from '@opero/mascot';
import type { ExportFormat } from '@opero/shared-types';
import { formatShortcut } from '../services/platformShortcuts';
import { useOperoStore } from '../store/useOperoStore';

export const TopWindowBar: React.FC = () => {
  const {
    uiLocale,
    navMode,
    leftOpen,
    rightOpen,
    hardwareProfile,
    soundEnabled,
    toggleLeft,
    toggleRight,
    toggleSettingsView,
    runExport,
  } = useOperoStore();
  const dict = getUiDictionary(uiLocale);
  const feat = getFeatureStrings(uiLocale);
  const os = hardwareProfile?.osName;
  const exportItems: { fmt: ExportFormat; icon: string; label: string; keyHint: string }[] = [
    { fmt: 'pdf', icon: 'export-pdf', label: 'Export PDF', keyHint: formatShortcut({ mod: true, key: 'E' }, os) },
    { fmt: 'docx', icon: 'export-docx', label: 'Export Word (.docx)', keyHint: formatShortcut({ mod: true, shift: true, key: 'D' }, os) },
    { fmt: 'markdown', icon: 'export-md', label: 'Export Markdown', keyHint: formatShortcut({ mod: true, shift: true, key: 'M' }, os) },
    { fmt: 'html', icon: 'export-html', label: 'Export HTML', keyHint: formatShortcut({ mod: true, shift: true, key: 'H' }, os) },
  ];
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [exportMenuOpen]);

  return (
    <header className="opero-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '36px' }}>
        {!leftOpen && (
          <button
            type="button"
            className="opero-btn"
            onClick={() => {
              playJiggSfx('click', soundEnabled);
              toggleLeft();
            }}
            aria-label="Show navigation sidebar"
            aria-pressed={leftOpen}
            title={`Show Sidebar (${formatShortcut({ mod: true, key: 'B' }, os)})`}
            style={{ minHeight: '32px', width: '32px', padding: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <line x1="9" y1="4" x2="9" y2="20" />
            </svg>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <OperoLogo variant="mark" size={22} title="OPERO Mark" />
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '-0.02em' }}>
          OPERO
        </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`opero-btn ${exportMenuOpen ? 'primary' : ''}`}
            aria-label="Export menu"
            aria-expanded={exportMenuOpen}
            onClick={() => {
              playJiggSfx('click', soundEnabled);
              setExportMenuOpen((v) => !v);
            }}
            style={{ minHeight: '32px', padding: '4px 10px' }}
          >
            <JiggIcon name="export-pdf" size={15} variant="duotone" />
            <span>{dict.exportTitle}</span>
            <span className="mono" style={{ fontSize: '11px', opacity: 0.7 }}>{formatShortcut({ mod: true, key: 'E' }, os)}</span>
          </button>

          {exportMenuOpen && (
            <div
              role="menu"
              aria-label="Quick Export Formats"
              className="glass-regular opero-chat-bubble"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                minWidth: '205px',
                borderRadius: '14px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 60,
                background: 'var(--bg-surface)',
              }}
            >
              {exportItems.map((item) => (
                <button
                  key={item.fmt}
                  type="button"
                  role="menuitem"
                  className="nav-item"
                  onClick={() => {
                    setExportMenuOpen(false);
                    void runExport(item.fmt);
                  }}
                  style={{ padding: '7px 10px', fontSize: '12.5px' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <JiggIcon name={item.icon} size={15} variant="duotone" />
                    <span>{item.label}</span>
                  </span>
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>{item.keyHint}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`opero-btn ${navMode === 'settings' ? 'primary' : ''}`}
          onClick={toggleSettingsView}
          aria-label="Open Settings"
          aria-pressed={navMode === 'settings'}
          title={`Settings (${formatShortcut({ mod: true, key: ',' }, os)})`}
          style={{ minHeight: '32px', padding: '4px 8px' }}
        >
          <JiggIcon name="settings" size={16} variant="duotone" />
        </button>

        <button
          type="button"
          className={`opero-btn ${!rightOpen ? 'primary' : ''}`}
          onClick={() => {
            playJiggSfx('click', soundEnabled);
            toggleRight();
          }}
          aria-label="Toggle right utility sidebar"
          aria-pressed={rightOpen}
          title={`Toggle Utility Rail (${formatShortcut({ mod: true, shift: true, key: 'B' }, os)})`}
          style={{ minHeight: '32px', padding: '4px 10px' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <line x1="15" y1="4" x2="15" y2="20" />
          </svg>
          <span>{rightOpen ? feat.hideRail : feat.showRail}</span>
        </button>
      </div>
    </header>
  );
};
