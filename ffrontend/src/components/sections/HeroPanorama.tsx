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
      className="flex flex-col lg:flex-row items-center gap-10 lg:gap-12 pt-32 pb-12 lg:py-0 px-5 sm:px-8 lg:pl-0 lg:pr-0 lg:shrink-0"
    >
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[740px] lg:w-[660px] xl:w-[740px] lg:-ml-28 shrink-0 flex flex-col items-center"
      >
        <LaptopFrame activeModule="dashboard" peekOro />
        <span className="opero-hand-cue mt-2.5 text-[16px] text-[#68778B] select-none hidden lg:inline">
          ↖ live Windows desktop preview
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center gap-3.5 w-full max-w-[460px] lg:w-[440px] shrink-0"
      >
        <OroMascot
          motionId="wave-hello"
          size={152}
          interactive
          whispers={HERO_WHISPERS}
        />

        <h1 className="m-0 text-[38px] sm:text-[46px] lg:text-[48px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#172334]">
          Your workflow.
          <br />
          Automatically documented.
        </h1>

        <p className="m-0 text-[15px] text-[#68778B] leading-[1.5]">
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
