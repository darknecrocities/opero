import React, { useState } from 'react';
import { Download, Menu, X } from 'lucide-react';
import { OperoLogo } from '../../assets/mascot';
import { PANORAMA_ANCHORS } from '../../data/showcaseContent';
import type { PanoramaAnchorId } from '../../types/showcase';
import { Button } from '../ui/Button';

export interface NavbarProps {
  activeAnchor: PanoramaAnchorId;
  onNavigate: (id: PanoramaAnchorId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeAnchor, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (id: PanoramaAnchorId) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        role="note"
        aria-label="Prototype status notice"
        className="w-full bg-[#172334] text-white/95 text-center px-4 py-1.5 text-[11.5px] font-medium tracking-[0.01em]"
      >
        Prototype – in development · Preview showcase for review only
      </div>

      <div className="nav-glass">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => handleSelect('overview')}
          aria-label="OPERO — Back to start"
          className="inline-flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer min-h-[44px]"
        >
          <OperoLogo variant="mark" size={26} title="OPERO Logo" />
          <span className="opero-appbar-wordmark text-[24px]">
            Opero<span className="text-[#68778B]">.</span>
          </span>
        </button>

        <nav aria-label="Primary sections" className="hidden lg:flex items-center gap-7">
          {PANORAMA_ANCHORS.map((item) => {
            const isActive = activeAnchor === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`py-2 text-sm font-medium bg-transparent border-0 cursor-pointer transition-colors ${
                  isActive ? 'text-[#172334]' : 'text-[#68778B] hover:text-[#172334]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center">
          <Button
            variant="secondary"
            onClick={() => handleSelect('download')}
            className="rounded-full min-h-[40px] px-5"
          >
            <Download size={14} aria-hidden="true" />
            <span>Coming Soon</span>
          </Button>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] bg-transparent border-0 text-[#172334] cursor-pointer"
        >
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile sections"
          className="lg:hidden border-t border-[#E1E8F0] bg-[#F4F5F7] px-5 py-3 flex flex-col gap-1"
        >
          {PANORAMA_ANCHORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`min-h-[44px] px-2 text-left text-sm font-medium bg-transparent border-0 cursor-pointer ${
                activeAnchor === item.id ? 'text-[#247BFA]' : 'text-[#172334]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};
