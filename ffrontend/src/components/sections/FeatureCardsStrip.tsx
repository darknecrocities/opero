import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FEATURE_CARDS } from '../../data/showcaseContent';
import { FeatureMotionIcon } from '../icons/FeatureMotionIcon';

export const FeatureCardsStrip: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tappedId, setTappedId] = useState<string | null>(null);

  return (
    <section
      id="features"
      aria-label="OPERO Features"
      className="py-6 lg:py-0 lg:shrink-0 w-full lg:w-auto"
    >
      <div className="flex items-center justify-between px-5 sm:px-8 mb-3 lg:hidden">
        <span className="mono-tabular text-[11px] font-semibold uppercase tracking-[0.06em] text-[#68778B]">
          Core Capabilities
        </span>
        <span className="opero-hand-cue text-[16px] text-[#247BFA]">
          swipe to explore →
        </span>
      </div>

      <div
        data-testid="features-horizontal-track"
        className="flex lg:grid lg:grid-rows-2 lg:grid-flow-col gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none no-scrollbar px-5 sm:px-8 lg:px-0 pb-3 lg:pb-0"
      >
        {FEATURE_CARDS.map((item) => {
          const isMorphed = hoveredId === item.id || tappedId === item.id;
          return (
            <motion.article
              key={item.id}
              tabIndex={0}
              data-morphed={isMorphed ? 'true' : 'false'}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
              onFocus={() => setHoveredId(item.id)}
              onBlur={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
              onClick={() => setTappedId((prev) => (prev === item.id ? null : item.id))}
              animate={{
                borderRadius: isMorphed ? 30 : 24,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="feature-card flex flex-col items-center justify-center text-center px-6 py-7 w-[78vw] max-w-[300px] sm:w-[292px] lg:w-[292px] lg:h-[262px] shrink-0 snap-center cursor-pointer select-none"
            >
              <div className="flex items-center justify-center h-[96px] mb-4">
                <FeatureMotionIcon id={item.id} morphed={isMorphed} size="lg" />
              </div>
              <h2 className="m-0 text-[16px] font-bold tracking-[-0.015em] text-[#172334]">
                {item.title}
              </h2>
              <p className="m-0 mt-1.5 text-[13px] leading-[1.45] text-[#68778B] max-w-[24ch]">
                {item.description}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};
