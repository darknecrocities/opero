import type { PeroMotionId } from '../../assets/mascot';

export interface PeroStickerHint {
  id: PeroMotionId;
  number: string;
  label: string;
  hint: string;
}

export const PERO_20_STICKER_HINTS: readonly PeroStickerHint[] = [
  { id: 'idle-breathe', number: '01', label: 'Idle Breathe', hint: 'Quietly standing by in your tray' },
  { id: 'wave-hello', number: '02', label: 'Wave Hello', hint: 'Ready to guide your next SOP' },
  { id: 'thumbs-up', number: '03', label: 'Thumbs Up', hint: 'Step verified & ready to ship' },
  { id: 'recording-active', number: '04', label: 'Recording Active', hint: 'Capturing clicks privately on-device' },
  { id: 'capture-paused', number: '05', label: 'Capture Paused', hint: 'Paused anytime with one shortcut' },
  { id: 'camera-snap', number: '06', label: 'Screenshot Snap', hint: 'Crisp frame linked to every step' },
  { id: 'monocle-inspect', number: '07', label: 'Monocle Inspect', hint: 'Local OCR reads UI labels accurately' },
  { id: 'thinking-processing', number: '08', label: 'AI Thinking', hint: 'Grouping actions into clean steps' },
  { id: 'writing-manual', number: '09', label: 'Drafting Manual', hint: 'Writing clear EN / JA / FIL guides' },
  { id: 'annotating-arrows', number: '10', label: 'Annotating', hint: 'Adding arrows, callouts & step badges' },
  { id: 'magnifying-search', number: '11', label: 'Workflow Search', hint: 'Dual-Core SQLite RAG under 8 MB RAM' },
  { id: 'needs-review-alert', number: '12', label: 'Needs Review', hint: 'Flags uncertain steps for humans' },
  { id: 'verified-celebrate', number: '13', label: 'Verified Draft', hint: 'Human-approved before publishing' },
  { id: 'export-document', number: '14', label: 'Export Ready', hint: 'Ships to PDF, DOCX, HTML & Markdown' },
  { id: 'model-loading', number: '15', label: 'Local AI Ready', hint: 'Runs offline with zero cloud uploads' },
  { id: 'privacy-shield', number: '16', label: 'Privacy Shield', hint: 'Blurs & redacts sensitive fields locally' },
  { id: 'walk-waddle', number: '17', label: 'Penguin Waddle', hint: 'Gliding smoothly through your workflow' },
  { id: 'jump-cheer', number: '18', label: 'Milestone Cheer', hint: 'Manual completed in minutes, not hours' },
  { id: 'sleep-standby', number: '19', label: 'Standby Sleep', hint: 'Zero background CPU when idle' },
  { id: 'error-recover', number: '20', label: 'Safe Recovery', hint: 'Capture persists even if AI stops' },
];

export interface StickerSlot {
  id: string;
  className: string;
  tilt: number;
  size: number;
  hintAlign: 'left' | 'right' | 'center';
}

export const VERTICAL_STICKER_SLOTS: readonly StickerSlot[] = [
  { id: 'v-1', className: 'top-[4%] left-3 sm:left-6', tilt: -9, size: 68, hintAlign: 'left' },
  { id: 'v-2', className: 'top-[14%] right-3 sm:right-8 hidden sm:block', tilt: 8, size: 72, hintAlign: 'right' },
  { id: 'v-3', className: 'top-[32%] left-2 sm:left-8 hidden md:block', tilt: 7, size: 66, hintAlign: 'left' },
  { id: 'v-4', className: 'top-[48%] right-3 sm:right-7', tilt: -8, size: 70, hintAlign: 'right' },
  { id: 'v-5', className: 'top-[68%] left-3 sm:left-10 hidden sm:block', tilt: -6, size: 68, hintAlign: 'left' },
  { id: 'v-6', className: 'top-[86%] right-4 sm:right-10', tilt: 9, size: 66, hintAlign: 'right' },
];

export const RUNWAY_STICKER_SLOTS: readonly StickerSlot[] = [
  { id: 'r-1', className: 'top-28 left-[18%] hidden lg:block', tilt: -7, size: 64, hintAlign: 'center' },
  { id: 'r-2', className: 'bottom-8 right-[14%] hidden lg:block', tilt: 8, size: 66, hintAlign: 'right' },
];
