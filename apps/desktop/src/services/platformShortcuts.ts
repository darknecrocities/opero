/**
 * OS-dynamic keyboard shortcut formatter.
 * Displays native macOS symbols (⌘, ⌥, ⇧, ↵) on macOS and Windows/Linux labels (Ctrl+, Alt+, Shift+, Enter) elsewhere.
 */
export function isMacOsPlatform(osNameHint?: string | null): boolean {
  if (osNameHint) {
    const low = osNameHint.toLowerCase();
    if (low.includes('mac') || low.includes('darwin')) return true;
    if (low.includes('win') || low.includes('linux')) return false;
  }
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (nav.userAgentData?.platform || navigator.platform || navigator.userAgent || '').toLowerCase();
  return platform.includes('mac') || platform.includes('darwin');
}

export interface ShortcutSpec {
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
  key: string;
}

export function formatShortcut(spec: ShortcutSpec, osNameHint?: string | null): string {
  const mac = isMacOsPlatform(osNameHint);
  const keyLabel =
    spec.key === 'Enter'
      ? mac
        ? '↵'
        : 'Enter'
      : spec.key;

  if (mac) {
    let out = '';
    if (spec.mod) out += '⌘';
    if (spec.alt) out += '⌥';
    if (spec.shift) out += '⇧';
    return `${out}${keyLabel}`;
  }

  const parts: string[] = [];
  if (spec.mod) parts.push('Ctrl');
  if (spec.alt) parts.push('Alt');
  if (spec.shift) parts.push('Shift');
  parts.push(keyLabel);
  return parts.join('+');
}
