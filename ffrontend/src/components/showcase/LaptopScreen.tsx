import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Camera,
  Cpu,
  Download,
  FileCode2,
  GitBranch,
  Home,
  Minus,
  Settings,
  Square,
  X,
} from 'lucide-react';
import { OperoLogo } from '../../assets/mascot';
import type { ProductModuleId } from '../../types/showcase';
import { ProductScreen } from './ProductScreen';

export interface LaptopScreenProps {
  activeModule: ProductModuleId;
  onSelectModule?: (module: ProductModuleId) => void;
  interactive?: boolean;
}

const SIDEBAR_ITEMS: readonly {
  id: ProductModuleId;
  label: string;
  shortcut: string;
  Icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', shortcut: 'Ctrl+0', Icon: Home },
  { id: 'capture-center', label: 'Capture Center', shortcut: 'Alt+Spc', Icon: Camera },
  { id: 'intelligence', label: 'Intelligence', shortcut: 'Ctrl+5', Icon: Cpu },
  { id: 'studio', label: 'OPERO Studio', shortcut: 'Ctrl+1', Icon: BookOpen },
  { id: 'templates', label: 'Templates', shortcut: 'Ctrl+2', Icon: FileCode2 },
  { id: 'version-control', label: 'Versions', shortcut: 'Ctrl+3', Icon: GitBranch },
  { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', Icon: Settings },
];

export const LaptopScreen: React.FC<LaptopScreenProps> = ({
  activeModule,
  onSelectModule,
  interactive = false,
}) => (
  <div className="flex flex-col h-full w-full bg-white text-[#172334] text-left">
    <div className="flex items-center justify-between h-11 pt-2.5 px-3 border-b border-[#E1E8F0] bg-[#F7F9FC] shrink-0">
      <div className="flex items-center gap-1.5">
        <OperoLogo variant="mark" size={14} title="OPERO" />
        <span className="opero-appbar-wordmark text-[12px]">Opero.</span>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-medium text-[#68778B]">
        <span className="inline-flex items-center gap-1">
          <Download size={10} aria-hidden="true" />
          <span>Export</span>
          <span className="mono-tabular text-[9px]">Ctrl+E</span>
        </span>
        <span aria-hidden="true" className="flex items-center gap-2 text-[#68778B] pl-2 border-l border-[#E1E8F0]">
          <Minus size={10} />
          <Square size={9} />
          <X size={10} />
        </span>
      </div>
    </div>

    <div className="flex flex-1 min-h-0">
      <aside className="w-[128px] sm:w-[172px] shrink-0 border-r border-[#E1E8F0] bg-[#F7F9FC] p-2 flex flex-col justify-between">
        <div className="flex flex-col gap-0.5">
          {SIDEBAR_ITEMS.map(({ id, label, shortcut, Icon }) => {
            const isActive = activeModule === id;
            return (
              <button
                key={id}
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onSelectModule?.(id)}
                className={`relative flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[10.5px] font-medium border-0 text-left transition-colors ${
                  interactive ? 'cursor-pointer' : 'cursor-default'
                } ${
                  isActive
                    ? 'bg-[#EAF3FF] text-[#247BFA]'
                    : 'bg-transparent text-[#68778B] hover:text-[#172334]'
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  <Icon size={11} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                <span className="hidden sm:inline mono-tabular text-[8.5px] opacity-70 shrink-0">
                  {shortcut}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[#E1E8F0] px-1.5">
          <div className="text-[9.5px] font-semibold text-[#172334] truncate">Sample Workspace</div>
          <div className="mono-tabular text-[8.5px] text-[#68778B]">SQLite Local · Windows</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 bg-white overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full p-3.5 sm:p-4 overflow-hidden"
          >
            <ProductScreen moduleId={activeModule} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </div>
);
