import React from 'react';
import { getFeatureStrings, getUiDictionary } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { OperoLogo } from '@opero/mascot';
import { useOperoStore } from '../store/useOperoStore';

export const TopWindowBar: React.FC = () => {
  const {
    uiLocale,
    leftOpen,
    rightOpen,
    solidFallback,
    soundEnabled,
    toggleLeft,
    toggleRight,
    toggleSolidFallback,
    setNavMode,
    runExport,
  } = useOperoStore();
  const dict = getUiDictionary(uiLocale);
  const feat = getFeatureStrings(uiLocale);

  return (
    <header className="opero-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="opero-btn"
          onClick={() => {
            playJiggSfx('click', soundEnabled);
            toggleLeft();
          }}
          aria-label="Toggle left sidebar"
          title="Toggle Sidebar (⌘B)"
          style={{ minHeight: '32px', padding: '4px 9px' }}
        >
          <JiggIcon name="library" size={16} variant="outline" />
          <span>{leftOpen ? feat.hideNav : feat.showNav}</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <OperoLogo variant="mark" size={22} title="OPERO Mark" />
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '-0.02em' }}>
          OPERO
        </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="opero-btn"
          onClick={() => {
            playJiggSfx('click', soundEnabled);
            toggleSolidFallback();
          }}
          style={{ minHeight: '32px', padding: '4px 10px' }}
        >
          <JiggIcon name="eye" size={15} variant="duotone" />
          <span>{solidFallback ? feat.solidMode : feat.glassMode}</span>
        </button>
        <button
          type="button"
          className="opero-btn"
          onClick={() => void runExport('pdf')}
          style={{ minHeight: '32px', padding: '4px 10px' }}
        >
          <JiggIcon name="export-pdf" size={15} variant="duotone" />
          <span>{dict.exportTitle}</span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>⌘E</span>
        </button>
        <button
          type="button"
          className="opero-btn"
          onClick={() => setNavMode('settings')}
          aria-label="Open Settings"
          title="Settings (⌘,)"
          style={{ minHeight: '32px', padding: '4px 8px' }}
        >
          <JiggIcon name="settings" size={16} variant="duotone" />
        </button>
        <button
          type="button"
          className="opero-btn"
          onClick={() => {
            playJiggSfx('click', soundEnabled);
            toggleRight();
          }}
          aria-label="Toggle right utility sidebar"
          title="Toggle Utility Rail (⌘⇧B)"
          style={{ minHeight: '32px', padding: '4px 8px' }}
        >
          <JiggIcon name="panel" size={16} variant="outline" />
          <span>{rightOpen ? feat.hideRail : feat.showRail}</span>
        </button>
      </div>
    </header>
  );
};
