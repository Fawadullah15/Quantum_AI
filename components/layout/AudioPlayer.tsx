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
 * Lifecycle Safety:
 * - Strictly bound to the document lifecycle.
 * - Stopped synchronously on React unmount and on window 'pagehide' / 'beforeunload'.
 * - Guarded by an `isActive` flag so pending play() promises cannot restart audio
 *   after teardown.
 * - Automatically releases the network resource (audio.src = '', audio.load())
 *   and clears module-level audio references upon destruction.
 */
export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ensure any previous audio instance is completely destroyed first
    audioStore._cleanup();

    let isActive = true;
    let interactionListenersActive = false;
    let isAttempting = false;

    // Create the audio element imperatively (not as JSX) to keep it out of the
    // React reconciler and prevent any accidental duplication.
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = INITIAL_VOLUME;
    audio.preload = 'none'; // Do not eagerly download the 4.1 MB file

    audioRef.current = audio;
    audioStore._register(audio);

    const cleanupInteractionListeners = () => {
      if (!interactionListenersActive) return;
      interactionListenersActive = false;
      INTERACTION_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleFirstInteraction, true);
      });
    };

    const handleFirstInteraction = (e: Event) => {
      if (!isActive) {
        cleanupInteractionListeners();
        return;
      }

      // If the interaction is inside the sound control area (toggle button or floating prompt), let that control handle it
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.qa-sound-control-root') || target?.closest?.('.qa-sound-btn')) {
        return;
      }

      const state = audioStore.getSnapshot();
      // If user explicitly muted or audio is already playing, do not play
      if (state.isMuted || state.isPlaying || !isActive) {
        cleanupInteractionListeners();
        return;
      }

      if (isAttempting) return;
      isAttempting = true;

      // Synchronous execution: audio.play() is invoked directly in the user gesture call stack
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!isActive) {
              // Teardown occurred while play() promise was resolving; force immediate pause
              try {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
                audio.load();
              } catch {}
              return;
            }
            audioStore._setBlocked(false);
            audioStore._setPlaying(true);
            cleanupInteractionListeners();
          })
          .catch((err: Error) => {
            if (!isActive) return;
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
      if (!isActive || interactionListenersActive) return;
      interactionListenersActive = true;
      INTERACTION_EVENTS.forEach((evt) => {
        window.addEventListener(evt, handleFirstInteraction, true);
      });
    };

    // Reflect native audio events into the store with isActive guard
    const onPlay = () => {
      if (!isActive) {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = '';
          audio.load();
        } catch {}
        return;
      }
      audioStore._setPlaying(true);
      audioStore._setBlocked(false);
      cleanupInteractionListeners();
    };
    const onPause = () => {
      if (!isActive) return;
      audioStore._setPlaying(false);
    };
    const onEnded = () => {
      if (!isActive) return;
      audioStore._setPlaying(false);
    };
    const onError = () => {
      if (!isActive) return;
      // Do not crash the page on audio errors
      audioStore._setPlaying(false);
      cleanupInteractionListeners();
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Central synchronous teardown routine
    const teardown = () => {
      if (!isActive) return;
      isActive = false;

      // 1. Detach all window and interaction listeners
      cleanupInteractionListeners();
      window.removeEventListener('pagehide', handleDocumentUnload);
      window.removeEventListener('beforeunload', handleDocumentUnload);

      // 2. Remove native audio listeners
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);

      // 3. Synchronously stop audio and release media stream/pipeline
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load();
      } catch {
        // Ignore errors during teardown
      }

      // 4. Clear ref and reset store
      audioRef.current = null;
      audioStore._cleanup();
    };

    // Document lifecycle cleanup (tab close, browser close, page refresh, external navigation)
    const handleDocumentUnload = () => {
      teardown();
    };

    window.addEventListener('pagehide', handleDocumentUnload);
    window.addEventListener('beforeunload', handleDocumentUnload);

    // Immediately attempt to play background audio when the website loads.
    // If the browser permits audible autoplay, playback begins automatically at 15% volume.
    // If the browser blocks autoplay (NotAllowedError), attach temporary window
    // capture listeners so playback begins synchronously on the first legitimate interaction.
    const initialPlayPromise = audio.play();
    if (initialPlayPromise !== undefined) {
      initialPlayPromise
        .then(() => {
          if (!isActive) {
            try {
              audio.pause();
              audio.currentTime = 0;
              audio.src = '';
              audio.load();
            } catch {}
            return;
          }
          audioStore._setBlocked(false);
          audioStore._setPlaying(true);
        })
        .catch((err: Error) => {
          if (!isActive) return;
          if (err.name === 'NotAllowedError') {
            // Expected — browser autoplay policy blocked audible autoplay.
            audioStore._setBlocked(true);
            setupInteractionListeners();
          } else {
            // Genuinely unexpected error (e.g., network/file issue); log once, don't retry.
            console.warn('[AudioPlayer] Playback error:', err.message);
            audioStore._setBlocked(true);
          }
        });
    }

    return () => {
      // Full cleanup — runs on unmount and on Strict Mode's synthetic unmount.
      teardown();
    };
  }, []); // Empty deps — runs once per true mount, never reruns on navigation

  return null; // No DOM output
}
