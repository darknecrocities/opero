import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleSelect = (id: PanoramaAnchorId) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        role="note"
        aria-label="Prototype status notice"
        className="w-full bg-[#172334] text-white/95 text-center px-3 py-1.5 text-[11px] sm:text-[11.5px] font-medium tracking-[0.01em]"
      >
        Prototype – in development · Preview showcase for review only
      </div>

      <div className="nav-glass border-b border-black/[0.04]">
        <div className="mx-auto flex h-14 sm:h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => handleSelect('overview')}
            aria-label="OPERO — Back to start"
            className="inline-flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer min-h-[44px]"
          >
            <OperoLogo variant="mark" size={26} title="OPERO Logo" />
            <span className="opero-appbar-wordmark text-[22px] sm:text-[24px]">
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
              type="button"
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
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileOpen((open) => !open)}
            className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-white/70 border border-black/[0.06] text-[#172334] cursor-pointer"
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
              className="lg:hidden fixed inset-0 top-[92px] bg-[#172334]/20 backdrop-blur-[2px] z-40"
            />
            <motion.nav
              key="nav-drawer"
              id="mobile-nav-drawer"
              aria-label="Mobile sections"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden relative z-50 mx-3 mt-2 rounded-2xl border border-[#E1E8F0] bg-white/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(23,35,52,0.12)] px-4 py-3 flex flex-col gap-1"
            >
              <div className="mono-tabular text-[10px] font-semibold uppercase tracking-[0.08em] text-[#68778B] px-2 pt-1 pb-1.5">
                Quick Sections
              </div>
              {PANORAMA_ANCHORS.map((item) => {
                const isActive = activeAnchor === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`min-h-[44px] px-3 rounded-xl flex items-center justify-between text-left text-sm font-semibold border-0 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#EAF3FF] text-[#247BFA]'
                        : 'bg-transparent text-[#172334] hover:bg-[#F4F5F7]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#247BFA]" aria-hidden="true" />}
                  </button>
                );
              })}

              <div className="pt-2 mt-1 border-t border-[#E1E8F0]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleSelect('download')}
                  className="w-full rounded-full min-h-[44px]"
                >
                  <Download size={14} aria-hidden="true" />
                  <span>Coming Soon</span>
                </Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
