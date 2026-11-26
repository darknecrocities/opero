import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { LEGAL_DOCUMENTS, type LegalDocId } from '../../data/legalContent';

export interface LegalModalProps {
  activeDocId: LegalDocId | null;
  onSelectDoc: (id: LegalDocId) => void;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  activeDocId,
  onSelectDoc,
  onClose,
}) => {
  const doc = LEGAL_DOCUMENTS.find((d) => d.id === activeDocId) ?? null;

  useEffect(() => {
    if (!activeDocId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeDocId, onClose]);

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#172334]/35 backdrop-blur-sm p-4 sm:p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[680px] max-h-[84vh] rounded-[24px] bg-white border border-black/[0.06] shadow-[0_24px_64px_-20px_rgba(23,35,52,0.28)] flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 px-6 sm:px-7 pt-6 pb-4 border-b border-[#E1E8F0]">
              <div>
                <h2
                  id="legal-modal-title"
                  className="m-0 text-xl font-extrabold tracking-[-0.025em] text-[#172334]"
                >
                  {doc.title}
                </h2>
                <p className="m-0 mt-1 mono-tabular text-xs text-[#68778B]">{doc.updated}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close legal dialog"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#F4F5F7] text-[#172334] hover:bg-[#EAF3FF] hover:text-[#247BFA] border-0 cursor-pointer shrink-0 transition-colors"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div
              role="tablist"
              aria-label="Legal documents"
              className="flex items-center gap-1.5 px-6 sm:px-7 py-3 bg-[#F4F5F7]/70 border-b border-[#E1E8F0] overflow-x-auto shrink-0"
            >
              {LEGAL_DOCUMENTS.map((item) => {
                const isActive = item.id === doc.id;
                return (
                  <button
                    key={item.id}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => onSelectDoc(item.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#172334] text-white border-[#172334]'
                        : 'bg-white text-[#68778B] border-black/[0.06] hover:text-[#172334]'
                    }`}
                  >
                    {item.tabLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-6 space-y-5 text-left">
              {doc.sections.map((sec) => (
                <div key={sec.heading}>
                  <h3 className="m-0 text-sm font-bold text-[#172334]">{sec.heading}</h3>
                  <p className="m-0 mt-1.5 text-sm leading-[1.65] text-[#68778B] break-words">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
