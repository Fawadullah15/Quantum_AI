'use client';

import React, { useState, useEffect } from 'react';
import { audioStore } from '@/lib/audio-state';

const SESSION_KEY = 'qa-sound-prompt-dismissed';

interface SoundPromptProps {
  onEnable?: () => void;
  onDismiss?: () => void;
}

export function SoundPrompt({ onEnable, onDismiss }: SoundPromptProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') return;
    } catch {}

    if (audioStore.getSnapshot().isPlaying) return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    const delay = mql.matches ? 400 : 3400;

    const timer = setTimeout(() => {
      if (!audioStore.getSnapshot().isPlaying) {
        setShouldRender(true);
        // Small delay to allow mounting before triggering CSS transition
        setTimeout(() => setIsVisible(true), 50);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    const unsubscribe = audioStore.subscribe(() => {
      const state = audioStore.getSnapshot();
      if (state.isPlaying) {
        handleDismiss();
      }
    });

    return unsubscribe;
  }, [shouldRender]);

  const handleDismiss = React.useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {}
    
    // Wait for transition before unmounting
    setTimeout(() => {
      setShouldRender(false);
      onDismiss?.();
    }, 400);
  }, [onDismiss]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleDismiss]);

  const handleEnable = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {}

    audioStore.enableSound();
    
    setTimeout(() => {
      setShouldRender(false);
      onEnable?.();
    }, 400);
  };

  if (!shouldRender) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Sound recommendation"
      className="qa-sound-prompt-card"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: reducedMotion ? 'none' : (isVisible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(6px)'),
        transition: reducedMotion ? 'opacity 0.15s ease' : 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div className="qa-sound-prompt-header">
        <div className="qa-sound-prompt-title-group">
          <span className="qa-sound-prompt-dot" aria-hidden="true" />
          <span className="qa-sound-prompt-title">Sound is off</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="qa-sound-prompt-close"
          aria-label="Dismiss sound prompt"
          title="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <p className="qa-sound-prompt-desc">
        Enable sound for the full Quantum AI experience.
      </p>

      <div className="qa-sound-prompt-footer">
        <button
          type="button"
          onClick={handleEnable}
          className="qa-sound-prompt-btn"
        >
          Enable Sound
        </button>
      </div>
    </aside>
  );
}
