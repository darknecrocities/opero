import React from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { Navbar } from './components/navigation/Navbar';
import { ProgressIndicator } from './components/navigation/ProgressIndicator';
import { FeatureCardsStrip } from './components/sections/FeatureCardsStrip';
import { HeroPanorama } from './components/sections/HeroPanorama';
import { PeroStage } from './components/sections/PeroStage';
import { PlayfulPlaygroundSection } from './components/sections/PlayfulPlaygroundSection';
import { ReversePanoramaSection } from './components/sections/ReversePanoramaSection';
import { ShortcutsSection } from './components/sections/ShortcutsSection';
import { TechStackBelt } from './components/sections/TechStackBelt';
import { VerticalDownloadFooter } from './components/sections/VerticalDownloadFooter';
import { VerticalFlowSection } from './components/sections/VerticalFlowSection';
import { WorkspaceStage } from './components/sections/WorkspaceStage';
import { useHorizontalScroll } from './hooks/useHorizontalScroll';

export const App: React.FC = () => {
  const {
    containerRef,
    trackRef,
    isDesktop,
    activeAnchor,
    smoothProgress,
    trackX,
    runwayHeight,
    scrollToAnchor,
  } = useHorizontalScroll();

  const horizontalStages = (
    <>
      <HeroPanorama onNavigate={scrollToAnchor} />
      <FeatureCardsStrip />
      <WorkspaceStage />
      <PeroStage onNavigate={scrollToAnchor} />
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#F4F5F7] text-[#172334]">
        <Navbar activeAnchor={activeAnchor} onNavigate={scrollToAnchor} />
        <ProgressIndicator progress={smoothProgress} />

        <main id="main-story">
          {isDesktop ? (
            <div
              ref={containerRef}
              style={{ height: runwayHeight }}
              className="relative w-full"
            >
              <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center pt-24">
                <motion.div
                  ref={trackRef}
                  style={{ x: trackX }}
                  className="flex items-center gap-14 xl:gap-16 w-max will-change-transform"
                >
                  {horizontalStages}
                </motion.div>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className="flex flex-col w-full">
              {horizontalStages}
            </div>
          )}

          <div className="relative z-10 bg-[#F4F5F7]">
            <VerticalFlowSection />
            <TechStackBelt />
            <PlayfulPlaygroundSection />
            <ShortcutsSection />
            <ReversePanoramaSection />
            <VerticalDownloadFooter onNavigate={scrollToAnchor} />
          </div>
        </main>
      </div>
    </MotionConfig>
  );
};

export default App;
