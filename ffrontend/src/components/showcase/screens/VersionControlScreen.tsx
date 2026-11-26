import React from 'react';

const REVISIONS = [
  {
    ver: 'v1.4',
    date: '2026-11-24',
    summary: 'Verified Japanese terminology and applied export pixel redaction on Step 02.',
    author: 'Operator',
    state: 'Exported PDF · DOCX',
  },
  {
    ver: 'v1.3',
    date: '2026-11-21',
    summary: 'Updated screenshot bounds after toolbar layout change.',
    author: 'Operator',
    state: 'Verified',
  },
  {
    ver: 'v1.2',
    date: '2026-11-18',
    summary: 'Added Japanese (ja-JP) content variant linked to source events.',
    author: 'Operator',
    state: 'Verified',
  },
];

export const VersionControlScreen: React.FC = () => (
  <div className="flex flex-col h-full justify-between gap-2.5">
    <div className="flex items-end justify-between border-b border-[#E1E8F0] pb-2">
      <div>
        <div className="mono-tabular text-[9px] uppercase tracking-[0.08em] text-[#68778B]">
          Version Control
        </div>
        <h3 className="m-0 mt-0.5 text-[14px] font-bold text-[#172334]">
          Sample Order Entry Procedure — History
        </h3>
      </div>
      <span className="mono-tabular text-[9px] text-[#16865B] font-semibold">Current: v1.4</span>
    </div>

    <div className="flex-1 flex flex-col divide-y divide-[#E1E8F0]">
      {REVISIONS.map((rev, idx) => (
        <div key={rev.ver} className="py-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`mono-tabular text-[10px] font-bold ${
                  idx === 0 ? 'text-[#247BFA]' : 'text-[#172334]'
                }`}
              >
                {rev.ver}
              </span>
              <span className="mono-tabular text-[8.5px] text-[#68778B]">{rev.date}</span>
              <span className="text-[9px] text-[#68778B]">· {rev.author}</span>
            </div>
            <p className="m-0 mt-1 text-[10px] text-[#172334] leading-snug">{rev.summary}</p>
          </div>
          <span className="mono-tabular text-[8.5px] text-[#16865B] font-semibold shrink-0">
            {rev.state}
          </span>
        </div>
      ))}
    </div>
  </div>
);
