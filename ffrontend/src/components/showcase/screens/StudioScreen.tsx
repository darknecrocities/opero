import React from 'react';
import { Check, Languages } from 'lucide-react';

const OUTLINE_STEPS = [
  { num: '01', title: 'Open Inventory Console', verified: true },
  { num: '02', title: 'Select Add New Item', verified: true },
  { num: '03', title: 'Save & Confirm Record', verified: false },
];

export const StudioScreen: React.FC = () => (
  <div className="grid grid-cols-12 h-full gap-3">
    <div className="col-span-4 border-r border-[#E1E8F0] pr-2.5 flex flex-col justify-between">
      <div>
        <div className="mono-tabular text-[8.5px] uppercase tracking-[0.06em] text-[#68778B] mb-2">
          Manual Outline
        </div>
        <div className="flex flex-col gap-1">
          {OUTLINE_STEPS.map((st, idx) => (
            <div
              key={st.num}
              className={`px-2 py-1.5 rounded text-[9.5px] ${
                idx === 1 ? 'bg-[#EAF3FF] text-[#172334] font-semibold' : 'text-[#68778B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">
                  {st.num}. {st.title}
                </span>
              </div>
              <div
                className={`mono-tabular text-[8px] mt-0.5 ${
                  st.verified ? 'text-[#16865B]' : 'text-[#B7791F]'
                }`}
              >
                {st.verified ? 'verified' : 'needs_review'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[#E1E8F0] flex items-center gap-1.5 text-[9px] text-[#68778B]">
        <Languages size={11} aria-hidden="true" />
        <span className="mono-tabular">en-US · ja-JP</span>
      </div>
    </div>

    <div className="col-span-8 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#E1E8F0] pb-2">
        <div>
          <div className="mono-tabular text-[8.5px] text-[#68778B]">
            STEP 02 · Provenance: evt_002, shot_02
          </div>
          <h3 className="m-0 text-[13px] font-bold text-[#172334]">
            Select Add New Item (Register)
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-white bg-[#16865B] px-2 py-1 rounded">
          <Check size={10} aria-hidden="true" />
          Verified
        </span>
      </div>

      <div className="relative flex-1 my-2 rounded-md border border-[#E1E8F0] bg-[#F7F9FC] p-3 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between gap-3 text-[9px] text-[#68778B] border-b border-[#E1E8F0] pb-1.5">
          <span className="truncate">Inventory Console — Master List</span>
          <span className="mono-tabular shrink-0">Marker · Box · Blur</span>
        </div>

        <div className="relative my-2 flex items-center justify-between px-2">
          <div className="space-y-1.5 w-[55%]">
            <div className="h-2 w-24 bg-[#E1E8F0] rounded" />
            <div className="h-2 w-36 bg-[#E1E8F0] rounded blur-[1.5px]" title="Redacted field" />
            <div className="h-2 w-28 bg-[#E1E8F0] rounded" />
          </div>

          <div className="relative border-2 border-[#247BFA] bg-white px-2.5 py-1.5 rounded">
            <span className="absolute -top-2.5 -left-2.5 w-4 h-4 rounded-full bg-[#247BFA] text-white mono-tabular text-[9px] font-bold flex items-center justify-center">
              2
            </span>
            <span className="text-[9.5px] font-semibold text-[#172334]">Add New Item</span>
          </div>
        </div>

        <p className="m-0 text-[9.5px] text-[#172334] leading-snug border-t border-[#E1E8F0] pt-1.5">
          Click <strong className="font-semibold">Add New Item</strong> in the top action bar to open the registration form. Sensitive account IDs are blurred prior to export.
        </p>
      </div>
    </div>
  </div>
);
