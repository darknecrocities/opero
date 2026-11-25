import React from 'react';
import type { PendingAgentAction } from '@opero/shared-types';

interface AgentActionCardProps {
  action: PendingAgentAction;
  busy: boolean;
  onApprove: (actionId: string) => void;
  onCancel: (actionId: string) => void;
}

const HIDDEN_PAYLOAD_KEYS = new Set(['dates', 'icsStart', 'googleUrl', 'mailtoUrl']);

export const AgentActionCard: React.FC<AgentActionCardProps> = ({
  action,
  busy,
  onApprove,
  onCancel,
}) => {
  const isPending = action.status === 'pending';
  const isExecuted = action.status === 'executed';
  const isCancelled = action.status === 'cancelled';

  const visibleEntries = Object.entries(action.payload ?? {}).filter(
    ([k, v]) => !HIDDEN_PAYLOAD_KEYS.has(k) && v.trim().length > 0,
  );

  return (
    <div
      data-testid="agent-action-card"
      style={{
        borderRadius: '12px',
        border: isExecuted
          ? '1px solid var(--success)'
          : isPending
            ? '1px solid var(--border-strong)'
            : '1px solid var(--border)',
        background: isExecuted ? 'var(--success-soft)' : 'var(--bg-surface)',
        padding: '11px 13px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--ink)' }}>
          {action.title}
        </strong>
        <span
          className={`status-pill ${isExecuted ? 'verified' : isPending ? 'paused' : ''}`}
          style={{ fontSize: '10.5px', padding: '2px 8px' }}
        >
          {isPending ? 'Confirmation Required' : isExecuted ? 'Executed' : isCancelled ? 'Cancelled' : 'Failed'}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.45 }}>
        {action.summary}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '4px 10px',
          fontSize: '11.5px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'var(--bg-subtle)',
        }}
      >
        <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Target</span>
        <span style={{ color: 'var(--ink)' }}>{action.targetApp}</span>
        {visibleEntries.map(([key, val]) => (
          <React.Fragment key={key}>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'capitalize' }}>{key}</span>
            <span style={{ color: 'var(--ink)', wordBreak: 'break-word' }}>{val}</span>
          </React.Fragment>
        ))}
      </div>

      {isPending && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="opero-btn primary"
            disabled={busy}
            onClick={() => onApprove(action.id)}
            style={{ minHeight: '32px', padding: '4px 14px', fontSize: '12px' }}
          >
            {busy ? 'Running...' : 'Approve & Run'}
          </button>
          <button
            type="button"
            className="opero-btn"
            disabled={busy}
            onClick={() => onCancel(action.id)}
            style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}
          >
            Cancel
          </button>
        </div>
      )}

      {!isPending && action.resultMessage && (
        <div style={{ fontSize: '11.5px', color: isExecuted ? 'var(--success)' : 'var(--ink-muted)' }}>
          {action.resultMessage}
        </div>
      )}
    </div>
  );
};
