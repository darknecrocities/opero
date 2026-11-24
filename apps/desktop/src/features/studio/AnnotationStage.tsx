import React, { useState } from 'react';
import { JiggIcon } from '@opero/jiggicons';
import type { AnnotationOverlay, AnnotationType, FirstClassLocale } from '@opero/shared-types';

interface AnnotationStageProps {
  stepId: string;
  screenshotId: string;
  locale: FirstClassLocale;
  annotations: AnnotationOverlay[];
  onAddAnnotation: (overlay: AnnotationOverlay) => void;
}

const TOOLS: { type: AnnotationType; label: string; icon: string }[] = [
  { type: 'number', label: 'Number', icon: 'number' },
  { type: 'arrow', label: 'Arrow', icon: 'arrow' },
  { type: 'rect', label: 'Box', icon: 'rect' },
  { type: 'blur', label: 'Redact', icon: 'blur' },
  { type: 'crop', label: 'Crop', icon: 'crop' },
  { type: 'label', label: 'Label', icon: 'label' },
  { type: 'spotlight', label: 'Spotlight', icon: 'spotlight' },
];

export const AnnotationStage: React.FC<AnnotationStageProps> = ({
  stepId,
  screenshotId,
  locale,
  annotations,
  onAddAnnotation,
}) => {
  const [activeTool, setActiveTool] = useState<AnnotationType>('number');
  const [irreversible, setIrreversible] = useState(true);

  const handlePlaceSample = () => {
    const idx = annotations.length + 1;
    const x = 0.14 + ((idx * 13) % 58) / 100;
    const y = 0.18 + ((idx * 11) % 52) / 100;
    onAddAnnotation({
      id: `ann_${stepId}_${Date.now()}`,
      screenshotId,
      stepId,
      type: activeTool,
      geometry: {
        x,
        y,
        w: activeTool === 'number' ? 0.05 : 0.22,
        h: activeTool === 'number' ? 0.08 : 0.14,
        x2: activeTool === 'arrow' ? Math.min(0.95, x + 0.18) : undefined,
        y2: activeTool === 'arrow' ? Math.min(0.92, y + 0.12) : undefined,
      },
      numberValue: activeTool === 'number' ? idx : undefined,
      localizedLabels: activeTool === 'label' ? { [locale]: 'Target Control' } : {},
      style: { strokeColor: activeTool === 'rect' ? '#69BCFC' : '#0F172A', spotlightDim: 0.55 },
      isIrreversibleRedaction: activeTool === 'blur' ? irreversible : false,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        className="glass-thin"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {TOOLS.map((t) => (
            <button
              key={t.type}
              type="button"
              className={`opero-btn ${activeTool === t.type ? 'primary' : ''}`}
              onClick={() => setActiveTool(t.type)}
              style={{ minHeight: '30px', padding: '4px 9px', fontSize: '12px' }}
            >
              <JiggIcon name={t.icon} size={14} variant="duotone" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTool === 'blur' && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={irreversible}
                onChange={(e) => setIrreversible(e.target.checked)}
              />
              <span>Irreversible on Export</span>
            </label>
          )}
          <button type="button" className="opero-btn" onClick={handlePlaceSample} style={{ minHeight: '30px', fontSize: '12px' }}>
            <JiggIcon name="add" size={14} variant="duotone" />
            <span>Add Overlay</span>
          </button>
        </div>
      </div>

      {/* Non-Destructive Vector Annotation Canvas on Solid White Document Sheet */}
      <svg
        viewBox="0 0 640 360"
        width="100%"
        style={{ border: '1px solid var(--border)', borderRadius: '10px', background: '#F8FAFC', display: 'block' }}
        role="img"
        aria-label={`Screenshot ${screenshotId} with ${annotations.length} non-destructive annotations`}
      >
        <rect x="0" y="0" width="640" height="40" fill="#F4F9FF" />
        <line x1="0" y1="40" x2="640" y2="40" stroke="#E2EAF2" strokeWidth="1" />
        <text x="16" y="25" fontSize="12" fill="#0F172A" fontFamily="sans-serif" fontWeight="600">
          MMI Inventory Portal · {screenshotId}
        </text>
        <rect x="44" y="84" width="240" height="36" rx="8" fill="#FFFFFF" stroke="#E2EAF2" />
        <rect x="44" y="138" width="240" height="36" rx="8" fill="#FFFFFF" stroke="#E2EAF2" />
        <rect x="44" y="198" width="132" height="38" rx="8" fill="#0F172A" />
        <text x="72" y="222" fontSize="13" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="600">
          新規登録 / Save
        </text>

        {annotations.map((ann) => {
          const x = ann.geometry.x * 640;
          const y = ann.geometry.y * 360;
          const w = ann.geometry.w * 640;
          const h = ann.geometry.h * 360;
          if (ann.type === 'number') {
            return (
              <g key={ann.id}>
                <circle cx={x} cy={y} r="14" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fill="#FFFFFF" fontWeight="700">
                  {ann.numberValue ?? 1}
                </text>
              </g>
            );
          }
          if (ann.type === 'arrow') {
            const x2 = (ann.geometry.x2 ?? ann.geometry.x + 0.15) * 640;
            const y2 = (ann.geometry.y2 ?? ann.geometry.y + 0.1) * 360;
            return (
              <line key={ann.id} x1={x} y1={y} x2={x2} y2={y2} stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            );
          }
          if (ann.type === 'blur') {
            return (
              <g key={ann.id}>
                <rect x={x} y={y} width={w} height={h} rx="4" fill="#0F172A" fillOpacity={ann.isIrreversibleRedaction ? 0.92 : 0.45} />
                <text x={x + 6} y={y + 16} fontSize="10" fill="#FFFFFF" fontFamily="monospace">
                  {ann.isIrreversibleRedaction ? 'REDACT' : 'BLUR'}
                </text>
              </g>
            );
          }
          if (ann.type === 'label') {
            return (
              <g key={ann.id}>
                <rect x={x} y={y} width={Math.max(110, w)} height="28" rx="6" fill="#EBF6FF" stroke="#B9E0FE" />
                <text x={x + 8} y={y + 18} fontSize="11" fill="#0F172A" fontWeight="600">
                  {ann.localizedLabels[locale] ?? 'Target Control'}
                </text>
              </g>
            );
          }
          return (
            <rect
              key={ann.id}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="6"
              fill={ann.type === 'spotlight' ? 'rgba(105,188,252,0.12)' : 'none'}
              stroke={ann.type === 'crop' ? '#0F172A' : '#69BCFC'}
              strokeWidth="2.5"
              strokeDasharray={ann.type === 'crop' ? '6 4' : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
};
