import React, { useState } from 'react';
import { JiggIcon } from '@opero/jiggicons';
import { PeroAmbientPresence } from '@opero/mascot';
import type { PermissionSurface } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';

export const PermissionsMemoryView: React.FC = () => {
  const {
    permissions,
    memoryStats,
    memoryHits,
    peroCapColor,
    peroJacketColor,
    requestOsPermission,
    openOsSettings,
    runQuickPrompt,
  } = useOperoStore();
  const [memQuery, setMemQuery] = useState('');

  const permRows: { surface: PermissionSurface; label: string; item: NonNullable<typeof permissions>['screenCapture'] | undefined }[] = [
    { surface: 'screen_capture', label: 'Screen & Window Recording', item: permissions?.screenCapture },
    { surface: 'accessibility', label: 'OS Accessibility / UI Tree (AX / UIA)', item: permissions?.accessibility },
    { surface: 'microphone', label: 'Microphone (Opt-In Speech Only)', item: permissions?.microphone },
  ];

  return (
    <div style={{ padding: '22px 26px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '520px' }}>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
            OS-LEVEL DEVICE PERMISSIONS &amp; DUAL-CORE VECTOR RAG
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, margin: '4px 0 6px' }}>
            Native Privacy Access &amp; Lightweight LLM Memory
          </h1>
          <p className="prose-measure" style={{ fontSize: '13.5px', color: 'var(--ink-muted)', margin: 0 }}>
            OPERO queries macOS TCC (CoreGraphics / ApplicationServices) and Windows (GraphicsCaptureAccess / UIPI) natively and embeds Dual-Core Vector RAG directly inside opero.sqlite3 (&lt; 8 MB RAM).
          </p>
        </div>
        <PeroAmbientPresence
          motion="privacy-shield"
          placement="stage"
          size={196}
          capColor={peroCapColor}
          jacketColor={peroJacketColor}
        />
      </div>

      {/* Native OS Device Permission Table */}
      <section aria-label="OS Device Permissions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <JiggIcon name="permissions" size={17} variant="duotone" />
            <span>Device Permission Matrix ({permissions?.osVersion ?? 'macOS / Windows'})</span>
          </h2>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
            Bundle: {permissions?.bundleId ?? 'com.mmi.opero'}
          </span>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {permRows.map((row, idx) => {
            const st = row.item?.state ?? 'not_determined';
            const pillClass = st === 'granted' ? 'verified' : st === 'denied' ? 'needs-review' : '';
            return (
              <div
                key={row.surface}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                  background: '#FFFFFF',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13.5px' }}>{row.label}</strong>
                    <span className={`status-pill ${pillClass}`}>{st}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '3px' }}>
                    {row.item?.guidance ?? 'Start local Rust daemon to inspect native OS permission state.'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="opero-btn primary"
                    disabled={st === 'disabled_by_policy'}
                    onClick={() => void requestOsPermission(row.surface)}
                    style={{ minHeight: '32px', fontSize: '12px' }}
                  >
                    <JiggIcon name="shield" size={14} variant="duotone" />
                    <span>Request OS Access</span>
                  </button>
                  <button
                    type="button"
                    className="opero-btn"
                    onClick={() => void openOsSettings(row.surface)}
                    style={{ minHeight: '32px', fontSize: '12px' }}
                  >
                    <JiggIcon name="settings" size={14} variant="outline" />
                    <span>Open OS Settings</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual-Core Vector RAG Explorer */}
      <section aria-label="Dual-Core Vector RAG Memory" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <JiggIcon name="memory" size={17} variant="duotone" />
            <span>Dual-Core Vector RAG (SQLite WAL · FTS5 + 384-dim int8)</span>
          </h2>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
            Core 1 Episodic: {memoryStats.episodicCount} · Core 2 Semantic: {memoryStats.semanticCount} · Footprint: {(memoryStats.estimatedRamBytes / 1024).toFixed(1)} KB
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (memQuery.trim()) void runQuickPrompt(memQuery.trim());
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            aria-label="Search Dual-Core Vector Memory"
            value={memQuery}
            onChange={(e) => setMemQuery(e.target.value)}
            placeholder="Query Core 1 (Episodic) + Core 2 (Semantic / Glossary) via hybrid RRF..."
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', background: 'var(--bg-subtle)' }}
          />
          <button type="submit" className="opero-btn primary">
            <JiggIcon name="search" size={15} variant="duotone" />
            <span>Hybrid Search</span>
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {memoryHits.map((hit) => (
            <div key={hit.chunk.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="status-pill" style={{ fontSize: '10px' }}>{hit.chunk.coreType}</span>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                  RRF {hit.rrfScore.toFixed(3)} · cos {hit.cosineSimilarity.toFixed(2)}
                </span>
              </div>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>{hit.chunk.title}</strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{hit.chunk.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
