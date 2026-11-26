import React from 'react';

const WEEKLY_BARS = [
  { day: 'Mon', height: 42 },
  { day: 'Tue', height: 68 },
  { day: 'Wed', height: 54 },
  { day: 'Thu', height: 86 },
  { day: 'Fri', height: 64 },
  { day: 'Sat', height: 28 },
  { day: 'Sun', height: 34 },
];

const RECENT_MANUALS = [
  { title: 'Sample Order Entry Procedure', steps: '12 steps', locale: 'en-US · ja-JP', status: 'Verified' },
  { title: 'Monthly Equipment Check Guide', steps: '9 steps', locale: 'en-US · ja-JP', status: 'In Review' },
  { title: 'Expense Request Approval Steps', steps: '15 steps', locale: 'en-US · ja-JP', status: 'Verified' },
];

export const DashboardScreen: React.FC = () => (
  <div className="flex flex-col h-full justify-between gap-3">
    <div className="flex items-end justify-between border-b border-[#E1E8F0] pb-2.5">
      <div>
        <div className="mono-tabular text-[9px] uppercase tracking-[0.08em] text-[#68778B]">
          Dashboard · Local Workspace
        </div>
        <h3 className="m-0 mt-0.5 text-[15px] font-bold text-[#172334]">
          Good morning, Operator
        </h3>
      </div>
      <span className="text-[10px] font-semibold text-white bg-[#247BFA] px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
        Start Capture
      </span>
    </div>

    <div className="grid grid-cols-3 gap-4 py-1 border-b border-[#E1E8F0]">
      <div>
        <div className="mono-tabular text-[16px] font-bold text-[#172334]">18</div>
        <div className="text-[9.5px] text-[#68778B]">Captured sessions</div>
      </div>
      <div>
        <div className="mono-tabular text-[16px] font-bold text-[#172334]">14</div>
        <div className="text-[9.5px] text-[#68778B]">Verified manuals</div>
      </div>
      <div>
        <div className="mono-tabular text-[16px] font-bold text-[#247BFA]">2</div>
        <div className="text-[9.5px] text-[#68778B]">Release 1 locales</div>
      </div>
    </div>

    <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
      <div className="col-span-5 flex flex-col justify-between">
        <div className="mono-tabular text-[9px] uppercase tracking-[0.06em] text-[#68778B]">
          Weekly Activity
        </div>
        <div className="flex items-end justify-between gap-1.5 h-[78px] pt-2">
          {WEEKLY_BARS.map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div
                className="w-full rounded-t-[3px] bg-[#247BFA]/85"
                style={{ height: `${bar.height}%` }}
              />
              <span className="mono-tabular text-[8px] text-[#68778B]">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-7 flex flex-col justify-between border-l border-[#E1E8F0] pl-3">
        <div className="mono-tabular text-[9px] uppercase tracking-[0.06em] text-[#68778B]">
          Recent Documentation
        </div>
        <div className="flex flex-col divide-y divide-[#E1E8F0]">
          {RECENT_MANUALS.map((item) => (
            <div key={item.title} className="py-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold text-[#172334] truncate">{item.title}</div>
                <div className="mono-tabular text-[8.5px] text-[#68778B] truncate whitespace-nowrap">
                  {item.steps} · {item.locale}
                </div>
              </div>
              <span
                className={`mono-tabular text-[8.5px] font-semibold shrink-0 ${
                  item.status === 'Verified' ? 'text-[#16865B]' : 'text-[#B7791F]'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
