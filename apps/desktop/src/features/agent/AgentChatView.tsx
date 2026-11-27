import React, { useEffect, useRef, useState } from 'react';
import { getFeatureStrings } from '@opero/i18n';
import { playJiggSfx } from '@opero/jiggicons';
import { PeroAmbientPresence } from '@opero/mascot';
import type { AgentThread } from '@opero/shared-types';
import { PeroAvatar } from '../../components/PeroAvatar';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';
import { resolvePreferredOllamaTag, useRuntimeStore } from '../../store/useRuntimeStore';
import { AgentActionCard } from './AgentActionCard';
import { AgentChatHeader } from './AgentChatHeader';
import { AgentHistorySidebar } from './AgentHistorySidebar';
import { AgentMessageContent } from './AgentMessageContent';
import { AgentThinkingBlock } from './AgentThinkingBlock';

export const AgentChatView: React.FC = () => {
  const {
    uiLocale, activeModelId, hardwareProfile, daemonOnline, soundEnabled, userProfile,
    peroCapColor, peroJacketColor, pendingAgentPrompt, clearPendingAgentPrompt,
    setNavMode, setHardwareProfile, showToast,
  } = useOperoStore();
  const {
    runtime,
    starting: startingRuntime,
    manualOffline,
    autoStartAttemptedKey,
    refreshRuntime,
    ensureRuntime,
  } = useRuntimeStore();
  const feat = getFeatureStrings(uiLocale);
  const activeModel = DEFAULT_MODELS.find((m) => m.id === activeModelId);
  const selectedOllamaTag =
    resolvePreferredOllamaTag(activeModelId, hardwareProfile, manualOffline) ?? 'qwen2.5:3b';

  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState<boolean>(true);
  const [input, setInput] = useState('');
  const [optimisticPrompt, setOptimisticPrompt] = useState<string | null>(null);
  const [animatingMsgId, setAnimatingMsgId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const userInitial = (userProfile.name?.trim()[0] ?? 'U').toUpperCase();
  const isModelLive = Boolean(!manualOffline && runtime?.running && runtime?.activeModelReady);
  const liveModelLabel =
    (activeModel?.ollamaTag ? activeModel.displayName : null) ??
    runtime?.activeModel ??
    activeModel?.displayName ??
    'Local AI';

  const refreshThreads = async (selectId?: string) => {
    try {
      const { threads: list } = await operoClient.listAgentThreads();
      setThreads(list);
      if (selectId) setActiveThreadId(selectId);
      else if (!activeThreadId && list[0]) setActiveThreadId(list[0].id);
    } catch {
      // Daemon offline
    }
  };

  useEffect(() => {
    void refreshThreads();
  }, [daemonOnline]);

  useEffect(() => {
    if (!daemonOnline) return;
    if (manualOffline) {
      void refreshRuntime('offline');
      return;
    }
    if (!isModelLive && !startingRuntime && autoStartAttemptedKey !== selectedOllamaTag) {
      void ensureRuntime(selectedOllamaTag, {
        onHardwareUpdated: (hw) => setHardwareProfile(hw),
      });
    } else if (isModelLive && runtime?.activeModel && runtime.activeModel !== selectedOllamaTag) {
      void refreshRuntime(selectedOllamaTag);
    }
  }, [
    daemonOnline,
    manualOffline,
    selectedOllamaTag,
    isModelLive,
    startingRuntime,
    autoStartAttemptedKey,
    hardwareProfile?.installedModels.length,
    ensureRuntime,
    refreshRuntime,
    setHardwareProfile,
    runtime?.activeModel,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, optimisticPrompt, busy]);

  const handleStartLocalAi = async () => {
    playJiggSfx('click', soundEnabled);
    const rt = await ensureRuntime(selectedOllamaTag, {
      force: true,
      pullIfMissing: Boolean(hardwareProfile?.autoDownloadAllowed),
      onHardwareUpdated: (hw) => setHardwareProfile(hw),
    });
    if (rt?.running && rt.activeModelReady) {
      playJiggSfx('success', soundEnabled);
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
        preferredModel: manualOffline ? 'offline' : selectedOllamaTag,
      });
      setAnimatingMsgId(resp.message.id);
      await refreshThreads(resp.threadId);
      if (resp.modelLive) void refreshRuntime(selectedOllamaTag);
      playJiggSfx('success', soundEnabled);
    } finally {
      setOptimisticPrompt(null);
      setBusy(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    playJiggSfx('click', soundEnabled);
    try {
      await operoClient.deleteAgentThread(threadId);
      const nextThreads = threads.filter((t) => t.id !== threadId);
      setThreads(nextThreads);
      if (activeThreadId === threadId) {
        setActiveThreadId(nextThreads[0]?.id ?? null);
      }
    } catch {
      showToast('Could not delete chat thread');
    }
  };

  const handleApproveAction = async (actionId: string) => {
    setActionBusyId(actionId);
    playJiggSfx('click', soundEnabled);
    try {
      const { action } = await operoClient.approveAgentAction(actionId);
      await refreshThreads(activeThreadId ?? undefined);
      playJiggSfx('success', soundEnabled);
      showToast(action.resultMessage ?? 'Action executed');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCancelAction = async (actionId: string) => {
    setActionBusyId(actionId);
    playJiggSfx('click', soundEnabled);
    try {
      await operoClient.cancelAgentAction(actionId);
      await refreshThreads(activeThreadId ?? undefined);
      showToast('Action cancelled');
    } finally {
      setActionBusyId(null);
    }
  };

  useEffect(() => {
    if (pendingAgentPrompt && !busy) {
      const p = pendingAgentPrompt;
      clearPendingAgentPrompt();
      void sendPrompt(p);
    }
  }, [pendingAgentPrompt, busy, clearPendingAgentPrompt]);

  const starters = uiLocale === 'ja-JP'
    ? ['明日の14時に「チーム定例」をGoogleカレンダーに登録してください', '「Q4タスク管理表」というタイトルでExcelを作成してください', '「MMIオンボーディング手順」のPDFを作成してください', feat.agentStarter1]
    : ['Schedule "MMI Team Sync" on Google Calendar tomorrow at 2pm', 'Generate an Excel spreadsheet titled "Q4 Task Tracker"', 'Create a PDF guide titled "MMI Onboarding Checklist"', 'Gumawa ng iskedyul sa kalendaryo bukas ng 10am para sa Design Review'];

  return (
    <div
      className="opero-view-enter"
      style={{
        height: '100%',
        display: 'flex',
        background: 'transparent',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {historyOpen && (
        <AgentHistorySidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={(id) => {
            playJiggSfx('click', soundEnabled);
            setActiveThreadId(id);
          }}
          onNewChat={() => {
            playJiggSfx('click', soundEnabled);
            setActiveThreadId(null);
          }}
          onDelete={(id) => void handleDeleteThread(id)}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 24px',
          gap: '14px',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <AgentChatHeader
          title={feat.agentTitle}
          uiLocale={uiLocale}
          historyOpen={historyOpen}
          busy={busy}
          startingRuntime={startingRuntime}
          manualOffline={manualOffline}
          isModelLive={isModelLive}
          liveModelLabel={liveModelLabel}
          runtime={runtime}
          autoStartAttemptedKey={autoStartAttemptedKey}
          onOpenHistory={() => setHistoryOpen(true)}
          onStartLocalAi={() => void handleStartLocalAi()}
          onOpenCapabilities={() => setNavMode('settings')}
        />

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
            <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', maxWidth: '540px', textAlign: 'center' }}>
              <PeroAmbientPresence
                state={busy ? 'processing' : 'ready'}
                placement="stage"
                size={136}
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
                      padding: '10px 14px',
                      fontSize: '12.5px',
                      animationDelay: `${idx * 55}ms`,
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
                        maxWidth: '78%',
                        padding: '12px 15px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser ? '#0F172A' : 'var(--bg-surface)',
                        color: isUser ? '#FFFFFF' : 'var(--ink)',
                        border: isUser ? 'none' : '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '9px',
                      }}
                    >
                      {!isUser && m.thinking && <AgentThinkingBlock thinking={m.thinking} />}

                      {isUser ? (
                        <div style={{ fontSize: '13.5px', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                          {m.content}
                        </div>
                      ) : (
                        <AgentMessageContent
                          content={m.content}
                          animateReveal={m.id === animatingMsgId}
                          onRevealDone={() => setAnimatingMsgId((cur) => (cur === m.id ? null : cur))}
                        />
                      )}

                      {!isUser && m.pendingAction && (
                        <AgentActionCard
                          action={m.pendingAction}
                          busy={actionBusyId === m.pendingAction.id}
                          onApprove={(id) => void handleApproveAction(id)}
                          onCancel={(id) => void handleCancelAction(id)}
                        />
                      )}

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
                      background: 'var(--bg-surface)',
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
              background: 'var(--bg-surface)',
              color: 'var(--ink)',
            }}
          />
          <button type="submit" className="opero-btn primary" disabled={busy || !input.trim()}>
            <span>{busy ? '...' : feat.agentSendBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
