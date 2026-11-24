import { JIGGICONS_PACK, type JiggIconDef } from './engine';

export const OPERO_JIGG_ALIASES: Record<string, string> = {
  capture: 'camera',
  studio: 'feather',
  router: 'bot',
  outputs: 'folder',
  library: 'book',
  memory: 'diamond',
  permissions: 'lock',
  shield: 'lock',
  privacy: 'lock',
  record: 'camera',
  pause: 'toggle-left',
  stop: 'anchor',
  snap: 'flash',
  search: 'flashlight',
  prompt: 'lightbulb',
  translate: 'globe',
  glossary: 'bookmark',
  verified: 'saved',
  warning: 'bell',
  export: 'download',
  'export-pdf': 'receipt',
  'export-docx': 'book',
  'export-md': 'feather',
  'export-html': 'globe',
  snapshot: 'bookmark',
  settings: 'toggle-left',
  voice: 'headphones',
  mic: 'headset',
  number: 'pin',
  arrow: 'send',
  rect: 'cube',
  blur: 'eye',
  crop: 'lasso',
  label: 'bookmark',
  spotlight: 'lightbulb',
  undo: 'windmill',
  redo: 'rocket',
  delete: 'eraser',
  add: 'star',
  celebrate: 'confetti',
  workflow: 'windmill',
  device: 'laptop',
  sync: 'windmill',
  user: 'handshake',
  docs: 'book',
};

export function resolveJiggIcon(name: string): JiggIconDef {
  if (JIGGICONS_PACK[name]) return JIGGICONS_PACK[name];
  const mapped = OPERO_JIGG_ALIASES[name];
  if (mapped && JIGGICONS_PACK[mapped]) return JIGGICONS_PACK[mapped];
  return JIGGICONS_PACK['star'] ?? Object.values(JIGGICONS_PACK)[0]!;
}
