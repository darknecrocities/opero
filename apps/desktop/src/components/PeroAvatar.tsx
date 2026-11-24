import React from 'react';
import { OperoLogo } from '@opero/mascot';

interface PeroAvatarProps {
  size?: number;
  thinking?: boolean;
  label?: string;
}

export const PeroAvatar: React.FC<PeroAvatarProps> = ({
  size = 34,
  thinking = false,
  label = 'Pero AI Profile',
}) => (
  <span
    aria-label={label}
    className={`pero-avatar-ring ${thinking ? 'pero-avatar-thinking' : ''}`.trim()}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '999px',
      background: '#F2F8FF',
      border: '1.5px solid #B9E0FE',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(105, 188, 252, 0.18)',
    }}
  >
    <OperoLogo variant="mark" size={Math.round(size * 0.82)} title={label} />
  </span>
);
