'use client';

import React, { useSyncExternalStore } from 'react';
import { audioStore } from '@/lib/audio-state';
import { SoundPrompt } from './SoundPrompt';

/**
 * SoundToggle — refined, minimal fixed-position ambient audio control
 * with an attached non-blocking floating prompt.
 *
 * Sits at z-index 1000 (below WelcomeIntro 99999 and CustomCursor 9999).
 * The outer container has pointer-events: none so clicks pass freely to the site.
 * The button and the floating prompt have pointer-events: auto.
 *
 * toggleMute() is executed synchronously within the click handler to satisfy
 * Safari/iOS user-gesture requirements.
 */
export function SoundToggle() {
  const { isMuted, isBlocked } = useSyncExternalStore(
    audioStore.subscribe,
    audioStore.getSnapshot,
    audioStore.getServerSnapshot,
  );

  // Sound is audibly active = not muted AND not waiting for initial user gesture
  const isActive = !isMuted && !isBlocked;
  const label = isActive ? 'Mute background music' : 'Enable background music';

  return (
    <div className="qa-sound-control-root">
      {/* Small floating sound hint attached above the toggle */}
      <SoundPrompt />

      {/* Main sound toggle button */}
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={audioStore.toggleMute}
        className={`qa-sound-btn ${isActive ? 'qa-sound-btn--active' : 'qa-sound-btn--silent'}`}
      >
        {isActive ? <IconSoundOn /> : <IconSoundOff />}
      </button>

      <style>{`
        .qa-sound-control-root {
          position: fixed;
          bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
          right: calc(1.5rem + env(safe-area-inset-right, 0px));
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          pointer-events: none;
        }

        /* Floating prompt card */
        .qa-sound-prompt-card {
          pointer-events: auto;
          width: 275px;
          max-width: calc(100vw - 2.5rem);
          background: rgba(6, 21, 43, 0.92);
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 10px;
          padding: 13px 15px 14px;
          box-shadow: 0 0 24px rgba(55, 48, 163, 0.2), 0 12px 32px -8px rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          outline: none;
          user-select: none;
        }

        .qa-sound-prompt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .qa-sound-prompt-title-group {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .qa-sound-prompt-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38BDF8;
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
        }

        .qa-sound-prompt-title {
          font-family: var(--font-sans, sans-serif);
          font-size: 0.84rem;
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .qa-sound-prompt-close {
          background: transparent;
          border: none;
          color: #64748B;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease, background-color 0.15s ease;
          outline: none;
        }

        .qa-sound-prompt-close:hover {
          color: #F8FAFC;
          background: rgba(255, 255, 255, 0.08);
        }

        .qa-sound-prompt-close:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 1px;
        }

        .qa-sound-prompt-desc {
          font-family: var(--font-sans, sans-serif);
          font-size: 0.77rem;
          color: #94A3B8;
          line-height: 1.45;
          margin: 0 0 11px 0;
          font-weight: 400;
        }

        .qa-sound-prompt-footer {
          display: flex;
          align-items: center;
        }

        .qa-sound-prompt-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1677FF, #0050B3);
          color: #FFFFFF;
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 5px;
          padding: 6px 14px;
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(22, 119, 255, 0.35);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease, background 0.2s ease;
          outline: none;
          white-space: nowrap;
          min-height: 32px;
        }

        .qa-sound-prompt-btn:hover {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          border-color: #38BDF8;
          box-shadow: 0 4px 16px rgba(56, 189, 248, 0.5);
        }

        .qa-sound-prompt-btn:active {
          transform: scale(0.97);
        }

        .qa-sound-prompt-btn:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 2px;
        }

        /* Sound button styles */
        .qa-sound-btn {
          pointer-events: auto;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(3, 7, 18, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          border: 1px solid rgba(30, 58, 138, 0.4);
          color: #94A3B8;
          box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.5);
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .qa-sound-btn--active {
          border-color: rgba(56, 189, 248, 0.35);
          color: #38BDF8;
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.12), 0 4px 16px -2px rgba(0, 0, 0, 0.6);
        }
        .qa-sound-btn--silent {
          border-color: rgba(30, 58, 138, 0.4);
          color: #94A3B8;
          box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.5);
        }
        @media (hover: hover) and (pointer: fine) {
          .qa-sound-btn--active:hover {
            border-color: rgba(56, 189, 248, 0.6);
            color: #7DD3FC;
            background: rgba(7, 21, 47, 0.92);
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.22), 0 4px 20px -2px rgba(0, 0, 0, 0.7);
          }
          .qa-sound-btn--silent:hover {
            border-color: rgba(56, 189, 248, 0.35);
            color: #F8FAFC;
            background: rgba(7, 21, 47, 0.9);
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.1), 0 4px 16px -2px rgba(0, 0, 0, 0.6);
          }
        }
        .qa-sound-btn:active {
          transform: scale(0.95);
        }
        .qa-sound-btn:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 3px;
        }
        @media (max-width: 768px) {
          .qa-sound-control-root {
            bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
            right: calc(1rem + env(safe-area-inset-right, 0px));
          }
          .qa-sound-prompt-card {
            width: 245px;
            padding: 12px 13px 13px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .qa-sound-btn,
          .qa-sound-prompt-card,
          .qa-sound-prompt-btn {
            transition: none !important;
            transform: none !important;
          }
          .qa-sound-btn:active,
          .qa-sound-prompt-btn:active {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Speaker with sound waves (active)
function IconSoundOn() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

// Speaker with muted cross (silent / waiting for gesture)
function IconSoundOff() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}
