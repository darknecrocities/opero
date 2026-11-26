import React from 'react';
import { Camera, Pause, Square } from 'lucide-react';

const CAPTURED_EVENTS = [
  { seq: '01', time: '00:00:04', action: 'Focus window: Inventory Management Console', ref: 'evt_001' },
  { seq: '02', time: '00:00:11', action: 'Click button: Add New Item (Register)', ref: 'evt_002' },
  { seq: '03', time: '00:00:19', action: 'Snap frame: SKU Form Validation Bounds', ref: 'evt_003' },
  { seq: '04', time: '00:00:27', action: 'Click button: Save Record & Confirm', ref: 'evt_004' },
];

export const CaptureCenterScreen: React.FC = () => (
  <div className="flex flex-col h-full justify-between gap-3">
    <div className="flex items-center justify-between border-b border-[#E1E8F0] pb-2.5">
      <div>
        <div className="mono-tabular text-[9px] uppercase tracking-[0.08em] text-[#C43D4B] font-semibold">
          Explicit Capture Active · 00:00:32
        </div>
        <h3 className="m-0 mt-0.5 text-[14px] font-bold text-[#172334]">
          Sample Order Entry Procedure
        </h3>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-[#172334] border border-[#E1E8F0] px-2 py-1 rounded">
          <Camera size={10} aria-hidden="true" />
          Snap
        </span>
        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-[#172334] border border-[#E1E8F0] px-2 py-1 rounded">
          <Pause size={10} aria-hidden="true" />
          Pause
        </span>
        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-white bg-[#172334] px-2 py-1 rounded">
          <Square size={9} aria-hidden="true" />
          Stop
        </span>
      </div>
    </div>

    <div className="py-1.5 border-b border-[#E1E8F0]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="mono-tabular text-[9px] uppercase tracking-[0.06em] text-[#68778B]">
          Impulse Scrubber
        </span>
        <span className="mono-tabular text-[9px] text-[#68778B]">4 evidence frames</span>
      </div>
      <div className="relative h-6 flex items-center gap-2">
        <div className="absolute left-0 right-0 h-[1px] bg-[#E1E8F0]" />
        {[14, 34, 62, 86].map((pct, i) => (
          <div
            key={pct}
            style={{ left: `${pct}%` }}
            className={`absolute -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white ${
              i === 3 ? 'bg-[#247BFA]' : 'bg-[#172334]'
            }`}
          />
        ))}
      </div>
    </div>

    <div className="flex-1 flex flex-col divide-y divide-[#E1E8F0]">
      {CAPTURED_EVENTS.map((ev) => (
        <div key={ev.ref} className="py-1.5 flex items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="mono-tabular text-[9px] font-semibold text-[#247BFA]">{ev.seq}</span>
            <span className="text-[#172334] font-medium truncate">{ev.action}</span>
          </div>
          <span className="mono-tabular text-[8.5px] text-[#68778B] shrink-0">
            {ev.time} · {ev.ref}
          </span>
        </div>
      ))}
    </div>
  </div>
);
