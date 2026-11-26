import React, { useState } from 'react';
import { ArrowUp, ExternalLink } from 'lucide-react';
import { OperoLogo } from '../../assets/mascot';
import type { LegalDocId } from '../../data/legalContent';
import {
  DOWNLOAD_ARTIFACTS,
  PANORAMA_ANCHORS,
  RELEASE_LABEL,
} from '../../data/showcaseContent';
import type { PanoramaAnchorId } from '../../types/showcase';
import { LegalModal } from '../ui/LegalModal';

export interface SiteFooterProps {
  onNavigate: (id: PanoramaAnchorId) => void;
}

const LEGAL_LINKS: readonly { id: LegalDocId; label: string }[] = [
  { id: 'terms', label: 'Terms & Conditions' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'security', label: 'Local-First & Security' },
  { id: 'license', label: 'MIT License & Notices' },
];

export const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate }) => {
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocId | null>(null);

  return (
    <>
      <footer
        aria-label="OPERO Footer"
        className="mt-16 pt-12 border-t border-[#E1E8F0] text-left"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12">
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <OperoLogo variant="mark" size={24} title="OPERO Logo" />
              <span className="opero-appbar-wordmark text-[22px]">
                Opero<span className="text-[#68778B]">.</span>
              </span>
            </div>
            <p className="m-0 text-sm text-[#68778B] leading-[1.6] max-w-[30ch]">
              Your workflow. Automatically documented. Local-first desktop documentation for Windows.
            </p>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-2.5">
            <h3 className="m-0 mono-tabular text-[11px] uppercase tracking-[0.12em] text-[#68778B]">
              Product
            </h3>
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {PANORAMA_ANCHORS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className="text-sm text-[#172334]/85 hover:text-[#247BFA] bg-transparent border-0 p-0 cursor-pointer transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-2.5">
            <h3 className="m-0 mono-tabular text-[11px] uppercase tracking-[0.12em] text-[#68778B]">
              Desktop Releases
            </h3>
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {DOWNLOAD_ARTIFACTS.map((artifact) => (
                <li key={artifact.platform}>
                  <span className="text-sm text-[#68778B]">
                    {artifact.name} — {artifact.sizeLabel}
                  </span>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalDoc('releases')}
                  className="text-sm text-[#172334]/85 hover:text-[#247BFA] bg-transparent border-0 p-0 cursor-pointer transition-colors"
                >
                  {RELEASE_LABEL} Roadmap
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/darknecrocities/opero"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#172334]/85 hover:text-[#247BFA] no-underline transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-2.5">
            <h3 className="m-0 mono-tabular text-[11px] uppercase tracking-[0.12em] text-[#68778B]">
              Legal &amp; Privacy
            </h3>
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc(link.id)}
                    className="text-sm text-[#172334]/85 hover:text-[#247BFA] bg-transparent border-0 p-0 cursor-pointer transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E1E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#68778B]">
          <div className="text-center sm:text-left">
            © 2026 OPERO · Arron Kian Parejas · MIT License
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setActiveLegalDoc('terms')}
              className="text-xs text-[#68778B] hover:text-[#172334] bg-transparent border-0 p-0 cursor-pointer"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('privacy')}
              className="text-xs text-[#68778B] hover:text-[#172334] bg-transparent border-0 p-0 cursor-pointer"
            >
              Privacy
            </button>
            <span className="mono-tabular text-[#68778B]">EN · JA (FIL soon)</span>
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#172334] hover:text-[#247BFA] bg-transparent border-0 p-0 cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>

      <LegalModal
        activeDocId={activeLegalDoc}
        onSelectDoc={setActiveLegalDoc}
        onClose={() => setActiveLegalDoc(null)}
      />
    </>
  );
};
