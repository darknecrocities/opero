import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { OperoLogo } from '../../assets/mascot';
import {
  DOWNLOAD_ARTIFACTS,
  DOWNLOADS_ENABLED,
} from '../../data/showcaseContent';
import type { PanoramaAnchorId } from '../../types/showcase';
import { OroMascot } from '../mascot/OroMascot';
import { SiteFooter } from '../navigation/SiteFooter';
import { Button } from '../ui/Button';
import { PlatformIcon } from '../ui/PlatformIcon';

export interface VerticalDownloadFooterProps {
  onNavigate: (id: PanoramaAnchorId) => void;
}

export const VerticalDownloadFooter: React.FC<VerticalDownloadFooterProps> = ({
  onNavigate,
}) => (
  <section
    id="download"
    aria-label="OPERO Desktop Availability"
    className="mx-auto w-full max-w-[1040px] px-5 sm:px-8 lg:px-10 pt-14 pb-16"
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center gap-4 mb-10"
    >
      <OroMascot
        motionId="verified-celebrate"
        size={168}
        interactive
        cueText="ready when you are!"
      />

      <div className="flex items-center gap-2">
        <OperoLogo variant="mark" size={26} title="OPERO Logo" />
        <span className="opero-appbar-wordmark text-[26px]">
          Opero<span className="text-[#68778B]">.</span>
        </span>
      </div>

      <h2 className="m-0 text-[34px] sm:text-[46px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#172334]">
        Make documentation effortless.
      </h2>
      <p className="m-0 text-[15px] text-[#68778B]">
        OPERO for Windows is coming soon. macOS support is planned for a later release.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {DOWNLOAD_ARTIFACTS.map((artifact) => {
        const isWindows = artifact.platform === 'windows';

        return (
          <div
            key={artifact.platform}
            className={`feature-card p-7 flex flex-col gap-5 ${
              isWindows ? '' : 'opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={artifact.platform} size={22} className="text-[#172334]" />
                <div>
                  <h3 className="m-0 text-lg font-bold text-[#172334]">{artifact.name}</h3>
                  <p className="m-0 text-xs text-[#68778B]">{artifact.architecture}</p>
                </div>
              </div>
              <span className="mono-tabular text-xs font-semibold text-[#247BFA]">
                {artifact.sizeLabel}
              </span>
            </div>

            {DOWNLOADS_ENABLED && isWindows ? (
              <Button
                type="button"
                variant="primary"
                href={artifact.downloadUrl}
                download={artifact.fileName}
                className="w-full rounded-full"
              >
                <Download size={15} aria-hidden="true" />
                <span>Download for Windows</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant={isWindows ? 'secondary' : 'ghost'}
                disabled
                aria-disabled="true"
                className="w-full rounded-full opacity-60 cursor-not-allowed"
              >
                <PlatformIcon platform={artifact.platform} size={15} />
                <span>{isWindows ? 'Windows · Coming Soon' : 'macOS · Coming Later'}</span>
              </Button>
            )}

            <div className="flex items-center justify-between text-xs text-[#68778B]">
              <span>{artifact.requirement}</span>
              <span className="mono-tabular">{artifact.version}</span>
            </div>
          </div>
        );
      })}
    </div>

    <SiteFooter onNavigate={onNavigate} />
  </section>
);
