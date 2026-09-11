'use client';

import React, { useSyncExternalStore } from 'react';
import { audioStore } from '@/lib/audio-state';

/**
 * SoundToggle — minimal fixed-position audio control.
 *
 * Sits at z-index 1000, below WelcomeIntro (99999) and CustomCursor (9999).
 * The button is naturally hidden behind the intro overlay for its 2.2s duration.
 *
 * Design language: dark navy, cyan accent — native to Quantum AI.
 * No song title, no progress bar, no equalizer. Pure icon-only control.
 *
 * toggleMute() is called synchronously in the click handler, satisfying
 * Safari/iOS requirements for user-gesture-gated audio playback.
 */
export function SoundToggle() {
  const { isMuted, isBlocked } = useSyncExternalStore(
    audioStore.subscribe,
    audioStore.getSnapshot,
    audioStore.getServerSnapshot,
  );

  // Sound is audibly active = not muted AND not waiting for first gesture
  const isActive = !isMuted && !isBlocked;
  const label = isActive ? 'Mute background music' : 'Enable background music';

  return (
    <>
      <style>{`
        .qa-sound-btn {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 1000;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(3, 7, 18, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
          outline: none;
        }
        .qa-sound-btn--active {
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.12), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .qa-sound-btn--silent {
          border: 1px solid rgba(56, 189, 248, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .qa-sound-btn:hover {
          border-color: rgba(56, 189, 248, 0.55);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.18), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .qa-sound-btn:active {
          transform: scale(0.93);
        }
        .qa-sound-btn:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 3px;
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

// Speaker with two sound waves (audio is on / active)
function IconSoundOn() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#38BDF8"
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

// Speaker with X (muted or blocked — waiting for user gesture)
function IconSoundOff() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748B"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
