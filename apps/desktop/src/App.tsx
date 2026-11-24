import React, { useEffect } from 'react';
import { TopWindowBar } from './components/TopWindowBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightUtilityRail } from './components/RightUtilityRail';
import { DashboardView } from './features/dashboard/DashboardView';
import { LiveWorkspaceView } from './features/workspace/LiveWorkspaceView';
import { StudioView } from './features/studio/StudioView';
import { TemplatesView } from './features/templates/TemplatesView';
import { DocumentAnalyzerView } from './features/analyzer/DocumentAnalyzerView';
import { SettingsView } from './features/settings/SettingsView';
import { WelcomeOnboardingFlow } from './features/onboarding/WelcomeOnboardingFlow';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useOperoStore } from './store/useOperoStore';

export const App: React.FC = () => {
  const { navMode, leftOpen, rightOpen, solidFallback, showOnboarding, bootstrap } = useOperoStore();
  useKeyboardShortcuts();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const tauriWindow = window as unknown as {
      __TAURI_INTERNALS__?: {
        invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      };
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
    <div className={`opero-shell ${solidFallback ? 'solid-fallback' : ''}`}>
      {showOnboarding && <WelcomeOnboardingFlow />}
      <TopWindowBar />
      <div className={bodyClass}>
        <LeftSidebar />
        <main id="opero-main-canvas" className="opero-center-stage">
          {navMode === 'dashboard' ? (
            <DashboardView />
          ) : navMode === 'studio' ? (
            <StudioView />
          ) : navMode === 'templates' ? (
            <TemplatesView />
          ) : navMode === 'analyzer' ? (
            <DocumentAnalyzerView />
          ) : navMode === 'settings' ? (
            <SettingsView />
          ) : (
            <LiveWorkspaceView />
          )}
        </main>
        <RightUtilityRail />
      </div>
    </div>
  );
};
