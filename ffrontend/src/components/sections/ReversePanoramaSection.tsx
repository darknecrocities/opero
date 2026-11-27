import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, FileText, Users } from 'lucide-react';
import {
  EXPORT_FORMATS,
  LOCAL_AI_MODES,
  TEAM_USE_CASES,
} from '../../data/showcaseContent';
import { useReverseHorizontalScroll } from '../../hooks/useReverseHorizontalScroll';

export const ReversePanoramaSection: React.FC = () => {
  const { containerRef, trackRef, reverseX, runwayHeight } =
    useReverseHorizontalScroll();

  const panels = (
    <>
      <div className="feature-card p-5 sm:p-8 w-[84vw] max-w-[340px] sm:max-w-[460px] h-[390px] sm:h-[430px] lg:w-[540px] lg:max-w-none flex flex-col justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="mono-tabular text-xs font-semibold text-[#247BFA]">LOCAL AI RUNTIMES</span>
          <Cpu size={18} className="text-[#68778B]" aria-hidden="true" />
        </div>

        <div>
          <h3 className="m-0 text-[26px] font-extrabold tracking-[-0.03em] text-[#172334]">
            Works with or without AI.
          </h3>
          <p className="m-0 mt-1 text-sm text-[#68778B]">
            Capture never breaks if your local model is stopped.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {LOCAL_AI_MODES.map((mode) => (
            <div
              key={mode.name}
              className="rounded-2xl bg-[#F4F5F7] px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#172334]">{mode.name}</div>
                <div className="text-xs text-[#68778B] truncate">{mode.note}</div>
              </div>
              <span className="mono-tabular text-[11px] font-semibold text-[#247BFA] shrink-0">
                {mode.spec}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="feature-card p-5 sm:p-8 w-[84vw] max-w-[340px] sm:max-w-[460px] h-[390px] sm:h-[430px] lg:w-[520px] lg:max-w-none flex flex-col justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="mono-tabular text-xs font-semibold text-[#247BFA]">EVIDENCE ENGINE</span>
          <Database size={18} className="text-[#68778B]" aria-hidden="true" />
        </div>

        <div>
          <h3 className="m-0 text-[26px] font-extrabold tracking-[-0.03em] text-[#172334]">
            Dual-Core SQLite Memory.
          </h3>
          <p className="m-0 mt-1 text-sm text-[#68778B]">
            Every manual step links back to captured screenshots and events.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#F4F5F7] p-4 text-center">
            <div className="mono-tabular text-lg font-extrabold text-[#172334]">&lt; 8 MB</div>
            <div className="text-[11px] text-[#68778B] mt-0.5">Embedded RAM</div>
          </div>
          <div className="rounded-2xl bg-[#F4F5F7] p-4 text-center">
            <div className="mono-tabular text-lg font-extrabold text-[#247BFA]">WAL</div>
            <div className="text-[11px] text-[#68778B] mt-0.5">Local SQLite</div>
          </div>
          <div className="rounded-2xl bg-[#F4F5F7] p-4 text-center">
            <div className="mono-tabular text-lg font-extrabold text-[#172334]">Zero</div>
            <div className="text-[11px] text-[#68778B] mt-0.5">Cloud Daemons</div>
          </div>
        </div>
      </div>

      <div className="feature-card p-5 sm:p-8 w-[84vw] max-w-[340px] sm:max-w-[460px] h-[390px] sm:h-[430px] lg:w-[540px] lg:max-w-none flex flex-col justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="mono-tabular text-xs font-semibold text-[#247BFA]">REAL TEAMS</span>
          <Users size={18} className="text-[#68778B]" aria-hidden="true" />
        </div>

        <div>
          <h3 className="m-0 text-[26px] font-extrabold tracking-[-0.03em] text-[#172334]">
            Built for daily operations.
          </h3>
          <p className="m-0 mt-1 text-sm text-[#68778B]">
            Record once. Keep every shift and office aligned.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {TEAM_USE_CASES.map((item) => (
            <div key={item.team} className="rounded-2xl bg-[#F4F5F7] px-4 py-3">
              <div className="text-sm font-bold text-[#172334]">{item.team}</div>
              <div className="text-xs text-[#68778B] mt-0.5">{item.outcome}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="feature-card p-5 sm:p-8 w-[84vw] max-w-[340px] sm:max-w-[460px] h-[390px] sm:h-[430px] lg:w-[580px] lg:max-w-none flex flex-col justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="mono-tabular text-xs font-semibold text-[#247BFA]">EXPORT DELIVERABLES</span>
          <FileText size={18} className="text-[#68778B]" aria-hidden="true" />
        </div>

        <div>
          <h3 className="m-0 text-[26px] font-extrabold tracking-[-0.03em] text-[#172334]">
            Ship in any format.
          </h3>
          <p className="m-0 mt-1 text-sm text-[#68778B]">
            Export verified manuals with irreversible pixel redactions applied.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {EXPORT_FORMATS.map((fmt) => (
            <div key={fmt.ext} className="rounded-2xl bg-[#F4F5F7] p-4">
              <span className="mono-tabular text-xs font-bold text-[#247BFA]">{fmt.ext}</span>
              <div className="text-sm font-bold text-[#172334] mt-1">{fmt.title}</div>
              <div className="text-xs text-[#68778B] mt-0.5 leading-snug">{fmt.note}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <section id="outputs" aria-label="Deliverables and architecture" className="w-full">
      <div
        ref={containerRef}
        style={{ height: runwayHeight }}
        className="relative w-full"
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden flex flex-col justify-center pt-16 sm:pt-20">
          <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-10 mb-4 sm:mb-5 flex items-end justify-between gap-3">
            <h2 className="m-0 text-[22px] sm:text-[28px] font-extrabold tracking-[-0.03em] text-[#172334]">
              Built for real output.
            </h2>
            <span className="opero-hand-cue text-[15px] sm:text-[18px] text-[#68778B] shrink-0">
              ← gliding left to right
            </span>
          </div>

          <motion.div
            ref={trackRef}
            data-testid="outputs-horizontal-track"
            style={{ x: reverseX }}
            className="flex items-center gap-5 sm:gap-7 px-5 sm:px-12 w-max will-change-transform"
          >
            {panels}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
