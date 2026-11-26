import React from 'react';
import type { TechStackId } from '../../types/showcase';

export interface TechStackLogoProps {
  id: TechStackId;
  size?: number;
}

export const TechStackLogo: React.FC<TechStackLogoProps> = ({ id, size = 22 }) => {
  switch (id) {
    case 'tauri':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9.2" cy="9.2" r="2.6" fill="currentColor" />
          <path d="M5 9.2a4.2 4.2 0 0 1 7.3-2.8l2-2A7 7 0 0 0 2.2 9.2c0 2.8 1.7 5.2 4.1 6.3l1.3-2.5A4.2 4.2 0 0 1 5 9.2Z" fill="currentColor" opacity="0.7" />
          <circle cx="14.8" cy="14.8" r="2.6" fill="#247BFA" />
          <path d="M19 14.8a4.2 4.2 0 0 1-7.3 2.8l-2 2A7 7 0 0 0 21.8 14.8c0-2.8-1.7-5.2-4.1-6.3l-1.3 2.5a4.2 4.2 0 0 1 2.6 3.8Z" fill="#247BFA" opacity="0.85" />
        </svg>
      );
    case 'rust':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 1.5" />
          <path d="M8.5 16V8h4.2a2.4 2.4 0 0 1 0 4.8H8.5m4.2 0L15.8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'react':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="2" fill="#247BFA" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.8" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.8" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.8" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
        </svg>
      );
    case 'typescript':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3.5" fill="currentColor" />
          <path d="M7 11.2h5m-2.5 0V17m5.5-5.6c-.8-.4-2-.4-2.4.3-.4.7.2 1.2 1.1 1.6 1 .4 1.8.9 1.7 2-.1 1.1-1.3 1.7-2.6 1.5-.6-.1-1.1-.3-1.5-.6" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sqlite':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <ellipse cx="12" cy="6.5" rx="7" ry="2.8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 6.5v11c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-11" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8" stroke="#247BFA" strokeWidth="1.8" />
        </svg>
      );
    case 'ollama':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 9V5.5C8 4.4 9.5 4 10 5l1 2.2h2L14 5c.5-1 2-.6 2 .5V9c1.8 1 2.8 3 2.8 5.2 0 3.2-2.7 5.8-6.8 5.8S5.2 17.4 5.2 14.2C5.2 12 6.2 10 8 9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="9.8" cy="13.2" r="1.1" fill="currentColor" />
          <circle cx="14.2" cy="13.2" r="1.1" fill="currentColor" />
          <path d="M10.8 15.8c.7.5 1.7.5 2.4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'paddleocr':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 9h8M8 12.5h5M8 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="16.5" cy="14.5" r="2" fill="#247BFA" />
        </svg>
      );
    case 'vite':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 20.5 4 5.5l8 2.2 8-2.2-8 15Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M13.5 3.5 9.5 12h3l-1 5 4.5-7h-3l.5-6.5Z" fill="#247BFA" />
        </svg>
      );
    case 'tailwind':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6.8 10.6c.7-2.8 2.5-4.2 5.2-4.2 3.2 0 3.6 2.4 5.2 2.8 1.1.3 2-.1 2.8-1.2-.7 2.8-2.5 4.2-5.2 4.2-3.2 0-3.6-2.4-5.2-2.8-1.1-.3-2 .1-2.8 1.2Zm-2.8 5.6c.7-2.8 2.5-4.2 5.2-4.2 3.2 0 3.6 2.4 5.2 2.8 1.1.3 2-.1 2.8-1.2-.7 2.8-2.5 4.2-5.2 4.2-3.2 0-3.6-2.4-5.2-2.8-1.1-.3-2 .1-2.8 1.2Z" fill="#247BFA" />
        </svg>
      );
    case 'motion':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16l-8 6 8 6H4l8-6-8-6Z" fill="currentColor" />
        </svg>
      );
  }
};
