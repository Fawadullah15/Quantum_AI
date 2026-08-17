'use client';

import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const steps = ['CORE', 'DATA', 'SYSTEMS', 'INTERFACE'];

  useEffect(() => {
    // Check if already loaded in this session
    const hasLoaded = sessionStorage.getItem('hasLoaded');
    if (hasLoaded) {
      setIsVisible(false);
      setShouldRender(false);
      if (onComplete) onComplete();
      return;
    }

    sessionStorage.setItem('hasLoaded', 'true');

    // Trigger fade out
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2800);

    // Unmount and callback
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
      if (onComplete) onComplete();
    }, 3200);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-void)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 400ms ease-in-out',
      }}
    >
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-widest)',
            color: 'var(--color-text-tertiary)',
            textAlign: 'center',
            marginBottom: '16px',
            animation: 'fadeIn 0.5s ease-out forwards',
          }}
        >
          SYSTEM INITIALIZATION
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
          {steps.map((step, index) => (
            <div
              key={step}
              style={{
                opacity: 0,
                transform: 'translateY(10px)',
                animation: `slideUp 0.4s ease-out forwards ${0.2 + index * 0.3}s`,
              }}
            >
              {step}
            </div>
          ))}
        </div>

        <div
          style={{
            width: '100%',
            height: '2px',
            backgroundColor: 'var(--color-border-2)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: 'var(--color-core)',
              width: '0%',
              animation: 'fillProgress 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fillProgress {
          0% { width: 0%; }
          30% { width: 40%; }
          70% { width: 60%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
}
