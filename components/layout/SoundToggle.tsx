'use client';

import React, { useSyncExternalStore } from 'react';
import { audioStore } from '@/lib/audio-state';

/**
 * SoundToggle — refined, minimal fixed-position ambient audio control.
 *
 * Sits at z-index 1000 (below WelcomeIntro 99999 and CustomCursor 9999).
 * Uses Quantum AI design tokens: deep void backdrop, subtle blue/cyan borders,
 * restrained glow, and responsive safe-area positioning.
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
    <>
      <style>{`
        .qa-sound-btn {
          position: fixed;
          bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
          right: calc(1.5rem + env(safe-area-inset-right, 0px));
          z-index: 1000;
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
          .qa-sound-btn {
            bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
            right: calc(1rem + env(safe-area-inset-right, 0px));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .qa-sound-btn {
            transition: none !important;
            transform: none !important;
          }
          .qa-sound-btn:active {
            transform: none !important;
          }
        }
      `}</style>

      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={audioStore.toggleMute}
        className={`qa-sound-btn ${isActive ? 'qa-sound-btn--active' : 'qa-sound-btn--silent'}`}
      >
        {isActive ? <IconSoundOn /> : <IconSoundOff />}
      </button>
    </>
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
