import React from 'react';
import { PeroAmbientPresence } from '@opero/mascot';
import { useOperoStore } from '../store/useOperoStore';

export const PeroCompilingOverlay: React.FC = () => {
  const { compilingOverlay, peroCapColor, peroJacketColor } = useOperoStore();
  if (!compilingOverlay || !compilingOverlay.visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={compilingOverlay.title}
      data-testid="pero-compiling-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(15, 23, 42, 0.48)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <PeroAmbientPresence
          state="processing"
          placement="stage"
          size={196}
          capColor={peroCapColor}
          jacketColor={peroJacketColor}
        />

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
          }}
        >
          {compilingOverlay.title}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {compilingOverlay.steps.map((label, idx) => {
            const active = idx === compilingOverlay.stepIndex;
            const done = idx < compilingOverlay.stepIndex;
            return (
              <div
                key={`compile-step-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: done || active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.58)',
                  textAlign: 'start',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: done ? '#69BCFC' : active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)',
                    flexShrink: 0,
                  }}
                />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
