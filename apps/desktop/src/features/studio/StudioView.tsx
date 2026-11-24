import React, { useState } from 'react';
import { JiggIcon } from '@opero/jiggicons';
import { PeroAmbientPresence } from '@opero/mascot';
import { useOperoStore } from '../../store/useOperoStore';
import { AnnotationStage } from './AnnotationStage';

/**
 * [UI-004] OPERO Studio Center Document Canvas remains solid #FFFFFF and mascot-free
 * during dense step authoring. Frameless Pero appears only in the empty state.
 */
export const StudioView: React.FC = () => {
  const {
    activeManual,
    targetLocale,
    peroCapColor,
    peroJacketColor,
    verifyStep,
    updateStepText,
    addAnnotation,
    setNavMode,
  } = useOperoStore();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  if (!activeManual) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <PeroAmbientPresence
          motion="annotating-arrows"
          placement="stage"
          size={240}
          capColor={peroCapColor}
          jacketColor={peroJacketColor}
        />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '8px 0 6px' }}>
          OPERO Studio Ready
        </h2>
        <p className="prose-measure" style={{ fontSize: '13.5px', color: 'var(--ink-muted)', margin: '0 0 16px' }}>
          Record a workflow in Live Capture and stop the session to open your illustrated manual here with all 7 non-destructive annotation overlays.
        </p>
        <button type="button" className="opero-btn primary" onClick={() => setNavMode('capture')}>
          <JiggIcon name="capture" size={16} variant="duotone" />
          <span>Go to Live Capture</span>
        </button>
      </div>
    );
  }

  const activeStep = activeManual.steps.find((s) => s.id === selectedStepId) ?? activeManual.steps[0]!;
  const variant = activeStep.variants[targetLocale] ?? activeStep.variants['en-US'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0, 1fr)', height: '100%', minHeight: 0 }}>
      {/* Studio Step Outline */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-subtle)', padding: '14px 10px', overflowY: 'auto' }}>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '8px', padding: '0 6px' }}>
          MANUAL OUTLINE ({activeManual.steps.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {activeManual.steps.map((st) => {
            const v = st.variants[targetLocale] ?? st.variants['en-US'];
            const sel = st.id === activeStep.id;
            return (
              <button
                key={st.id}
                type="button"
                className={`nav-item ${sel ? 'active' : ''}`}
                onClick={() => setSelectedStepId(st.id)}
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{v?.title ?? `Step ${st.orderIndex}`}</span>
                <span className="mono" style={{ fontSize: '10px', color: st.reviewStatus === 'verified' ? 'var(--success)' : 'var(--warning)' }}>
                  {st.reviewStatus} · {st.annotations.length} overlays
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Solid #FFFFFF Document Sheet (Zero Mascot Clutter [UI-004]) */}
      <div style={{ padding: '22px 28px', overflowY: 'auto', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                {activeManual.id} · Locale {targetLocale} · Provenance: {activeStep.eventRefs.join(', ')}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '4px 0 0' }}>
                {activeManual.title}
              </h1>
            </div>
            <button
              type="button"
              className={`opero-btn ${activeStep.reviewStatus === 'verified' ? '' : 'primary'}`}
              onClick={() => verifyStep(activeStep.id)}
            >
              <JiggIcon name="verified" size={15} variant="duotone" />
              <span>{activeStep.reviewStatus === 'verified' ? 'Verified' : 'Verify Step'}</span>
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>STEP HEADING ({targetLocale})</span>
            <input
              value={variant?.title ?? ''}
              onChange={(e) => updateStepText(activeStep.id, targetLocale, e.target.value, variant?.body ?? '')}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 700,
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>PROCEDURAL INSTRUCTION ({targetLocale})</span>
            <textarea
              rows={3}
              value={variant?.body ?? ''}
              onChange={(e) => updateStepText(activeStep.id, targetLocale, variant?.title ?? '', e.target.value)}
              className="prose-measure"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                resize: 'vertical',
              }}
            />
          </label>

          <AnnotationStage
            stepId={activeStep.id}
            screenshotId={activeStep.screenshotRefs[0] ?? 'sc_001'}
            locale={targetLocale}
            annotations={activeStep.annotations}
            onAddAnnotation={(overlay) => addAnnotation(activeStep.id, overlay)}
          />
        </div>
      </div>
    </div>
  );
};
