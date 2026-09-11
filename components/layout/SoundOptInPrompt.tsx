'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioStore } from '@/lib/audio-state';

const SESSION_KEY = 'qa-sound-prompt-dismissed';

/**
 * SoundOptInPrompt — premium cinematic sound opt-in prompt for Quantum AI.
 *
 * Appears on first public visit when ambient autoplay is blocked or pending
 * user gesture. Fades in right after WelcomeIntro completes.
 *
 * Uses Framer Motion for restrained entrance/exit animations.
 * Clicking "Enable Sound" synchronously activates audio via audioStore.enableAudio(),
 * satisfying browser autoplay requirements without delay.
 * Dismissal is persisted for the session in sessionStorage.
 */
export function SoundOptInPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // 1. Check if already dismissed/enabled in this session
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        return;
      }
    } catch {
      // Storage unavailable (e.g. strict private mode); continue safely
    }

    // 2. Check if audio is already actively playing
    if (audioStore.getSnapshot().isPlaying) {
      return;
    }

    // 3. Check reduced-motion preference
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    // 4. Delay entrance: 300ms if reduced motion, or 2300ms to smoothly
    // align with WelcomeIntro's 2.2s splash completion.
    const delayMs = mql.matches ? 300 : 2300;

    const timer = setTimeout(() => {
      // Re-check before displaying: if audio started in the meantime, do not show
      if (!audioStore.getSnapshot().isPlaying) {
        setIsOpen(true);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, []);

  // Auto-close if audio begins playing via any other source (e.g. SoundToggle)
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = audioStore.subscribe(() => {
      const state = audioStore.getSnapshot();
      if (state.isPlaying) {
        setIsOpen(false);
        try {
          sessionStorage.setItem(SESSION_KEY, 'true');
        } catch {}
      }
    });

    return unsubscribe;
  }, [isOpen]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleEnable = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {}

    // Synchronous execution directly within user click call stack
    audioStore.enableAudio();
  };

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {}
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="qa-sound-prompt-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.4, ease: 'easeOut' }}
        >
          <style>{`
            .qa-sound-prompt-backdrop {
              position: fixed;
              inset: 0;
              z-index: 2000;
              background: rgba(2, 6, 18, 0.5);
              backdrop-filter: blur(6px);
              -webkit-backdrop-filter: blur(6px);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
              overflow-x: hidden;
            }

            .qa-sound-prompt {
              position: relative;
              width: 100%;
              max-width: 420px;
              background: rgba(6, 21, 43, 0.88);
              border: 1px solid rgba(56, 189, 248, 0.22);
              border-radius: 12px;
              padding: clamp(1.25rem, 4vw, 1.75rem);
              box-shadow: 0 0 40px rgba(55, 48, 163, 0.2), 0 20px 48px -12px rgba(0, 0, 0, 0.85);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              outline: none;
            }

            /* Subtle radial decorative glow behind prompt card */
            .qa-sound-prompt::before {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: inherit;
              background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 65%),
                          radial-gradient(circle at bottom left, rgba(79, 70, 229, 0.08), transparent 65%);
              pointer-events: none;
            }

            /* Eyebrow & Waveform */
            .qa-sound-eyebrow {
              font-family: var(--font-mono, monospace);
              font-size: 0.6875rem;
              letter-spacing: 0.25em;
              text-transform: uppercase;
              color: #38BDF8;
              margin-bottom: 0.65rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }

            .qa-sound-waveform {
              display: inline-flex;
              align-items: center;
              gap: 2.5px;
              height: 12px;
              margin-left: 0.25rem;
            }

            .qa-wave-bar {
              width: 2px;
              background: #38BDF8;
              border-radius: 1px;
              animation: qaWavePulse 1.4s ease-in-out infinite alternate;
            }
            .qa-wave-bar:nth-child(1) { height: 5px; animation-delay: 0s; }
            .qa-wave-bar:nth-child(2) { height: 11px; animation-delay: 0.25s; }
            .qa-wave-bar:nth-child(3) { height: 7px; animation-delay: 0.5s; }
            .qa-wave-bar:nth-child(4) { height: 9px; animation-delay: 0.15s; }

            @keyframes qaWavePulse {
              0% { transform: scaleY(0.4); opacity: 0.45; }
              100% { transform: scaleY(1); opacity: 0.95; }
            }

            /* Heading */
            .qa-sound-title {
              font-family: var(--font-sans, sans-serif);
              font-size: clamp(1.1rem, 2.5vw, 1.25rem);
              font-weight: 600;
              color: #F8FAFC;
              line-height: 1.3;
              margin: 0 0 0.5rem 0;
              letter-spacing: -0.015em;
            }

            /* Supporting copy */
            .qa-sound-desc {
              font-family: var(--font-sans, sans-serif);
              font-size: 0.875rem;
              color: #94A3B8;
              line-height: 1.5;
              margin: 0 0 1.5rem 0;
              font-weight: 400;
            }

            /* Action Buttons */
            .qa-sound-actions {
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }

            .qa-prompt-btn-primary {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #1677FF, #0050B3);
              color: #FFFFFF;
              border: 1px solid rgba(56, 189, 248, 0.4);
              border-radius: 6px;
              padding: 0.625rem 1.35rem;
              font-family: var(--font-mono, monospace);
              font-size: 0.75rem;
              font-weight: 600;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              cursor: pointer;
              box-shadow: 0 4px 16px -2px rgba(22, 119, 255, 0.4);
              transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease, background 0.2s ease;
              white-space: nowrap;
              min-height: 40px;
            }

            .qa-prompt-btn-primary:hover {
              background: linear-gradient(135deg, #2563EB, #1D4ED8);
              border-color: #38BDF8;
              box-shadow: 0 6px 20px -2px rgba(56, 189, 248, 0.5);
            }

            .qa-prompt-btn-primary:active {
              transform: scale(0.97);
            }

            .qa-prompt-btn-primary:focus-visible {
              outline: 2px solid #38BDF8;
              outline-offset: 3px;
            }

            .qa-prompt-btn-ghost {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: transparent;
              color: #94A3B8;
              border: 1px solid transparent;
              border-radius: 6px;
              padding: 0.625rem 1rem;
              font-family: var(--font-mono, monospace);
              font-size: 0.75rem;
              font-weight: 500;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              cursor: pointer;
              transition: color 0.2s ease, background-color 0.2s ease;
              white-space: nowrap;
              min-height: 40px;
            }

            .qa-prompt-btn-ghost:hover {
              color: #F8FAFC;
              background: rgba(255, 255, 255, 0.06);
            }

            .qa-prompt-btn-ghost:active {
              transform: scale(0.97);
            }

            .qa-prompt-btn-ghost:focus-visible {
              outline: 2px solid #38BDF8;
              outline-offset: 3px;
            }

            /* Responsive Mobile Safe-Area Layout */
            @media (max-width: 640px) {
              .qa-sound-prompt-backdrop {
                align-items: flex-end;
                padding: 0 0.75rem calc(1rem + env(safe-area-inset-bottom, 0px));
              }

              .qa-sound-prompt {
                max-width: 100%;
                border-radius: 12px;
                padding: 1.25rem;
              }

              .qa-sound-actions {
                flex-direction: row;
                width: 100%;
              }

              .qa-prompt-btn-primary {
                flex: 1;
              }
            }

            /* Reduced motion overrides */
            @media (prefers-reduced-motion: reduce) {
              .qa-wave-bar {
                animation: none !important;
                transform: none !important;
                opacity: 0.75 !important;
              }

              .qa-prompt-btn-primary,
              .qa-prompt-btn-ghost {
                transition: none !important;
                transform: none !important;
              }
            }
          `}</style>

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sound-prompt-title"
            aria-describedby="sound-prompt-desc"
            className="qa-sound-prompt"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6 }}
            transition={
              reducedMotion
                ? { duration: 0.15 }
                : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
            }
          >
            {/* Eyebrow + Minimal Waveform */}
            <div className="qa-sound-eyebrow">
              <span>QUANTUM AI</span>
              <span className="qa-sound-waveform" aria-hidden="true">
                <span className="qa-wave-bar" />
                <span className="qa-wave-bar" />
                <span className="qa-wave-bar" />
                <span className="qa-wave-bar" />
              </span>
            </div>

            {/* Title */}
            <h2 id="sound-prompt-title" className="qa-sound-title">
              Experience Quantum AI with sound.
            </h2>

            {/* Supporting text */}
            <p id="sound-prompt-desc" className="qa-sound-desc">
              Enable ambient sound for the full cinematic experience.
            </p>

            {/* Buttons */}
            <div className="qa-sound-actions">
              <button
                type="button"
                onClick={handleEnable}
                className="qa-prompt-btn-primary"
              >
                Enable Sound
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="qa-prompt-btn-ghost"
              >
                Not Now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
