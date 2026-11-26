import React, { useEffect, useState } from 'react';
import { PeroStateMascot } from '@opero/mascot';
import { useOperoStore } from '../../store/useOperoStore';

interface AnalyzerLoadingMascotProps {
  filename: string;
}

export const AnalyzerLoadingMascot: React.FC<AnalyzerLoadingMascotProps> = ({ filename }) => {
  const { uiLocale, userProfile } = useOperoStore();
  const [stageIdx, setStageIdx] = useState(0);

  const stages =
    uiLocale === 'ja-JP'
      ? [
          'ドキュメントのテキストとページ構造を読み込んでいます...',
          'ローカルAIで全体の要約と重要ポイントを抽出しています...',
          'プレビューと注釈レポートを準備しています...',
        ]
      : uiLocale === 'fil-PH'
        ? [
            'Binabasa at kinukuha ang mga pahina at teksto ng dokumento...',
            'Binubuod ng Local AI ang buong dokumento at mga mahahalagang punto...',
            'Inihahanda ang visual preview at mga anotasyon...',
          ]
        : [
            'Reading pages and extracting clean document structure...',
            'Summarizing the entire document & key points with Local AI...',
            'Preparing visual preview and grounded annotations...',
          ];

  useEffect(() => {
    setStageIdx(0);
    const t1 = window.setTimeout(() => setStageIdx(1), 1200);
    const t2 = window.setTimeout(() => setStageIdx(2), 3400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [filename]);

  const title =
    uiLocale === 'ja-JP'
      ? 'Peroがドキュメント全体を分析しています'
      : uiLocale === 'fil-PH'
        ? 'Sinusuri ni Pero ang buong dokumento'
        : 'Please wait — Pero is analyzing the whole document';

  const subtitle =
    uiLocale === 'ja-JP'
      ? '完了までこのまましばらくお待ちください。すべてローカル環境で安全に処理しています。'
      : uiLocale === 'fil-PH'
        ? 'Mangyaring maghintay sandali habang pinoproseso ito nang 100% offline.'
        : 'Hang tight while OPERO summarizes every page and prepares your visual report offline.';

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="analyzer-loading-mascot"
      className="glass-regular"
      style={{
        borderRadius: '22px',
        padding: '38px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        textAlign: 'center',
        minHeight: '360px',
      }}
    >
      <div style={{ width: '132px', height: '132px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PeroStateMascot
          state="processing"
          size={128}
          capColor={userProfile.peroCapColor}
          jacketColor={userProfile.peroJacketColor}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '480px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
          {title}
        </div>
        <div className="mono" style={{ fontSize: '12px', color: 'var(--brand-sky-deep)', fontWeight: 600 }}>
          {filename}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
          {subtitle}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
          maxWidth: '420px',
          marginTop: '6px',
          textAlign: 'start',
        }}
      >
        {stages.map((label, idx) => {
          const done = idx < stageIdx;
          const active = idx === stageIdx;
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: active ? 'var(--brand-sky-soft)' : 'var(--bg-surface)',
                border: active ? '1px solid var(--brand-sky)' : '1px solid var(--border)',
                fontSize: '12.5px',
                color: active || done ? 'var(--ink)' : 'var(--ink-muted)',
                fontWeight: active ? 600 : 400,
                transition: 'all 200ms ease',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: done ? '#16A34A' : active ? 'var(--brand-sky)' : 'var(--border-strong)',
                  flexShrink: 0,
                }}
              />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
