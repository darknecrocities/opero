import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { PANORAMA_ANCHORS } from '../data/showcaseContent';
import type { PanoramaAnchorId } from '../types/showcase';

export function useHorizontalScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const isDesktop = true;
  const [maxScrollX, setMaxScrollX] = useState<number>(2800);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900,
  );
  const [activeAnchor, setActiveAnchor] = useState<PanoramaAnchorId>('overview');

  const measureTrack = useCallback(() => {
    if (typeof window === 'undefined') return;
    setViewportHeight(window.innerHeight);

    if (trackRef.current) {
      const overflow = Math.max(0, trackRef.current.scrollWidth - window.innerWidth);
      setMaxScrollX(overflow);
    }
  }, []);

  useEffect(() => {
    measureTrack();
    window.addEventListener('resize', measureTrack);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && trackRef.current) {
      ro = new ResizeObserver(() => measureTrack());
      ro.observe(trackRef.current);
    }

    return () => {
      window.removeEventListener('resize', measureTrack);
      ro?.disconnect();
    };
  }, [measureTrack]);

  const { scrollYProgress: pageProgress } = useScroll();
  const smoothPageProgress = useSpring(pageProgress, {
    stiffness: prefersReducedMotion ? 500 : 140,
    damping: prefersReducedMotion ? 50 : 26,
    mass: 0.35,
  });

  const { scrollYProgress: horizontalProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothHorizontal = useSpring(horizontalProgress, {
    stiffness: prefersReducedMotion ? 500 : 140,
    damping: prefersReducedMotion ? 50 : 26,
    mass: 0.35,
  });

  const trackX = useTransform(smoothHorizontal, [0, 1], [0, -maxScrollX]);

  useEffect(() => {
    const updateActive = () => {
      const scrollY = window.scrollY;
      const horizontalEnd =
        isDesktop && containerRef.current
          ? containerRef.current.offsetTop + containerRef.current.offsetHeight - window.innerHeight
          : 0;

      if (isDesktop && scrollY <= horizontalEnd + 40) {
        const ratio = horizontalEnd > 0 ? Math.min(1, Math.max(0, scrollY / horizontalEnd)) : 0;
        const currentX = ratio * maxScrollX + window.innerWidth * 0.32;
        let matched: PanoramaAnchorId = 'overview';
        for (const anchor of PANORAMA_ANCHORS) {
          if (anchor.axis !== 'horizontal') continue;
          const el = document.getElementById(anchor.id);
          if (el && el.offsetLeft <= currentX) matched = anchor.id;
        }
        setActiveAnchor((prev) => (prev === matched ? prev : matched));
        return;
      }

      let matched: PanoramaAnchorId = isDesktop ? 'flow' : 'overview';
      for (const anchor of PANORAMA_ANCHORS) {
        if (isDesktop && anchor.axis === 'horizontal') continue;
        const el = document.getElementById(anchor.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) matched = anchor.id;
        }
      }
      setActiveAnchor((prev) => (prev === matched ? prev : matched));
    };

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
    return () => window.removeEventListener('scroll', updateActive);
  }, [isDesktop, maxScrollX]);

  useEffect(() => {
    if (!isDesktop) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaX, behavior: 'auto' });
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isDesktop]);

  const scrollToAnchor = useCallback(
    (id: PanoramaAnchorId) => {
      const meta = PANORAMA_ANCHORS.find((a) => a.id === id);
      const el = document.getElementById(id);
      if (!el || !meta) return;

      if (isDesktop && meta.axis === 'horizontal' && containerRef.current && maxScrollX > 0) {
        const targetOffset = Math.min(maxScrollX, Math.max(0, el.offsetLeft - 48));
        const ratio = targetOffset / maxScrollX;
        const scrollableHeight = Math.max(0, containerRef.current.offsetHeight - window.innerHeight);
        const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: containerTop + ratio * scrollableHeight,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        setActiveAnchor(id);
        return;
      }

      const rect = el.getBoundingClientRect();
      window.scrollTo({
        top: Math.max(0, rect.top + window.scrollY - 72),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      setActiveAnchor(id);
    },
    [isDesktop, maxScrollX, prefersReducedMotion],
  );

  const runwayHeight = isDesktop ? Math.max(viewportHeight, maxScrollX + viewportHeight) : undefined;

  return {
    containerRef,
    trackRef,
    isDesktop,
    activeAnchor,
    smoothProgress: smoothPageProgress,
    trackX,
    runwayHeight,
    scrollToAnchor,
  };
}
