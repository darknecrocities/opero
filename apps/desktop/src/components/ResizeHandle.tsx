import React, { useRef } from 'react';

interface ResizeHandleProps {
  ariaLabel: string;
  onResizeDelta: (deltaX: number) => void;
  onReset?: () => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ ariaLabel, onResizeDelta, onReset }) => {
  const startXRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const delta = e.clientX - startXRef.current;
    if (delta !== 0) {
      startXRef.current = e.clientX;
      onResizeDelta(delta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      tabIndex={0}
      className="opero-resize-handle"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={() => onReset?.()}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onResizeDelta(-16);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onResizeDelta(16);
        } else if (e.key === 'Home' && onReset) {
          e.preventDefault();
          onReset();
        }
      }}
    />
  );
};
