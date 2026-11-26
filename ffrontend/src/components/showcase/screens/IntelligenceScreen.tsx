import React from 'react';

const EVIDENCE_GROUPS = [
  {
    step: 'Step 01',
    title: 'Open Inventory Registration',
    evidence: 'OCR: "Add New" · AXButton · shot_02.png',
    confidence: 'Grounded',
  },
  {
    step: 'Step 02',
    title: 'Enter SKU and Warehouse Code',
    evidence: 'AXTextField · password fields excluded · shot_03.png',
    confidence: 'Grounded',
  },
  {
    step: 'Step 03',
    title: 'Confirm and Save Record',
    evidence: 'OCR: "Save Record" · dialog verified · shot_04.png',
    confidence: 'Needs Review',
  },
];

export const IntelligenceScreen: React.FC = () => (
  <div className="flex flex-col h-full justify-between gap-3">
    <div className="flex items-end justify-between border-b border-[#E1E8F0] pb-2.5">
      <div>
        <div className="mono-tabular text-[9px] uppercase tracking-[0.08em] text-[#247BFA] font-semibold">
          OPERO Intelligence · Local Runtime
        </div>
        <h3 className="m-0 mt-0.5 text-[14px] font-bold text-[#172334]">
          Deterministic Grouping & Local Synthesis
        </h3>
      </div>
      <span className="mono-tabular text-[9px] text-[#68778B]">Ollama · Qwen3 Local</span>
    </div>

    <div className="grid grid-cols-2 gap-4 py-1 border-b border-[#E1E8F0] text-[10px]">
      <div>
        <div className="mono-tabular text-[8.5px] uppercase text-[#68778B]">Pipeline Stage</div>
        <div className="font-semibold text-[#172334] mt-0.5">OCR + Accessibility Tree → Draft</div>
      </div>
      <div>
        <div className="mono-tabular text-[8.5px] uppercase text-[#68778B]">Dual-Core Memory</div>
        <div className="font-semibold text-[#172334] mt-0.5">Episodic + Glossary RAG (Local SQLite)</div>
      </div>
    </div>

    <div className="flex-1 flex flex-col divide-y divide-[#E1E8F0]">
      {EVIDENCE_GROUPS.map((group) => (
        <div key={group.step} className="py-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="mono-tabular text-[9px] font-semibold text-[#247BFA]">{group.step}</span>
              <span className="text-[10.5px] font-semibold text-[#172334]">{group.title}</span>
            </div>
            <div className="mono-tabular text-[8.5px] text-[#68778B] mt-0.5 truncate">
              {group.evidence}
            </div>
          </div>
          <span
            className={`mono-tabular text-[8.5px] font-semibold shrink-0 ${
              group.confidence === 'Grounded' ? 'text-[#16865B]' : 'text-[#B7791F]'
            }`}
          >
            {group.confidence}
          </span>
        </div>
      ))}
    </div>
  </div>
);
