import React from 'react';
import { JiggIcon } from '@opero/jiggicons';
import { OperoLogo } from '@opero/mascot';
import { useOperoStore } from '../store/useOperoStore';

export const TopWindowBar: React.FC = () => {
  const {
    leftOpen,
    rightOpen,
    solidFallback,
    daemonOnline,
    toggleLeft,
    toggleRight,
    toggleSolidFallback,
    setNavMode,
    runExport,
  } = useOperoStore();

  return (
    <header className="opero-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="opero-btn"
          onClick={toggleLeft}
          aria-label="Toggle left sidebar"
          title="Toggle Left Sidebar"
          style={{ minHeight: '32px', padding: '4px 8px' }}
        >
          <JiggIcon name="library" size={16} variant="outline" />
          <span>{leftOpen ? 'Hide Nav' : 'Nav'}</span>
        </button>
        <span className={`status-pill ${daemonOnline ? 'verified' : 'paused'}`}>
          <JiggIcon name={daemonOnline ? 'verified' : 'shield'} size={13} variant="duotone" />
          <span>{daemonOnline ? 'Local SQLite + RAG Active' : 'Offline Preview Mode'}</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <OperoLogo variant="mark" size={22} title="OPERO Workspace Mark" />
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '-0.02em' }}>
          OPERO Workspace
        </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="opero-btn"
          onClick={toggleSolidFallback}
          style={{ minHeight: '32px', padding: '4px 10px' }}
        >
          <JiggIcon name="eye" size={15} variant="duotone" />
          <span>{solidFallback ? 'Solid: ON' : 'Liquid Glass'}</span>
        </button>
        <button
          type="button"
          className="opero-btn"
          onClick={() => void runExport('pdf')}
          style={{ minHeight: '32px', padding: '4px 10px' }}
        >
          <JiggIcon name="export-pdf" size={15} variant="duotone" />
          <span>Export</span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>⌘E</span>
        </button>
        <button
          type="button"
          className="opero-btn"
          onClick={() => setNavMode('memory')}
          aria-label="OS Permissions and Dual-Core Memory"
          style={{ minHeight: '32px', padding: '4px 8px' }}
        >
          <JiggIcon name="permissions" size={16} variant="duotone" />
        </button>
        <button
          type="button"
          className="opero-btn"
          onClick={toggleRight}
          aria-label="Toggle right utility sidebar"
          style={{ minHeight: '32px', padding: '4px 8px' }}
        >
          <JiggIcon name="settings" size={16} variant="outline" />
          <span>{rightOpen ? 'Hide Rail' : 'Rail'}</span>
        </button>
      </div>
    </header>
  );
};
