import React, { useEffect, useState } from 'react';
import { TopWindowBar } from './components/TopWindowBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightUtilityRail } from './components/RightUtilityRail';
import { ResizeHandle } from './components/ResizeHandle';
import { PeroCompilingOverlay } from './components/PeroCompilingOverlay';
import { DashboardView } from './features/dashboard/DashboardView';
import { LiveWorkspaceView } from './features/workspace/LiveWorkspaceView';
import { StudioView } from './features/studio/StudioView';
import { TemplatesView } from './features/templates/TemplatesView';
import { DocumentAnalyzerView } from './features/analyzer/DocumentAnalyzerView';
import { MeetingNotesView } from './features/meetings/MeetingNotesView';
import { AgentChatView } from './features/agent/AgentChatView';
import { SettingsView } from './features/settings/SettingsView';
import { WelcomeOnboardingFlow } from './features/onboarding/WelcomeOnboardingFlow';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useOperoStore } from './store/useOperoStore';

const DEFAULT_LEFT = 228;
const DEFAULT_RIGHT = 256;

export const App: React.FC = () => {
  const { navMode, leftOpen, rightOpen, solidFallback, showOnboarding, toastNotice, bootstrap } = useOperoStore();
  useKeyboardShortcuts();

  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem('opero.leftWidth'));
    return Number.isFinite(saved) && saved >= 180 && saved <= 340 ? saved : DEFAULT_LEFT;
  });
  const [rightWidth, setRightWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem('opero.rightWidth'));
    return Number.isFinite(saved) && saved >= 220 && saved <= 380 ? saved : DEFAULT_RIGHT;
  });

  useEffect(() => {
    localStorage.setItem('opero.leftWidth', String(leftWidth));
  }, [leftWidth]);

  useEffect(() => {
    localStorage.setItem('opero.rightWidth', String(rightWidth));
  }, [rightWidth]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const tauriWindow = window as unknown as {
      __TAURI__?: {
        event?: {
          listen?: (name: string, cb: (event: { payload: string }) => void) => Promise<() => void>;
        };
      };
    };

    let unlisten: (() => void) | null = null;
    const listen = tauriWindow.__TAURI__?.event?.listen;
    if (listen) {
      void listen('opero://tray-action', ({ payload }) => {
        const s = useOperoStore.getState();
        if (payload === 'open_dashboard') s.setNavMode('dashboard');
        else if (payload === 'open_templates') s.setNavMode('templates');
        else if (payload === 'open_analyzer') s.setNavMode('analyzer');
        else if (payload === 'open_meetings') s.setNavMode('meetings');
        else if (payload === 'open_agent') s.setNavMode('agent');
        else if (payload === 'open_settings' || payload === 'check_updates') s.setNavMode('settings');
        else if (payload === 'snap_frame') void s.snapWorkflowAction('QuickBar Snap');
        else if (payload === 'toggle_capture') {
          const active = s.sessions.find((sess) => sess.id === s.activeSessionId);
          if (active && (active.status === 'recording' || active.status === 'paused')) {
            void s.pauseOrResumeFlow();
          } else {
            void s.startRecordingFlow(`QuickBar Session ${s.sessions.length + 1}`);
          }
        }
      }).then((fn) => {
        unlisten = fn;
      });
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const bodyClass = [
    'opero-body',
    !leftOpen ? 'left-collapsed' : '',
    !rightOpen ? 'right-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`opero-shell ${solidFallback ? 'solid-fallback' : ''}`}
      style={
        {
          '--left-width': `${leftWidth}px`,
          '--right-width': `${rightWidth}px`,
        } as React.CSSProperties
      }
    >
      {showOnboarding && <WelcomeOnboardingFlow />}
      <PeroCompilingOverlay />
      {toastNotice && (
        <div
          role="status"
          aria-live="polite"
          className="opero-chat-bubble"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '24px',
            zIndex: 85,
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '12.5px',
            fontWeight: 600,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.22)',
            border: '1px solid rgba(105, 188, 252, 0.35)',
          }}
        >
          {toastNotice}
        </div>
      )}
      <TopWindowBar />
      <div className={bodyClass}>
        <LeftSidebar />
        <div className="opero-resize-left">
          <ResizeHandle
            ariaLabel="Resize left navigation sidebar"
            onResizeDelta={(dx) => setLeftWidth((w) => Math.max(180, Math.min(340, w + dx)))}
            onReset={() => setLeftWidth(DEFAULT_LEFT)}
          />
        </div>
        <main id="opero-main-canvas" className="opero-center-stage">
          {navMode === 'dashboard' ? (
            <DashboardView />
          ) : navMode === 'studio' ? (
            <StudioView />
          ) : navMode === 'templates' ? (
            <TemplatesView />
          ) : navMode === 'analyzer' ? (
            <DocumentAnalyzerView />
          ) : navMode === 'meetings' ? (
            <MeetingNotesView />
          ) : navMode === 'agent' ? (
            <AgentChatView />
          ) : navMode === 'settings' ? (
            <SettingsView />
          ) : (
            <LiveWorkspaceView />
          )}
        </main>
        <div className="opero-resize-right">
          <ResizeHandle
            ariaLabel="Resize right utility rail"
            onResizeDelta={(dx) => setRightWidth((w) => Math.max(220, Math.min(380, w - dx)))}
            onReset={() => setRightWidth(DEFAULT_RIGHT)}
          />
        </div>
        <RightUtilityRail />
      </div>
    </div>
  );
};
