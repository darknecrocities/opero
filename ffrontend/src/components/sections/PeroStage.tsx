import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { ORO_MOTION_SAMPLES } from '../../data/showcaseContent';
import type { PanoramaAnchorId } from '../../types/showcase';
import { OroMascot } from '../mascot/OroMascot';

export interface PeroStageProps {
  onNavigate: (id: PanoramaAnchorId) => void;
}

export const PeroStage: React.FC<PeroStageProps> = ({ onNavigate }) => {
  const [peroIdx, setPeroIdx] = useState(0);
  const current = ORO_MOTION_SAMPLES[peroIdx] ?? ORO_MOTION_SAMPLES[0];

  return (
    <section
      id="meet-pero"
      aria-label="Meet Pero"
      className="pr-8 sm:pr-14 lg:pr-20 flex flex-row items-center gap-6 sm:gap-10 lg:gap-12 shrink-0"
    >
      <div className="feature-card flex flex-col items-center justify-between text-center px-5 py-6 sm:px-7 sm:py-8 w-[275px] h-[410px] sm:w-[310px] sm:h-[490px] shrink-0">
        <div className="flex flex-col items-center">
          <span className="opero-appbar-wordmark text-[18px]">
            Meet Pero<span className="text-[#247BFA]">.</span>
          </span>
          <motion.span
            key={current.whisper}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="opero-hand-cue mt-1 text-[18px] text-[#247BFA]"
          >
            {current.whisper}
          </motion.span>
        </div>

        <OroMascot
          motionId={current.id}
          size={196}
          interactive
          cueText="tap Pero to say hi"
        />

        <div
          role="tablist"
          aria-label="Pero expressions"
          className="w-full grid grid-cols-3 gap-1.5 pt-2"
        >
          {ORO_MOTION_SAMPLES.map((sample, idx) => {
            const active = idx === peroIdx;
            return (
              <button
                key={sample.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setPeroIdx(idx)}
                className={`py-2 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#247BFA] text-white border-[#247BFA]'
                    : 'bg-[#F4F5F7] text-[#68778B] border-transparent hover:text-[#172334]'
                }`}
              >
                {sample.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-3 max-w-[240px]">
        <h2 className="m-0 text-[26px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#172334]">
          Keep scrolling.
          <br />
          There’s more below.
        </h2>
        <p className="m-0 text-sm text-[#68778B] leading-[1.5]">
          Try multilingual steps, local blur, and Windows shortcuts.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('flow')}
          className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-full bg-white text-xs font-semibold text-[#172334] border border-black/[0.06] shadow-[0_2px_10px_rgba(23,35,52,0.04)] hover:text-[#247BFA] cursor-pointer"
        >
          <span>Continue down</span>
          <ArrowDown size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
