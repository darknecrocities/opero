import React from 'react';
import { motion } from 'framer-motion';
import type { ProductModuleId } from '../../types/showcase';
import { OroPeekingEyes } from '../mascot/OroPeekingEyes';
import { LaptopScreen } from './LaptopScreen';

export interface LaptopFrameProps {
  activeModule: ProductModuleId;
  onSelectModule?: (module: ProductModuleId) => void;
  interactive?: boolean;
  peekOro?: boolean;
  scale?: number;
  className?: string;
}

export const LaptopFrame: React.FC<LaptopFrameProps> = ({
  activeModule,
  onSelectModule,
  interactive = false,
  peekOro = false,
  scale = 1,
  className = '',
}) => (
  <motion.div
    animate={{ scale }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={`relative w-full max-w-[920px] select-none ${peekOro ? 'pt-[72px] sm:pt-[86px]' : ''} ${className}`.trim()}
  >
    {peekOro && (
      <div className="absolute right-[9%] top-[2px] sm:top-[0px] z-0">
        <OroPeekingEyes size={126} className="sm:scale-110 origin-bottom" />
      </div>
    )}

    <div className="relative z-10 mx-auto w-[92%] rounded-t-[20px] bg-[#172334] p-[10px] pb-[12px] shadow-[0_30px_70px_-24px_rgba(23,35,52,0.28),0_10px_24px_-12px_rgba(23,35,52,0.16)] border border-[#2C3A4E]">
      <div
        aria-hidden="true"
        className="absolute top-[10px] left-1/2 -translate-x-1/2 z-20 h-[14px] w-[88px] rounded-b-[9px] bg-[#172334] flex items-center justify-center"
      >
        <span className="w-[5px] h-[5px] rounded-full bg-[#334155]" />
      </div>

      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[10px] bg-white border border-black/10">
        <LaptopScreen
          activeModule={activeModule}
          onSelectModule={onSelectModule}
          interactive={interactive}
        />
      </div>
    </div>

    <div className="relative mx-auto w-full h-[14px] rounded-b-[14px] bg-gradient-to-b from-[#E5EAF1] via-[#D6DEE8] to-[#BDC8D6] shadow-[0_14px_28px_-14px_rgba(23,35,52,0.32)] border-t border-white/80">
      <div
        aria-hidden="true"
        className="mx-auto w-[104px] h-[5px] rounded-b-[5px] bg-[#B4C0CF]"
      />
    </div>
  </motion.div>
);
