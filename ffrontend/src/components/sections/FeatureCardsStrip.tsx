import React from 'react';
import { FEATURE_CARDS } from '../../data/showcaseContent';
import { FeatureMotionIcon } from '../icons/FeatureMotionIcon';

export const FeatureCardsStrip: React.FC = () => (
  <section
    id="features"
    aria-label="OPERO Features"
    className="px-5 sm:px-8 lg:px-0 py-8 lg:py-0 lg:shrink-0"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-2 lg:grid-flow-col gap-4 lg:gap-5">
      {FEATURE_CARDS.map((item) => (
        <article
          key={item.id}
          className="feature-card flex flex-col items-center justify-center text-center px-6 py-7 lg:w-[272px] lg:h-[234px]"
        >
          <div className="flex items-center justify-center h-[72px] mb-4">
            <FeatureMotionIcon id={item.id} />
          </div>
          <h2 className="m-0 text-[15px] font-bold tracking-[-0.015em] text-[#172334]">
            {item.title}
          </h2>
          <p className="m-0 mt-1.5 text-[13px] leading-[1.45] text-[#68778B] max-w-[24ch]">
            {item.description}
          </p>
        </article>
      ))}
    </div>
  </section>
);
