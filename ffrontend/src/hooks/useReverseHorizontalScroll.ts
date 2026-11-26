import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

const DESKTOP_BREAKPOINT = 1024;

export function useReverseHorizontalScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true,
  );
  const [maxScrollX, setMaxScrollX] = useState<number>(1600);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900,
  );

  const measure = useCallback(() => {
    if (typeof window === 'undefined') return;
    const desktop = window.innerWidth >= DESKTOP_BREAKPOINT;
    setIsDesktop(desktop);
    setViewportHeight(window.innerHeight);

    if (desktop && trackRef.current) {
      const overflow = Math.max(0, trackRef.current.scrollWidth - window.innerWidth);
      setMaxScrollX(overflow);
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && trackRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(trackRef.current);
    }

    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [measure]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 500 : 140,
    damping: prefersReducedMotion ? 50 : 26,
    mass: 0.35,
  });

  // Reverse direction: glides left-to-right (-maxScrollX -> 0) as user scrolls down
  const reverseX = useTransform(smooth, [0, 1], [-maxScrollX, 0]);
  const runwayHeight = isDesktop ? Math.max(viewportHeight, maxScrollX + viewportHeight) : undefined;

  return {
    containerRef,
    trackRef,
    isDesktop,
    reverseX,
    runwayHeight,
  };
}
