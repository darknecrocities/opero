import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { TRILINGUAL_SAMPLES } from '../../data/showcaseContent';
import { OroMascot } from '../mascot/OroMascot';

export const PlayfulPlaygroundSection: React.FC = () => {
  const [langIdx, setLangIdx] = useState(0);
  const [redacted, setRedacted] = useState(true);
  const sample = TRILINGUAL_SAMPLES[langIdx] ?? TRILINGUAL_SAMPLES[0];

  return (
    <section
      aria-label="Interactive playgrounds"
      className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10 py-14"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="feature-card p-7 sm:p-9 flex flex-col justify-between gap-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-[22px] font-extrabold text-[#172334]">
                English &amp; Japanese. Filipino soon.
              </h3>
              <p className="m-0 mt-1 text-sm text-[#68778B]">
                Supports English and Japanese; Filipino is coming soon.
              </p>
            </div>

            <div role="tablist" aria-label="Language preview" className="flex items-center gap-1.5">
              {TRILINGUAL_SAMPLES.map((item, idx) => (
                <button
                  key={item.code}
                  role="tab"
                  type="button"
                  aria-selected={idx === langIdx}
                  onClick={() => setLangIdx(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    idx === langIdx
                      ? 'bg-[#172334] text-white border-[#172334]'
                      : 'bg-[#F4F5F7] text-[#68778B] border-transparent hover:text-[#172334]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#F4F5F7] p-5 min-h-[126px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={sample.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mono-tabular text-[11px] text-[#247BFA] font-semibold">
                  STEP 02 · {sample.code}
                </div>
                <div className="mt-1 text-base font-bold text-[#172334]">{sample.heading}</div>
                <p className="m-0 mt-1 text-sm text-[#68778B] leading-[1.55]">{sample.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="feature-card p-7 sm:p-9 flex flex-col justify-between gap-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-[22px] font-extrabold text-[#172334]">
                Blur before you export.
              </h3>
              <p className="m-0 mt-1 text-sm text-[#68778B]">
                Sensitive fields stay redacted locally on your device.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRedacted((r) => !r)}
              aria-pressed={redacted}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#F4F5F7] text-[#172334] hover:bg-[#EAF3FF] hover:text-[#247BFA] border-0 cursor-pointer transition-colors"
            >
              {redacted ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              <span>{redacted ? 'Redacted' : 'Reveal'}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#F4F5F7] p-5 flex items-center justify-between gap-4">
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#68778B]">Workspace</span>
                <span className="font-semibold text-[#172334]">Sample Workspace</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#68778B]">Account ID</span>
                <span
                  className={`mono-tabular font-semibold text-[#172334] transition-all duration-200 ${
                    redacted ? 'blur-[5px] select-none' : 'blur-0'
                  }`}
                >
                  ACC-8841-9024
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#68778B]">Operator Email</span>
                <span
                  className={`mono-tabular font-semibold text-[#172334] transition-all duration-200 ${
                    redacted ? 'blur-[5px] select-none' : 'blur-0'
                  }`}
                >
                  ops@company.local
                </span>
              </div>
            </div>

            <OroMascot
              motionId={redacted ? 'privacy-shield' : 'monocle-inspect'}
              size={84}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
