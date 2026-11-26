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
      className="px-5 sm:px-8 lg:px-0 py-10 lg:py-0 flex flex-col items-center justify-center gap-5 lg:shrink-0"
    >
      <div className="w-full max-w-[860px] lg:w-[780px] xl:w-[860px]">
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
