'use client';

import { useEffect, useRef } from 'react';
import { audioStore } from '@/lib/audio-state';

const AUDIO_SRC = '/bg-sound/Weight_of_the_Near_Stars.mp3';
const INITIAL_VOLUME = 0.15;

/**
 * AudioPlayer — invisible client component that owns the single <audio> element
 * for the entire public website lifecycle.
 *
 * Mounted once in app/(public)/layout.tsx. Because that layout never unmounts
 * during SPA navigation, the audio element persists across all page changes.
 *
 * React Strict Mode note: the effect will run twice in development (mount →
 * cleanup → mount). This is safe because each cleanup fully destroys the audio
 * element and unregisters it from audioStore before the next effect creates
 * a fresh one. Production always runs exactly once.
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

    // Reflect native audio events into the store
    const onPlay = () => audioStore._setPlaying(true);
    const onPause = () => audioStore._setPlaying(false);
    const onEnded = () => audioStore._setPlaying(false);
    const onError = () => {
      // Do not crash the page on audio errors
      audioStore._setPlaying(false);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Attempt autoplay. Most browsers will block this on first visit.
    // If blocked: mark isBlocked=true and wait for a user gesture via SoundToggle.
    // If allowed: music begins at low volume (0.15) in the background.
    if (!prefersReducedMotion) {
      audio.play().catch((err: Error) => {
        if (err.name === 'NotAllowedError') {
          // Expected — browser autoplay policy blocked it. Not an error.
          audioStore._setBlocked(true);
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
