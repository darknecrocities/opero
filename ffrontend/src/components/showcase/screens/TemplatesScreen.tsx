import React from 'react';

const TEMPLATES = [
  { code: 'SOP-01', name: 'Standard Operating Procedure', sections: 'Purpose · Steps · Verification' },
  { code: 'SOP-02', name: 'System Onboarding Runbook', sections: 'Prerequisites · Setup · Check' },
  { code: 'SOP-03', name: 'Quality Inspection Checklist', sections: 'Criteria · Evidence · Sign-off' },
  { code: 'SOP-04', name: 'Incident Response Playbook', sections: 'Triage · Containment · Review' },
  { code: 'SOP-05', name: 'Bilingual Training Manual', sections: 'EN/JA Parallel · Glossary' },
];

export const TemplatesScreen: React.FC = () => (
  <div className="flex flex-col h-full justify-between gap-2.5">
    <div className="flex items-end justify-between border-b border-[#E1E8F0] pb-2">
      <div>
        <div className="mono-tabular text-[9px] uppercase tracking-[0.08em] text-[#68778B]">
          Template Center
        </div>
        <h3 className="m-0 mt-0.5 text-[14px] font-bold text-[#172334]">
          Structured Documentation Templates
        </h3>
      </div>
      <span className="mono-tabular text-[9px] text-[#247BFA] font-semibold">7 SOP Templates</span>
    </div>

    <div className="flex-1 flex flex-col divide-y divide-[#E1E8F0]">
      {TEMPLATES.map((tpl, idx) => (
        <div
          key={tpl.code}
          className={`py-1.5 px-1.5 flex items-center justify-between gap-2 ${
            idx === 0 ? 'bg-[#EAF3FF]/60' : ''
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="mono-tabular text-[9px] font-semibold text-[#247BFA]">{tpl.code}</span>
              <span className="text-[10.5px] font-semibold text-[#172334] truncate">{tpl.name}</span>
            </div>
            <div className="text-[9px] text-[#68778B] mt-0.5">{tpl.sections}</div>
          </div>
          <span className="mono-tabular text-[8.5px] text-[#172334] font-medium shrink-0">
            Apply
          </span>
        </div>
      ))}
    </div>
  </div>
);
