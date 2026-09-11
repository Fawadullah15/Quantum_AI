'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioStore } from '@/lib/audio-state';

const SESSION_KEY = 'qa-sound-prompt-dismissed';

interface SoundPromptProps {
  onEnable?: () => void;
  onDismiss?: () => void;
}

/**
 * SoundPrompt — small floating sound hint attached above the SoundToggle button.
 *
 * Appears gently when autoplay is blocked, informing the visitor that sound is available.
 * Non-blocking: does not blur the screen, covers no primary content, and allows full site interaction.
 *
 * Clicking "Enable Sound" immediately calls audioStore.enableSound() synchronously in the
 * user gesture call stack, satisfying iOS/Safari/Chrome autoplay restrictions.
 * Dismissing via "×" or Escape stores the choice in sessionStorage for the session.
 */
export function SoundPrompt({ onEnable, onDismiss }: SoundPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // 1. If already dismissed in this session, do not show
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        return;
      }
    } catch {
      // Storage unavailable; continue safely
    }

    // 2. If audio is already playing (autoplay succeeded), do not show
    if (audioStore.getSnapshot().isPlaying) {
      return;
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    // 3. Gentle entrance delay: 2.2s to smoothly follow WelcomeIntro completion,
    // or 400ms if reduced motion (where WelcomeIntro is skipped)
    const delay = mql.matches ? 400 : 2200;

    const timer = setTimeout(() => {
      // Re-verify audio is still not playing before showing
      if (!audioStore.getSnapshot().isPlaying) {
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  // Automatically close if audio starts playing from any source (e.g. natural interaction or toggle click)
  useEffect(() => {
    if (!isVisible) return;

    const unsubscribe = audioStore.subscribe(() => {
      const state = audioStore.getSnapshot();
      if (state.isPlaying) {
        setIsVisible(false);
        try {
          sessionStorage.setItem(SESSION_KEY, 'true');
        } catch {}
      }
    });

    return unsubscribe;
  }, [isVisible]);

  const handleDismiss = React.useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {}
    onDismiss?.();
  }, [onDismiss]);

  // Support Escape key dismissal
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleDismiss]);

  const handleEnable = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {}

    // Synchronous execution in the user gesture call stack
    audioStore.enableSound();
    onEnable?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          role="status"
          aria-live="polite"
          aria-label="Sound recommendation"
          className="qa-sound-prompt-card"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
          }
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
