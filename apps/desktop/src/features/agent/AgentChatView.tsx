import React, { useEffect, useRef, useState } from 'react';
import { getFeatureStrings } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { PeroAmbientPresence } from '@opero/mascot';
import type { AgentThread, OllamaRuntimeStatus } from '@opero/shared-types';
import { PeroAvatar } from '../../components/PeroAvatar';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';

export const AgentChatView: React.FC = () => {
  const {
    uiLocale,
    activeModelId,
    soundEnabled,
    userProfile,
    peroCapColor,
    peroJacketColor,
    pendingAgentPrompt,
    clearPendingAgentPrompt,
    setNavMode,
  } = useOperoStore();
  const feat = getFeatureStrings(uiLocale);
  const activeModel = DEFAULT_MODELS.find((m) => m.id === activeModelId);
  const selectedOllamaTag = activeModel?.ollamaTag ?? 'qwen3:1.7b';

  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<OllamaRuntimeStatus | null>(null);
  const [startingRuntime, setStartingRuntime] = useState(false);
  const [input, setInput] = useState('');
  const [optimisticPrompt, setOptimisticPrompt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const userInitial = (userProfile.name?.trim()[0] ?? 'U').toUpperCase();

  const refreshRuntime = async () => {
    try {
      const { runtime: rt } = await operoClient.getModelRuntimeStatus();
      setRuntime(rt);
    } catch {
      // Ignore if daemon offline
    }
  };

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
    void refreshRuntime();
    void refreshThreads();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, optimisticPrompt, busy]);

  const handleStartLocalAi = async () => {
    setStartingRuntime(true);
    playJiggSfx('click', soundEnabled);
    try {
      const { runtime: rt } = await operoClient.ensureModelRuntime({
        modelTag: selectedOllamaTag,
        pullIfMissing: true,
      });
      setRuntime(rt);
      playJiggSfx('success', soundEnabled);
    } finally {
      setStartingRuntime(false);
    }
  };

  const sendPrompt = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    setOptimisticPrompt(clean);
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
      if (resp.modelLive) {
        void refreshRuntime();
      }
      playJiggSfx('success', soundEnabled);
    } finally {
      setOptimisticPrompt(null);
      setBusy(false);
    }
  };

  useEffect(() => {
    if (pendingAgentPrompt) {
      const q = pendingAgentPrompt;
      clearPendingAgentPrompt();
      void sendPrompt(q);
    }
  }, [pendingAgentPrompt]);

  const starters = [feat.agentStarter1, feat.agentStarter2, feat.agentStarter3];
  const isModelLive = Boolean(runtime?.running && runtime?.activeModelReady);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PeroAvatar size={40} thinking={busy || startingRuntime} />
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 800, letterSpacing: '-0.025em' }}>
              {feat.agentTitle}
            </h1>
            <div style={{ marginTop: '2px', fontSize: '12px', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '999px',
                  background: isModelLive ? '#69BCFC' : '#CBD5E1',
                  display: 'inline-block',
                }}
              />
              <span>
                {isModelLive
                  ? `${activeModel?.displayName ?? runtime?.activeModel} · Live`
                  : uiLocale === 'ja-JP'
                    ? 'ローカルAI停止中（下のボタンで起動）'
                    : 'Local AI offline — start Ollama for live replies'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isModelLive && (
            <button
              type="button"
              className="opero-btn primary"
              disabled={startingRuntime}
              onClick={() => void handleStartLocalAi()}
              style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}
            >
              <JiggIcon name="router" size={14} variant="duotone" />
              <span>
                {startingRuntime
                  ? uiLocale === 'ja-JP'
                    ? '起動中...'
                    : 'Starting Local AI...'
                  : uiLocale === 'ja-JP'
                    ? 'ローカルAIを起動'
                    : 'Start Local AI'}
              </span>
            </button>
          )}
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
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '8px 2px',
          minHeight: 0,
        }}
      >
        {(!activeThread || activeThread.messages.length === 0) && !optimisticPrompt ? (
          <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '520px', textAlign: 'center' }}>
            <PeroAmbientPresence
              state={busy ? 'processing' : 'ready'}
              placement="stage"
              size={144}
              capColor={peroCapColor}
              jacketColor={peroJacketColor}
            />
            <div style={{ fontSize: '13.5px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              {feat.agentSubtitle}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {starters.map((s, idx) => (
                <button
                  key={s}
                  type="button"
                  className="opero-btn opero-quick-tile"
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'start',
                    padding: '11px 14px',
                    fontSize: '13px',
                    animationDelay: `${idx * 60}ms`,
                  }}
                  onClick={() => void sendPrompt(s)}
                >
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {(activeThread?.messages ?? []).map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className="opero-chat-bubble"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    gap: '10px',
                  }}
                >
                  {!isUser && <PeroAvatar size={32} />}
                  <article
                    style={{
                      maxWidth: '76%',
                      padding: '12px 15px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser ? '#0F172A' : '#F8FAFC',
                      color: isUser ? '#FFFFFF' : 'var(--ink)',
                      border: isUser ? 'none' : '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '13.5px', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
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
                  {isUser && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '999px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {userInitial}
                    </span>
                  )}
                </div>
              );
            })}

            {optimisticPrompt && (
              <div className="opero-chat-bubble" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '10px' }}>
                <article style={{ maxWidth: '76%', padding: '12px 15px', borderRadius: '16px 16px 4px 16px', background: '#0F172A', color: '#FFFFFF', fontSize: '13.5px' }}>
                  {optimisticPrompt}
                </article>
                <span aria-hidden="true" style={{ width: '30px', height: '30px', borderRadius: '999px', background: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {userInitial}
                </span>
              </div>
            )}

            {busy && (
              <div className="opero-chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PeroAvatar size={32} thinking />
                <div
                  aria-label="Pero is thinking"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#F8FAFC',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="pero-typing-dot" style={{ animationDelay: '0ms' }} />
                  <span className="pero-typing-dot" style={{ animationDelay: '140ms' }} />
                  <span className="pero-typing-dot" style={{ animationDelay: '280ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
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
            borderRadius: '12px',
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
