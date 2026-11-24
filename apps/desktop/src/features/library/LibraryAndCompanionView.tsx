import React, { useState } from 'react';
import { JiggIcon } from '@opero/jiggicons';
import {
  OPERO_CURATED_OUTFITS,
  OperoLogo,
  PERO_MOTIONS,
  PeroAmbientPresence,
  type PeroMotionId,
} from '@opero/mascot';
import { useOperoStore } from '../../store/useOperoStore';

const TEMPLATES = [
  'Standard Operating Procedure (SOP)',
  'Software User Guide',
  'Internal System Instructions',
  'Employee Onboarding Guide',
  'Troubleshooting Guide',
  'Technical Procedure',
  'Administrative Workflow',
];

export const LibraryAndCompanionView: React.FC = () => {
  const { peroCapColor, peroJacketColor, setPeroOutfit } = useOperoStore();
  const [activeMotion, setActiveMotion] = useState<PeroMotionId>('thumbs-up');
  const currentMeta = PERO_MOTIONS.find((m) => m.id === activeMotion) ?? PERO_MOTIONS[0]!;

  return (
    <div style={{ padding: '22px 26px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Frameless Natural Pero Spotlight & Brand Assets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)', gap: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PeroAmbientPresence
            motion={activeMotion}
            placement="spotlight"
            size={280}
            capColor={peroCapColor}
            jacketColor={peroJacketColor}
            caption={`${currentMeta.number} · ${currentMeta.name} (${currentMeta.durationMs}ms)`}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <OperoLogo variant="squircle" size={44} title="OPERO Squircle" />
            <OperoLogo variant="mark" size={38} title="OPERO Mark" />
            <OperoLogo variant="mono" size={36} inkColor="#0F172A" title="OPERO Monochrome" />
            <img
              src="/images/mascot/Pero_mascot.png"
              alt="Master Pero Illustration"
              width={48}
              height={48}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', margin: 0 }}>
            Pero 20-Motion Vector Rig &amp; MMI Templates
          </h1>
          <p className="prose-measure" style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted)' }}>
            {currentMeta.description}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {OPERO_CURATED_OUTFITS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="opero-btn"
                onClick={() => setPeroOutfit(preset.capColor, preset.jacketColor)}
                style={{ minHeight: '30px', padding: '4px 10px', fontSize: '12px' }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '999px',
                    background: preset.capColor,
                    display: 'inline-block',
                  }}
                />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* All 20 Pero Vector Motions Selector */}
      <section aria-label="20 Pero Vector Motions">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', margin: '0 0 10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <JiggIcon name="celebrate" size={16} variant="duotone" />
          <span>All 20 Built-In Vector Motions (SVG + 1024px PNG)</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '6px' }}>
          {PERO_MOTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`nav-item ${activeMotion === m.id ? 'active' : ''}`}
              onClick={() => setActiveMotion(m.id)}
              style={{ border: '1px solid var(--border)', padding: '8px 10px' }}
            >
              <span style={{ fontSize: '12px' }}>{m.number} · {m.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 7 Official MMI Document Templates */}
      <section aria-label="7 MMI Document Templates">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', margin: '0 0 10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <JiggIcon name="outputs" size={16} variant="duotone" />
          <span>Standardized MMI Document Templates (7)</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {TEMPLATES.map((tpl) => (
            <div key={tpl} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-subtle)', fontSize: '13px', fontWeight: 500 }}>
              {tpl}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
