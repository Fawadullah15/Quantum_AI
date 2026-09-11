'use client';

import { useEffect, useRef } from 'react';
import { audioStore } from '@/lib/audio-state';

const AUDIO_SRC = '/bg-sound/Weight_of_the_Near_Stars.mp3';
const INITIAL_VOLUME = 0.15;

/** Real user events capable of triggering transient user activation in modern browsers */
const INTERACTION_EVENTS: readonly (keyof WindowEventMap)[] = [
  'pointerdown',
  'touchstart',
  'click',
  'keydown',
];

/**
 * AudioPlayer — invisible client component that owns the single <audio> element
 * for the entire public website lifecycle.
 *
 * Mounted once in app/(public)/layout.tsx. Because that layout never unmounts
 * during SPA navigation, the audio element persists across all page changes.
 *
 * When browser autoplay policy blocks audible playback on initial visit,
 * temporary capture listeners are attached to window so the very first genuine
 * user interaction anywhere on the public site synchronously starts playback.
 * Once playback starts or if the user explicitly mutes, listeners are detached.
 */
export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create the audio element imperatively (not as JSX) to keep it out of the
    // React reconciler and prevent any accidental duplication.
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = INITIAL_VOLUME;
    audio.preload = 'none'; // Do not eagerly download the 4.1 MB file

    audioRef.current = audio;
    audioStore._register(audio);

    let interactionListenersActive = false;

    const cleanupInteractionListeners = () => {
      if (!interactionListenersActive) return;
      interactionListenersActive = false;
      INTERACTION_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleFirstInteraction, true);
      });
    };

    let isAttempting = false;

    const handleFirstInteraction = (e: Event) => {
      // If the interaction is on the SoundToggle button or SoundOptInPrompt, let those components manage it
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.qa-sound-btn') || target?.closest?.('.qa-sound-prompt')) {
        return;
      }

      const state = audioStore.getSnapshot();
      // If user explicitly muted or audio is already playing, do not play
      if (state.isMuted || state.isPlaying || !audioRef.current) {
        cleanupInteractionListeners();
        return;
      }

      if (isAttempting) return;
      isAttempting = true;

      // Synchronous execution: audio.play() is invoked directly in the user gesture call stack
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audioStore._setBlocked(false);
            audioStore._setPlaying(true);
            cleanupInteractionListeners();
          })
          .catch((err: Error) => {
            isAttempting = false;
            if (err.name === 'NotAllowedError') {
              // Browser did not grant user activation on this specific event;
              // keep listeners active so the next interaction can activate playback.
            } else {
              // Unexpected error — clean up to prevent repeated attempts
              cleanupInteractionListeners();
            }
          });
      } else {
        cleanupInteractionListeners();
      }
    };

    const setupInteractionListeners = () => {
      if (interactionListenersActive) return;
      interactionListenersActive = true;
      INTERACTION_EVENTS.forEach((evt) => {
        window.addEventListener(evt, handleFirstInteraction, true);
      });
    };

    // Reflect native audio events into the store
    const onPlay = () => {
      audioStore._setPlaying(true);
      audioStore._setBlocked(false);
      cleanupInteractionListeners();
    };
    const onPause = () => audioStore._setPlaying(false);
    const onEnded = () => audioStore._setPlaying(false);
    const onError = () => {
      // Do not crash the page on audio errors
      audioStore._setPlaying(false);
      cleanupInteractionListeners();
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Attempt autoplay. Most browsers will block this on first visit.
    // If blocked: mark isBlocked=true and attach temporary first-interaction listeners.
    // If allowed: music begins at low volume (0.15) in the background.
    if (!prefersReducedMotion) {
      audio.play().catch((err: Error) => {
        if (err.name === 'NotAllowedError') {
          // Expected — browser autoplay policy blocked it. Not an error.
          audioStore._setBlocked(true);
          setupInteractionListeners();
        } else {
          // Genuinely unexpected (e.g., file not found); log once, don't retry.
          console.warn('[AudioPlayer] Playback error:', err.message);
          audioStore._setBlocked(true);
        }
      });
    } else {
      // Respect prefers-reduced-motion: start muted/blocked, let user opt in.
      audioStore._setBlocked(true);
    }

    return () => {
      // Full cleanup — runs on unmount and on Strict Mode's synthetic unmount.
      cleanupInteractionListeners();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = ''; // Release the network resource
      audioRef.current = null;
      audioStore._register(null);
      audioStore._setPlaying(false);
    };
  }, []); // Empty deps — runs once per true mount, never reruns on navigation

  return null; // No DOM output
}
