import React from 'react';

interface AgentThinkingBlockProps {
  thinking: string;
}

export const AgentThinkingBlock: React.FC<AgentThinkingBlockProps> = ({ thinking }) => {
  const clean = thinking.trim();
  if (!clean) return null;

  const lines = clean.split('\n').filter((l) => l.trim().length > 0);
  const stepCount = lines.filter((l) => /^\d+\.\s/.test(l.trim())).length;

  return (
    <details
      style={{
        borderRadius: '10px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        padding: '7px 11px',
        fontSize: '12px',
        color: 'var(--ink-muted)',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 600,
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          userSelect: 'none',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Thought Process</span>
        </span>
        {stepCount > 0 && (
          <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
            {stepCount} steps
          </span>
        )}
      </summary>
      <div
        style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          lineHeight: 1.55,
          fontSize: '11.5px',
        }}
      >
        {lines.map((line, idx) => {
          const isStep = /^\d+\.\s/.test(line.trim());
          return (
            <div
              key={idx}
              style={{
                fontWeight: isStep ? 600 : 400,
                color: isStep ? 'var(--ink)' : 'var(--ink-muted)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </details>
  );
};
