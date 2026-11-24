import React, { useEffect } from 'react';
import { TopWindowBar } from './components/TopWindowBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightUtilityRail } from './components/RightUtilityRail';
import { LiveWorkspaceView } from './features/workspace/LiveWorkspaceView';
import { StudioView } from './features/studio/StudioView';
import { PermissionsMemoryView } from './features/permissions/PermissionsMemoryView';
import { LibraryAndCompanionView } from './features/library/LibraryAndCompanionView';
import { useOperoStore } from './store/useOperoStore';

export const App: React.FC = () => {
  const { navMode, leftOpen, rightOpen, solidFallback, bootstrap } = useOperoStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const bodyClass = [
    'opero-body',
    !leftOpen ? 'left-collapsed' : '',
    !rightOpen ? 'right-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`opero-shell ${solidFallback ? 'solid-fallback' : ''}`}>
      <TopWindowBar />
      <div className={bodyClass}>
        <LeftSidebar />
        <main id="opero-main-canvas" className="opero-center-stage">
          {navMode === 'studio' ? (
            <StudioView />
          ) : navMode === 'memory' || navMode === 'router' ? (
            <PermissionsMemoryView />
          ) : navMode === 'library' || navMode === 'outputs' ? (
            <LibraryAndCompanionView />
          ) : (
            <LiveWorkspaceView />
          )}
        </main>
        <RightUtilityRail />
      </div>
    </div>
  );
};
