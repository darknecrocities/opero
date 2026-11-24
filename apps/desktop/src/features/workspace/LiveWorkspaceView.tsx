import React, { useEffect, useState } from 'react';
import { getUiDictionary } from '@opero/i18n';
import { JiggIcon } from '@opero/jiggicons';
import { PeroAmbientPresence } from '@opero/mascot';
import { useOperoStore } from '../../store/useOperoStore';

function formatClock(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const LiveWorkspaceView: React.FC = () => {
  const {
    uiLocale,
    targetLocale,
    peroState,
    peroCapColor,
    peroJacketColor,
    sessions,
    activeSessionId,
    activeManual,
    impulses,
    elapsedMs,
    quickPromptReply,
    tickTimer,
    startRecordingFlow,
    pauseOrResumeFlow,
    snapWorkflowAction,
    stopAndDraftFlow,
    verifyStep,
    runQuickPrompt,
    setNavMode,
  } = useOperoStore();

  const dict = getUiDictionary(uiLocale);
  const [subTab, setSubTab] = useState<'steps' | 'summary' | 'notes' | 'translations'>('steps');
  const [promptInput, setPromptInput] = useState('');
  const [sessionTitleInput, setSessionTitleInput] = useState('MMI Inventory Item Registration');
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const isRecording = activeSession?.status === 'recording';
  const isPaused = activeSession?.status === 'paused';

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => tickTimer(1000), 1000);
    return () => window.clearInterval(id);
  }, [isRecording, tickTimer]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    void runQuickPrompt(promptInput.trim());
    setPromptInput('');
  };

  const handleQuickSnap = () => {
    const label = impulses.length % 2 === 0 ? 'Add New (Register)' : 'Save Record';
    void snapWorkflowAction(label);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top Session Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          borderBottom: '1px solid var(--border)',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <input
            aria-label="Workflow session title"
            value={activeSession ? activeSession.title : sessionTitleInput}
            onChange={(e) => setSessionTitleInput(e.target.value)}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              border: 'none',
              background: 'transparent',
              color: 'var(--ink)',
              minWidth: '240px',
            }}
          />
          <JiggIcon name="studio" size={16} variant="outline" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`status-pill ${isRecording ? 'recording' : isPaused ? 'paused' : 'verified'}`}>
            <JiggIcon name={isRecording ? 'capture' : isPaused ? 'pause' : 'verified'} size={13} variant="duotone" />
            <span>{isRecording ? dict.statusRecording : isPaused ? dict.statusPaused : dict.statusReady}</span>
            <span className="mono">{formatClock(elapsedMs)}</span>
          </span>

          {!isRecording && !isPaused ? (
            <button
              type="button"
              className="opero-btn primary"
              onClick={() => void startRecordingFlow(sessionTitleInput)}
            >
              <JiggIcon name="capture" size={16} variant="duotone" />
              <span>{dict.startCapture}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="opero-btn"
                onClick={handleQuickSnap}
              >
                <JiggIcon name="snap" size={15} variant="duotone" />
                <span>{dict.snapFrame}</span>
              </button>
              <button
                type="button"
                className="opero-btn icon-circle"
                onClick={() => void pauseOrResumeFlow()}
                aria-label={isPaused ? dict.resumeCapture : dict.pauseCapture}
                title={isPaused ? dict.resumeCapture : dict.pauseCapture}
              >
                <JiggIcon name="pause" size={16} variant="duotone" />
              </button>
              <button
                type="button"
                className="opero-btn primary icon-circle"
                onClick={() => void stopAndDraftFlow()}
                aria-label={dict.stopCapture}
                title={dict.stopCapture}
              >
                <JiggIcon name="stop" size={15} variant="duotone" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Split Center Canvas (Voxt-Inspired Spatial Rhythm on Pure Solid White) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(260px, 0.95fr)',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left Stream: Frameless Natural Pero Stage (when idle) OR Live Event Impulse Scrubber + Evidence Stream */}
        <div style={{ padding: '18px 22px', overflowY: 'auto', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {impulses.length === 0 && !activeManual ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '16px 12px',
              }}
            >
              <PeroAmbientPresence
                state={peroState}
                placement="stage"
                size={252}
                capColor={peroCapColor}
                jacketColor={peroJacketColor}
              />
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.025em', margin: '6px 0 6px' }}>
                {dict.appTagline}
              </h1>
              <p className="prose-measure" style={{ fontSize: '13.5px', color: 'var(--ink-muted)', margin: '0 0 16px' }}>
                Start an explicit local capture session. OPERO records interaction metadata, deduplicates frames, queries Dual-Core Memory, and drafts an editable manual in English, Japanese, and Filipino—with zero cloud exposure.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="opero-btn primary"
                  onClick={() => void startRecordingFlow(sessionTitleInput)}
                >
                  <JiggIcon name="capture" size={16} variant="duotone" />
                  <span>{dict.startCapture} (⌥Space)</span>
                </button>
                <button
                  type="button"
                  className="opero-btn"
                  onClick={() => setNavMode('memory')}
                >
                  <JiggIcon name="permissions" size={16} variant="duotone" />
                  <span>Verify OS Permissions</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Live Event & Frame Impulse Scrubber with Naturally Perched Pero */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '6px' }}>
                    EVENT &amp; FRAME IMPULSE TIMELINE · {impulses.length} CAPTURED SIGNALS
                  </div>
                  <svg viewBox="0 0 420 68" width="100%" height="68" role="img" aria-label="Captured workflow event impulse timeline">
                    <line x1="0" y1="34" x2="420" y2="34" stroke="#E2EAF2" strokeWidth="1" />
                    {Array.from({ length: 42 }).map((_, i) => {
                      const imp = impulses[i];
                      const h = imp ? Math.round(imp.intensity * 54) : 6;
                      const x = 6 + i * 10;
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={34 - h / 2}
                          width="3"
                          height={h}
                          rx="1.5"
                          fill={imp ? '#0F172A' : '#B9E0FE'}
                        />
                      );
                    })}
                  </svg>
                </div>
                <PeroAmbientPresence
                  state={peroState}
                  placement="perch"
                  size={86}
                  capColor={peroCapColor}
                  jacketColor={peroJacketColor}
                />
              </div>

              {/* Chronological Evidence & Drafted Step Stream */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeManual
                  ? activeManual.steps.map((step) => {
                      const variant = step.variants[targetLocale] ?? step.variants['en-US'];
                      return (
                        <div key={step.id} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                              {step.eventRefs.join(', ')} · {step.screenshotRefs.join(', ')}
                            </span>
                            <button
                              type="button"
                              className="opero-btn"
                              onClick={() => verifyStep(step.id)}
                              style={{ minHeight: '26px', padding: '2px 9px', fontSize: '11px' }}
                            >
                              <JiggIcon name="verified" size={13} variant="duotone" />
                              <span>{step.reviewStatus === 'verified' ? dict.statusVerified : 'Verify Step'}</span>
                            </button>
                          </div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                            {variant?.title}
                          </div>
                          <p className="prose-measure" style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink)' }}>
                            {variant?.body}
                          </p>
                        </div>
                      );
                    })
                  : impulses.map((imp) => (
                      <div key={imp.seq} style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                        <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                          {imp.timestamp} · ev_{String(imp.seq).padStart(3, '0')} · {imp.eventType}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
                          Target control: &ldquo;{imp.label}&rdquo;
                        </div>
                      </div>
                    ))}
              </div>
            </>
          )}
        </div>

        {/* Right Center Sub-Pane: Steps / Summary / Review Notes / Translations */}
        <div style={{ padding: '14px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            {(['steps', 'summary', 'notes', 'translations'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="opero-btn"
                onClick={() => setSubTab(t)}
                style={{
                  minHeight: '30px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  background: subTab === t ? 'var(--brand-sky-soft)' : 'transparent',
                  borderColor: subTab === t ? 'var(--border-strong)' : 'transparent',
                }}
              >
                {t === 'steps' ? dict.tabSteps : t === 'summary' ? dict.tabSummary : t === 'notes' ? dict.tabNotes : dict.tabTranslations}
              </button>
            ))}
          </div>

          {subTab === 'summary' || subTab === 'steps' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', margin: '0 0 8px' }}>Key Prerequisites</h2>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
                  <li>Authorized local access to target MMI application</li>
                  <li>Privacy exclusions active (1Password, Bitwarden, Keychain Access)</li>
                  <li>Dual-Core Memory grounding enabled (SQLite WAL)</li>
                </ul>
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', margin: '0 0 8px' }}>Review Checklist</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    <span>Verify evidence citations on all generated steps</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    <span>Confirm irreversible redactions before PDF/DOCX export</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    <span>Review Japanese (ja-JP) &amp; Filipino (fil-PH) glossary variants</span>
                  </label>
                </div>
              </div>
              {activeManual && (
                <button
                  type="button"
                  className="opero-btn primary"
                  onClick={() => setNavMode('studio')}
                >
                  <JiggIcon name="studio" size={16} variant="duotone" />
                  <span>Open in 3-Pane OPERO Studio</span>
                </button>
              )}
            </div>
          ) : subTab === 'translations' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                First-Class BCP-47 Variants · en-US · ja-JP · fil-PH
              </div>
              <div style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <strong>ja-JP</strong>: 「新規登録」をクリックし、項目コードを入力して「保存」を選択します。
              </div>
              <div style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <strong>fil-PH</strong>: Piliin ang &ldquo;新規登録&rdquo; (Add New), ilagay ang item code, at i-click ang &ldquo;保存&rdquo; (I-save).
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              Reviewer notes attach directly to `step_id` and persist inside local SQLite `audit_logs` without leaking sensitive screenshot data.
            </div>
          )}

          {quickPromptReply && (
            <div
              role="status"
              style={{
                marginTop: 'auto',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--brand-sky-soft)',
                border: '1px solid var(--border-strong)',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              <strong>Dual-Core RAG Response:</strong> {quickPromptReply}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Docked Quick Prompt + Favorites + Telemetry Strip (Voxt Anatomy) */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 18px', background: 'var(--bg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '12px', alignItems: 'center' }}>
          <form onSubmit={handlePromptSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <JiggIcon name="prompt" size={17} variant="duotone" />
            <input
              aria-label={dict.quickPromptTitle}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={dict.quickPromptPlaceholder}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '13px',
                background: 'var(--bg-subtle)',
                color: 'var(--ink)',
              }}
            />
            <button type="submit" className="opero-btn primary" style={{ minHeight: '34px' }}>
              <span>Ask RAG</span>
              <span className="mono" style={{ fontSize: '11px' }}>⌘↵</span>
            </button>
          </form>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'Draft SOP', icon: 'studio', q: 'Draft concise SOP steps using MMI glossary' },
              { label: 'Check Glossary', icon: 'glossary', q: 'Check Save and Submit glossary terms for ja-JP and fil-PH' },
              { label: 'Audit Redactions', icon: 'shield', q: 'Verify irreversible redaction readiness' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="opero-btn"
                onClick={() => void runQuickPrompt(chip.q)}
                style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}
              >
                <JiggIcon name={chip.icon} size={14} variant="duotone" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="mono"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border)',
            fontSize: '11px',
            color: 'var(--ink-muted)',
          }}
        >
          <span>
            Steps: {activeManual?.steps.length ?? 0} · Events: {impulses.length} · Duration: {formatClock(elapsedMs)}
          </span>
          <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <JiggIcon name="verified" size={13} variant="duotone" />
            <span>{dict.allChangesSaved}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
