import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SHORTCUT_KEYS } from '../../data/showcaseContent';
import { OroMascot } from '../mascot/OroMascot';

export const ShortcutsSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = SHORTCUT_KEYS[activeIdx] ?? SHORTCUT_KEYS[0];

  return (
    <section
      aria-label="Keyboard shortcuts"
      className="mx-auto w-full max-w-[1000px] px-4 sm:px-8 lg:px-10 py-10 sm:py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="feature-card p-8 sm:p-10 flex flex-col items-center text-center gap-6"
      >
        <div>
          <h2 className="m-0 text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] text-[#172334]">
            Feels native to your hands.
          </h2>
          <p className="m-0 mt-1.5 text-sm text-[#68778B]">
            Press a Windows keycap to see Pero react.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {SHORTCUT_KEYS.map((item, idx) => {
            const isSelected = idx === activeIdx;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ y: 3, scale: 0.97 }}
                onClick={() => setActiveIdx(idx)}
                className={`flex flex-col items-center gap-2 px-5 py-3.5 rounded-2xl border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#EAF3FF] border-[#247BFA]/40 shadow-[0_3px_0_#247BFA]'
                    : 'bg-[#F4F5F7] border-black/[0.06] shadow-[0_3px_0_#D8DFE8] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.keys.map((k) => (
                    <kbd
                      key={k}
                      className="mono-tabular px-2 py-0.5 rounded-md bg-white text-xs font-bold text-[#172334] border border-black/[0.08]"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
                <span className="text-xs font-semibold text-[#172334]">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <OroMascot motionId={current.reaction} size={74} />
          <span className="opero-hand-cue text-[20px] text-[#247BFA]">{current.whisper}</span>
        </div>
      </motion.div>
    </section>
  );
};
