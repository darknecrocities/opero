import React from 'react';
import { TECH_STACK_ITEMS } from '../../data/showcaseContent';
import { TechStackLogo } from '../icons/TechStackLogos';

export const TechStackBelt: React.FC = () => {
  const repeated = [...TECH_STACK_ITEMS, ...TECH_STACK_ITEMS];

  return (
    <section
      aria-label="OPERO technology stack"
      className="w-full py-10 overflow-hidden"
    >
      <p className="m-0 mb-5 text-center mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#68778B]">
        Built with open, local-first technology
      </p>

      <div className="tech-belt-mask mx-auto max-w-[1360px] overflow-hidden py-2">
        <div className="tech-belt-track flex items-center gap-4">
          {repeated.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              aria-hidden={idx >= TECH_STACK_ITEMS.length}
              className="group flex items-center gap-3 px-5 py-3 rounded-full bg-white border border-black/[0.045] shadow-[0_2px_10px_rgba(23,35,52,0.025)] text-[#68778B] hover:text-[#172334] transition-colors shrink-0"
            >
              <TechStackLogo id={item.id} size={20} />
              <span className="text-sm font-bold tracking-[-0.015em] text-[#172334]">
                {item.name}
              </span>
              <span className="mono-tabular text-[11px] text-[#68778B]">
                {item.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
