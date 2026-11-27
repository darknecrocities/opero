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
      className="shrink-0"
    >
      <div
        data-testid="features-horizontal-track"
        className="grid grid-rows-2 grid-flow-col gap-3 sm:gap-4 lg:gap-5"
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
              className="feature-card flex flex-col items-center justify-center text-center px-4 py-4 sm:px-6 sm:py-6 w-[236px] h-[206px] sm:w-[272px] sm:h-[238px] lg:w-[292px] lg:h-[262px] shrink-0 cursor-pointer select-none"
            >
              <div className="flex items-center justify-center h-[82px] sm:h-[96px] mb-2 sm:mb-4">
                <FeatureMotionIcon id={item.id} morphed={isMorphed} size="lg" />
              </div>
              <h2 className="m-0 text-[14.5px] sm:text-[16px] font-bold tracking-[-0.015em] text-[#172334]">
                {item.title}
              </h2>
              <p className="m-0 mt-1 text-[12px] sm:text-[13px] leading-[1.4] text-[#68778B] max-w-[24ch]">
                {item.description}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};
