import { useEffect } from 'react';
import { useOperoStore } from '../store/useOperoStore';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const store = useOperoStore.getState();
      if (store.showOnboarding) return;

      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        store.setNavMode('capture');
        return;
      }

      if (!meta) return;

      if (key === '0') {
        e.preventDefault();
        store.setNavMode('dashboard');
      } else if (key === '1') {
        e.preventDefault();
        store.setNavMode('studio');
      } else if (key === '2') {
        e.preventDefault();
        store.setNavMode('templates');
      } else if (key === '3') {
        e.preventDefault();
        store.setNavMode('analyzer');
      } else if (key === ',') {
        e.preventDefault();
        store.setNavMode('settings');
      } else if (key === 'b' && e.shiftKey) {
        e.preventDefault();
        store.toggleRight();
      } else if (key === 'b') {
        e.preventDefault();
        store.toggleLeft();
      } else if (key === 'e' && !e.shiftKey) {
        e.preventDefault();
        void store.runExport('pdf');
      } else if (key === 'd' && e.shiftKey) {
        e.preventDefault();
        void store.runExport('docx');
      } else if (key === 'm' && e.shiftKey) {
        e.preventDefault();
        void store.runExport('markdown');
      } else if (key === 'h' && e.shiftKey) {
        e.preventDefault();
        void store.runExport('html');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
