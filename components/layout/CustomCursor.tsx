'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorState, setCursorState] = useState('default');
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Mouse positions
  const mouse = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    document.body.classList.add('custom-cursor-active');
    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const cursorTarget = target.closest('[data-cursor]');
      
      if (cursorTarget) {
        const state = cursorTarget.getAttribute('data-cursor') || 'hover';
        setCursorState(state);
      } else if (target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
        setCursorState('button');
      } else {
        setCursorState('default');
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseenter', () => setIsVisible(true));
    document.addEventListener('mouseleave', () => setIsVisible(false));

    let animationFrameId: number;

    const render = () => {
      // Lerp for smooth tracking
      dotPos.current.x += (mouse.current.x - dotPos.current.x) * 0.9;
      dotPos.current.y += (mouse.current.y - dotPos.current.y) * 0.9;
      
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
      {/* Ring */}
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1px solid var(--color-core)',
          transition: 'width 0.2s, height 0.2s, background-color 0.2s',
          ...(cursorState === 'hover' && {
            width: '48px',
            height: '48px',
          }),
          ...(cursorState === 'button' && {
            width: '40px',
            height: '40px',
            backgroundColor: 'rgba(0, 200, 255, 0.2)',
          }),
        }}
      />
      {/* Dot */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-core)',
          transition: 'width 0.2s, height 0.2s, opacity 0.2s',
          ...(cursorState === 'button' && {
            width: '2px',
            height: '2px',
            opacity: 0,
          }),
        }}
      />
    </div>
  );
}
