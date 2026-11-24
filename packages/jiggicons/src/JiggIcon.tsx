import React, { useEffect, useId, useMemo, useRef } from 'react';
import { getScopedJiggMarkup, pickJiggVariant, playJiggAnimation, type JiggVariant } from './engine';
import { resolveJiggIcon } from './aliases';

export interface JiggIconProps {
  name: string;
  size?: number;
  variant?: JiggVariant;
  trigger?: 'hover' | 'mount' | 'none';
  pulseKey?: string | number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const JiggIcon: React.FC<JiggIconProps> = ({
  name,
  size = 18,
  variant = 'duotone',
  trigger = 'hover',
  pulseKey,
  title,
  className = '',
  style,
}) => {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const def = useMemo(() => resolveJiggIcon(name), [name]);
  const resolvedVariant = useMemo(() => pickJiggVariant(def, variant), [def, variant]);
  const markup = useMemo(
    () => getScopedJiggMarkup(def, resolvedVariant, uid),
    [def, resolvedVariant, uid],
  );

  useEffect(() => {
    if (trigger === 'mount' || pulseKey !== undefined) {
      return playJiggAnimation(svgRef.current, def, resolvedVariant);
    }
    return undefined;
  }, [def, resolvedVariant, trigger, pulseKey]);

  const handleInteract = () => {
    if (trigger === 'none') return;
    playJiggAnimation(svgRef.current, def, resolvedVariant);
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      data-jiggicon={def.id}
      data-variant={resolvedVariant}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`jigg-icon ${className}`.trim()}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      onMouseEnter={handleInteract}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
};
