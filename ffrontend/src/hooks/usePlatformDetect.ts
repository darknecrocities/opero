import { useMemo } from 'react';

export type DetectedPlatform = 'macos' | 'windows' | 'other';

export function usePlatformDetect(): DetectedPlatform {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return 'other';
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator.platform ?? '').toLowerCase();
    if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os x')) {
      return 'macos';
    }
    if (platform.includes('win') || ua.includes('windows')) {
      return 'windows';
    }
    return 'other';
  }, []);
}
