import React, { useEffect, useState } from 'react';
import { getFeatureStrings } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { PeroAmbientPresence } from '@opero/mascot';
import type { AgentThread } from '@opero/shared-types';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';

export const AgentChatView: React.FC = () => {
  const {
    uiLocale,
    activeModelId,
    soundEnabled,
    peroCapColor,
    peroJacketColor,
    setNavMode,
  } = useOperoStore();
  const feat = getFeatureStrings(uiLocale);
  const selectedOllamaTag = DEFAULT_MODELS.find((m) => m.id === activeModelId)?.ollamaTag;

  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const refreshThreads = async (selectId?: string) => {
    try {
      const { threads: list } = await operoClient.listAgentThreads();
      setThreads(list);
      if (selectId) setActiveThreadId(selectId);
      else if (!activeThreadId && list[0]) setActiveThreadId(list[0].id);
    } catch {
      // Daemon offline fallback
    }
  };

  useEffect(() => {
    void refreshThreads();
  }, []);

  const sendPrompt = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    setInput('');
    playJiggSfx('click', soundEnabled);
    try {
      const resp = await operoClient.sendAgentMessage({
        threadId: activeThreadId ?? undefined,
        prompt: clean,
        locale: uiLocale,
        preferredModel: selectedOllamaTag,
      });
      await refreshThreads(resp.threadId);
      playJiggSfx('success', soundEnabled);
    } finally {
      setBusy(false);
    }
  };

  const starters = [feat.agentStarter1, feat.agentStarter2, feat.agentStarter3];

  return (
    <div
      className="opero-view-enter"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        padding: '22px 28px',
        gap: '14px',
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.025em' }}>
            {feat.agentTitle}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--ink-muted)' }}>
            {feat.agentSubtitle}
          </p>
        </div>
        <button
          type="button"
          className="opero-btn"
          onClick={() => setActiveThreadId(null)}
          style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}
        >
          <JiggIcon name="add" size={14} variant="duotone" />
          <span>{feat.agentNewChatBtn}</span>
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '8px 0',
          minHeight: 0,
        }}
      >
        {!activeThread || activeThread.messages.length === 0 ? (
          <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', maxWidth: '520px', textAlign: 'center' }}>
            <PeroAmbientPresence
              state={busy ? 'processing' : 'ready'}
              placement="stage"
              size={148}
              capColor={peroCapColor}
              jacketColor={peroJacketColor}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="opero-btn"
                  onClick={() => void sendPrompt(s)}
                  style={{ justifyContent: 'flex-start', textAlign: 'start', padding: '10px 14px', fontSize: '13px' }}
                >
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          activeThread.messages.map((m) => (
            <article
              key={m.id}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
                padding: '12px 15px',
                borderRadius: '14px',
                background: m.role === 'user' ? '#0F172A' : '#F8FAFC',
                color: m.role === 'user' ? '#FFFFFF' : 'var(--ink)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {m.content}
              </div>

              {m.toolCalls.length > 0 && (
                <details style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                    {feat.agentToolsUsed} ({m.toolCalls.length})
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {m.toolCalls.map((tc, idx) => (
                      <div key={`tc-${idx}`} className="mono" style={{ fontSize: '11px' }}>
                        {tc.tool}: {tc.summary}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {m.actionLink && (
                <div>
                  <button
                    type="button"
                    className="opero-btn"
                    onClick={() => {
                      if (m.actionLink?.kind === 'manual') setNavMode('studio');
                      else if (m.actionLink?.kind === 'document') setNavMode('analyzer');
                      else if (m.actionLink?.kind === 'meeting') setNavMode('meetings');
                    }}
                    style={{ minHeight: '28px', padding: '3px 10px', fontSize: '12px' }}
                  >
                    <span>{m.actionLink.label}</span>
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendPrompt(input);
        }}
        style={{
          display: 'flex',
          gap: '8px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <input
          type="text"
          aria-label="Ask Pero Agent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={feat.agentInputPlaceholder}
          style={{
            flex: 1,
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '13.5px',
            background: '#FFFFFF',
            color: 'var(--ink)',
          }}
        />
        <button type="submit" className="opero-btn primary" disabled={busy || !input.trim()}>
          <span>{busy ? '...' : feat.agentSendBtn}</span>
        </button>
      </form>
    </div>
  );
};
