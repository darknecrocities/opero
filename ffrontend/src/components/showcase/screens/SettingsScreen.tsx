import React from 'react';

const SETTINGS_ROWS = [
  { label: 'Local AI Runtime', value: 'Ollama (Localhost) · Fallback: llama.cpp' },
  { label: 'Capture Privacy', value: 'Explicit start/stop · Password fields excluded' },
  { label: 'Document Languages', value: 'English (en-US), Japanese (ja-JP) · Filipino soon' },
  { label: 'Storage Engine', value: 'Local SQLite WAL · Managed local assets' },
  { label: 'Desktop Release', value: 'Release 1 (Windows) · Coming soon' },
];

export const SettingsScreen: React.FC = () => (
  <div className="flex flex-col h-full justify-between gap-2.5">
    <div className="flex items-end justify-between border-b border-[#E1E8F0] pb-2">
      <div>
        <div className="mono-tabular text-[9px] uppercase tracking-[0.08em] text-[#68778B]">
          Settings
        </div>
        <h3 className="m-0 mt-0.5 text-[14px] font-bold text-[#172334]">
          Application Preferences & Local Runtimes
        </h3>
      </div>
      <span className="mono-tabular text-[9px] text-[#68778B]">Release 1</span>
    </div>

    <div className="flex-1 flex flex-col divide-y divide-[#E1E8F0]">
      {SETTINGS_ROWS.map((row) => (
        <div key={row.label} className="py-2 flex items-center justify-between gap-3 text-[10px]">
          <span className="font-semibold text-[#172334]">{row.label}</span>
          <span className="mono-tabular text-[9px] text-[#68778B] text-right">{row.value}</span>
        </div>
      ))}
    </div>
  </div>
);
