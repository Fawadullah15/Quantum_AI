'use client';

import React, { useEffect, useState, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
}

const TRAIL_LENGTH = 8; // Number of trail dots

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorMode, setCursorMode] = useState<'default' | 'link' | 'hide' | 'invert'>('default');
  const [isClicking, setIsClicking] = useState(false);

  // References for direct DOM manipulation (60fps performance)
  const leadDotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Coordinates
  const mouse = useRef({ x: -100, y: -100 });
  const leadPos = useRef({ x: -100, y: -100 });
  const trailPoints = useRef<TrailPoint[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }))
  );

  useEffect(() => {
    // 1. Disable on touch/mobile devices or devices without fine pointer
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (isTouch) return;

    // 2. Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.body.classList.add('custom-cursor-active');
    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    // 3. Inspect target element for trail modifiers
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check for explicit trail modifiers (trail{hide}, trail{invert-color}, trail{link})
      const trailHide =
        target.closest('[data-trail="hide"]') ||
        target.closest('[data-cursor="hide"]') ||
        target.closest('.trail-hide') ||
        target.closest('[trail-hide]');

      const trailInvert =
        target.closest('[data-trail="invert"]') ||
        target.closest('[data-trail="invert-color"]') ||
        target.closest('.trail-invert') ||
        target.closest('[trail-invert]');

      const trailLink =
        target.closest('[data-trail="link"]') ||
        target.closest('[data-cursor="hover"]') ||
        target.closest('.trail-link') ||
        target.closest('[trail-link]');

      const isInteractive =
        target.closest('a') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[role="button"]') ||
        target.closest('[role="link"]') ||
        target.closest('summary');

      if (trailHide) {
        setCursorMode('hide');
      } else if (trailInvert) {
        setCursorMode('invert');
      } else if (trailLink || isInteractive) {
        setCursorMode('link');
      } else {
        setCursorMode('default');
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseenter', () => setIsVisible(true));
    document.addEventListener('mouseleave', () => setIsVisible(false));

    let animationFrameId: number;

    const render = () => {
      // Smooth lerp for lead pointer dot
      const leadEase = 0.65;
      leadPos.current.x += (mouse.current.x - leadPos.current.x) * leadEase;
      leadPos.current.y += (mouse.current.y - leadPos.current.y) * leadEase;

      // Position the lead dot & interactive expansion ring
      if (leadDotRef.current) {
        leadDotRef.current.style.transform = `translate3d(${leadPos.current.x}px, ${leadPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${leadPos.current.x}px, ${leadPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      // Trailing dots physics stream: each dot follows the previous dot
      if (!prefersReducedMotion) {
        let prevX = leadPos.current.x;
        let prevY = leadPos.current.y;

        trailPoints.current.forEach((point, index) => {
          // Decreasing ease for successive trail dots
          const trailEase = Math.max(0.22, 0.55 - index * 0.045);
          point.x += (prevX - point.x) * trailEase;
          point.y += (prevY - point.y) * trailEase;

          const el = trailRefs.current[index];
          if (el) {
            el.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
          }

          prevX = point.x;
          prevY = point.y;
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  const isHidden = cursorMode === 'hide';
  const isLink = cursorMode === 'link';
  const isInvert = cursorMode === 'invert';

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: isInvert ? 'difference' : 'normal',
        opacity: isHidden ? 0 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Interactive Outer Target Ring (Expands on Links/Buttons) */}
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: isLink ? '38px' : '22px',
          height: isLink ? '38px' : '22px',
          borderRadius: '50%',
          border: isLink
            ? '1.5px solid #38BDF8'
            : '1px solid rgba(56, 189, 248, 0.35)',
          backgroundColor: isLink ? 'rgba(22, 119, 255, 0.15)' : 'transparent',
          boxShadow: isLink ? '0 0 16px rgba(56, 189, 248, 0.5)' : 'none',
          transform: `translate3d(${leadPos.current.x}px, ${leadPos.current.y}px, 0) translate(-50%, -50%) scale(${isClicking ? 0.85 : 1})`,
          transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
          pointerEvents: 'none',
        }}
      />

      {/* Primary Pointer Center Dot */}
      <div
        ref={leadDotRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: isLink ? '4px' : '6px',
          height: isLink ? '4px' : '6px',
          borderRadius: '50%',
          backgroundColor: isInvert ? '#FFFFFF' : '#38BDF8',
          boxShadow: isInvert
            ? '0 0 8px #FFFFFF'
            : '0 0 10px #55D6FF, 0 0 20px rgba(22, 119, 255, 0.8)',
          transform: `translate3d(${leadPos.current.x}px, ${leadPos.current.y}px, 0) translate(-50%, -50%) scale(${isClicking ? 0.7 : 1})`,
          transition: 'width 0.15s, height 0.15s, background-color 0.2s',
          pointerEvents: 'none',
        }}
      />

      {/* Trailing Dots Stream */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, index) => {
        // Dot sizes decay: from ~4.5px down to ~1.5px
        const size = Math.max(1.5, 4.5 - index * 0.45);
        // Opacity decays: from 0.75 down to 0.1
        const opacity = isLink
          ? Math.max(0.05, 0.45 - index * 0.055)
          : Math.max(0.1, 0.75 - index * 0.085);

        return (
          <div
            key={index}
            ref={(el) => {
              trailRefs.current[index] = el;
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: isInvert ? '#FFFFFF' : index % 2 === 0 ? '#55D6FF' : '#1677FF',
              opacity,
              boxShadow: `0 0 ${4 + (TRAIL_LENGTH - index)}px rgba(56, 189, 248, ${opacity * 0.8})`,
              transform: `translate3d(${trailPoints.current[index].x}px, ${trailPoints.current[index].y}px, 0) translate(-50%, -50%)`,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </div>
  );
}
