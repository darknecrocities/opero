import React from 'react';
import { motion } from 'framer-motion';
import {
  DOWNLOAD_ARTIFACTS,
  DOWNLOADS_ENABLED,
  HERO_WHISPERS,
} from '../../data/showcaseContent';
import type { PanoramaAnchorId } from '../../types/showcase';
import { OroMascot } from '../mascot/OroMascot';
import { LaptopFrame } from '../showcase/LaptopFrame';
import { Button } from '../ui/Button';
import { PlatformIcon } from '../ui/PlatformIcon';

export interface HeroPanoramaProps {
  onNavigate: (id: PanoramaAnchorId) => void;
}

export const HeroPanorama: React.FC<HeroPanoramaProps> = ({ onNavigate }) => {
  const windows = DOWNLOAD_ARTIFACTS[0];
  const macos = DOWNLOAD_ARTIFACTS[1];

  return (
    <section
      id="overview"
      aria-label="OPERO Overview"
      className="flex flex-row items-center gap-8 sm:gap-10 lg:gap-12 pl-5 sm:pl-8 lg:pl-0 pr-2 lg:pr-0 shrink-0"
    >
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="order-2 lg:order-1 w-[86vw] max-w-[350px] sm:max-w-[520px] lg:w-[660px] lg:max-w-none xl:w-[740px] lg:-ml-28 shrink-0 flex flex-col items-center"
      >
        <LaptopFrame activeModule="dashboard" peekOro />
        <span className="opero-hand-cue mt-2 text-[14px] sm:text-[16px] text-[#68778B] select-none">
          ↖ live Windows desktop preview
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="order-1 lg:order-2 flex flex-col items-center text-center gap-2.5 sm:gap-3.5 w-[88vw] max-w-[345px] sm:max-w-[440px] lg:w-[440px] shrink-0"
      >
        <OroMascot
          motionId="wave-hello"
          size={128}
          interactive
          whispers={HERO_WHISPERS}
        />

        <h1 className="m-0 text-[30px] sm:text-[42px] lg:text-[48px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#172334]">
          Your workflow.
          <br />
          Automatically documented.
        </h1>

        <p className="m-0 text-[13.5px] sm:text-[15px] text-[#68778B] leading-[1.45]">
          Local-first desktop documentation for Windows.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {DOWNLOADS_ENABLED ? (
            <Button
              type="button"
              variant="secondary"
              href={windows.downloadUrl}
              download={windows.fileName}
              className="rounded-full px-6"
            >
              <PlatformIcon platform="windows" size={15} />
              <span>Download for Windows</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled
              aria-disabled="true"
              className="rounded-full px-6 opacity-60 cursor-not-allowed hover:bg-[#172334]"
            >
              <PlatformIcon platform="windows" size={15} />
              <span>Windows · Coming Soon</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            disabled
            aria-disabled="true"
            className="rounded-full px-5 bg-white/75 border-black/[0.06] opacity-60 cursor-not-allowed hover:bg-white/75"
          >
            <PlatformIcon platform={macos.platform} size={14} />
            <span>macOS · Coming later</span>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('features')}
          className="inline-flex items-center gap-1.5 mt-1 text-xs text-[#68778B] hover:text-[#172334] bg-transparent border-0 p-1 cursor-pointer"
        >
          <span className="mono-tabular">Coming soon · Scroll to explore →</span>
        </button>
      </motion.div>
    </section>
  );
};
