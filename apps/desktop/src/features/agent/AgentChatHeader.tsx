import React from 'react';
import { JiggIcon } from '@opero/jiggicons';
import type { FirstClassLocale, OllamaRuntimeStatus } from '@opero/shared-types';
import { PeroAvatar } from '../../components/PeroAvatar';

interface AgentChatHeaderProps {
  title: string;
  uiLocale: FirstClassLocale;
  historyOpen: boolean;
  busy: boolean;
  startingRuntime: boolean;
  manualOffline: boolean;
  isModelLive: boolean;
  liveModelLabel: string;
  runtime: OllamaRuntimeStatus | null;
  autoStartAttemptedKey: string | null;
  onOpenHistory: () => void;
  onStartLocalAi: () => void;
  onOpenCapabilities: () => void;
}

export const AgentChatHeader: React.FC<AgentChatHeaderProps> = ({
  title,
  uiLocale,
  historyOpen,
  busy,
  startingRuntime,
  manualOffline,
  isModelLive,
  liveModelLabel,
  runtime,
  autoStartAttemptedKey,
  onOpenHistory,
  onStartLocalAi,
  onOpenCapabilities,
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {!historyOpen && (
        <button
          type="button"
          className="opero-btn"
          aria-label="Open chat history"
          title="Show Chat History"
          onClick={onOpenHistory}
          style={{ minHeight: '32px', width: '32px', padding: 0 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      <PeroAvatar size={38} thinking={busy || startingRuntime} />
      <div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.025em' }}>
          {title}
        </h1>
        <div style={{ marginTop: '2px', fontSize: '12px', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: isModelLive || startingRuntime ? '#69BCFC' : '#C7C3BC',
              display: 'inline-block',
            }}
          />
          <span>
            {manualOffline
              ? uiLocale === 'ja-JP'
                ? 'Built-In Offline モードで動作しています'
                : 'Built-In Offline mode active'
              : isModelLive
                ? `${liveModelLabel} · Live · EN / JA / Tagalog`
                : startingRuntime
                  ? uiLocale === 'ja-JP'
                    ? 'ローカルAIを自動起動しています…'
                    : 'Starting Local AI automatically...'
                  : uiLocale === 'ja-JP'
                    ? 'ローカルAIが停止しています（再試行ボタンで起動できます）'
                    : runtime?.guidance || 'Local AI offline — retry to start Ollama'}
          </span>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {!manualOffline && !isModelLive && !startingRuntime && (
        <button
          type="button"
          className="opero-btn primary"
          onClick={onStartLocalAi}
          style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}
        >
          <JiggIcon name="router" size={14} variant="duotone" />
          <span>{autoStartAttemptedKey ? 'Retry Local AI' : 'Start Local AI'}</span>
        </button>
      )}
      <button
        type="button"
        className="opero-btn"
        onClick={onOpenCapabilities}
        title="Configure Agent Capabilities"
        style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}
      >
        <JiggIcon name="settings" size={14} variant="duotone" />
        <span>Capabilities</span>
      </button>
    </div>
  </div>
);
