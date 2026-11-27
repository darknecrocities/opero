import React, { useState } from 'react';
import { PRODUCT_MODULES } from '../../data/showcaseContent';
import type { ProductModuleId } from '../../types/showcase';
import { LaptopFrame } from '../showcase/LaptopFrame';

export const WorkspaceStage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ProductModuleId>('studio');

  return (
    <section
      id="workspace"
      aria-label="OPERO Workspace"
      className="flex flex-col items-center justify-center gap-3 sm:gap-5 shrink-0"
    >
      <div className="w-[88vw] max-w-[350px] sm:max-w-[600px] lg:w-[780px] lg:max-w-none xl:w-[860px]">
        <LaptopFrame
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          interactive
          peekOro
        />
      </div>

      <div
        role="tablist"
        aria-label="OPERO application modules"
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
      >
        {PRODUCT_MODULES.map((mod) => {
          const isActive = mod.id === activeModule;
          return (
            <button
              key={mod.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveModule(mod.id)}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#172334] text-white border-[#172334]'
                  : 'bg-white text-[#68778B] border-black/[0.06] hover:text-[#172334]'
              }`}
            >
              {mod.name}
            </button>
          );
        })}
      </div>
    </section>
  );
};
