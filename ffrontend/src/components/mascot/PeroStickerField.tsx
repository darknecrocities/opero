import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PeroMascot } from '../../assets/mascot';
import {
  PERO_20_STICKER_HINTS,
  type PeroStickerHint,
  type StickerSlot,
} from './peroStickerData';

export interface PeroStickerFieldProps {
  slots: readonly StickerSlot[];
}

function pickRandomDistinct(count: number): PeroStickerHint[] {
  const pool = [...PERO_20_STICKER_HINTS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export const PeroStickerField: React.FC<PeroStickerFieldProps> = ({ slots }) => {
  const reduced = Boolean(useReducedMotion());
  const initialPicks = useMemo(() => pickRandomDistinct(slots.length), [slots.length]);
  const [assigned, setAssigned] = useState<PeroStickerHint[]>(initialPicks);
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  const cycleSticker = (slotIdx: number, slotId: string) => {
    setAssigned((prev) => {
      const current = prev[slotIdx];
      const others = PERO_20_STICKER_HINTS.filter((item) => item.id !== current?.id);
      const next = others[Math.floor(Math.random() * others.length)] ?? PERO_20_STICKER_HINTS[0];
      const copy = [...prev];
      copy[slotIdx] = next;
      return copy;
    });
    setOpenSlot(slotId);
  };

  return (
    <div
      aria-label="Ambient Pero motion stickers"
      data-testid="pero-sticker-field"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {slots.map((slot, idx) => {
        const sticker = assigned[idx] ?? PERO_20_STICKER_HINTS[idx % PERO_20_STICKER_HINTS.length];
        const isOpen = openSlot === slot.id;
        const alignCls =
          slot.hintAlign === 'left'
            ? 'left-0'
            : slot.hintAlign === 'right'
              ? 'right-0'
              : 'left-1/2 -translate-x-1/2';

        return (
          <div key={slot.id} className={`absolute ${slot.className}`}>
            <motion.button
              type="button"
              data-testid={`pero-sticker-${slot.id}`}
              aria-label={`Pero sticker ${sticker.number} ${sticker.label}: ${sticker.hint}. Click to shuffle motion.`}
              onMouseEnter={() => setOpenSlot(slot.id)}
              onMouseLeave={() => setOpenSlot((prev) => (prev === slot.id ? null : prev))}
              onFocus={() => setOpenSlot(slot.id)}
              onBlur={() => setOpenSlot((prev) => (prev === slot.id ? null : prev))}
              onClick={() => cycleSticker(idx, slot.id)}
              animate={
                reduced
                  ? undefined
                  : {
                      rotate: isOpen ? 0 : slot.tilt,
                      scale: isOpen ? 1.14 : 1,
                      y: isOpen ? -4 : 0,
                    }
              }
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              className={`pointer-events-auto pero-sticker-btn relative bg-transparent border-0 p-1 cursor-pointer transition-opacity duration-200 ${
                isOpen ? 'opacity-100 z-20' : 'opacity-45 hover:opacity-100'
              }`}
            >
              <PeroMascot
                motion={sticker.id}
                size={slot.size}
                playing={!reduced && isOpen}
              />
            </motion.button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  role="tooltip"
                  data-testid={`pero-sticker-hint-${slot.id}`}
                  initial={{ opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.94 }}
                  transition={{ duration: 0.16 }}
                  className={`pointer-events-none absolute -top-12 ${alignCls} z-30 max-w-[260px] sm:max-w-none sm:whitespace-nowrap rounded-2xl sm:rounded-full bg-[#172334] text-white px-3 py-1.5 shadow-[0_10px_24px_rgba(23,35,52,0.18)] border border-white/10`}
                >
                  <span className="mono-tabular text-[10px] font-bold text-[#69BCFC] mr-1.5">
                    #{sticker.number}
                  </span>
                  <span className="text-[11px] font-semibold">{sticker.label}</span>
                  <span className="text-[11px] text-white/75"> · {sticker.hint}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
