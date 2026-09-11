/**
 * Module-level audio state store.
 * Follows the same pattern as lib/gallery-state.ts.
 *
 * AudioPlayer   -> registers the real <audio> element via _register()
 * AudioPlayer   -> writes isPlaying / isBlocked via _setPlaying() / _setBlocked()
 * SoundToggle   -> reads state via useSyncExternalStore
 * SoundToggle   -> calls toggleMute() synchronously from click handler (Safari safe)
 */

type Listener = () => void;

export interface AudioState {
  isMuted: boolean;
  isPlaying: boolean;
  isBlocked: boolean;
}

const INITIAL_STATE: AudioState = {
  isMuted: false,
  isPlaying: false,
  isBlocked: false,
};

let _state: AudioState = { ...INITIAL_STATE };
let _audio: HTMLAudioElement | null = null;
const _listeners = new Set<Listener>();

function _notify(): void {
  _listeners.forEach((fn) => fn());
}

export const audioStore = {
  getSnapshot(): AudioState {
    return _state;
  },
  // Must match INITIAL_STATE to prevent hydration mismatch on SSR
  getServerSnapshot(): AudioState {
    return INITIAL_STATE;
  },
  subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  },

  _register(audio: HTMLAudioElement | null): void {
    _audio = audio;
  },

  _setPlaying(playing: boolean): void {
    if (_state.isPlaying === playing) return;
    _state = { ..._state, isPlaying: playing };
    _notify();
  },

  _setBlocked(blocked: boolean): void {
    if (_state.isBlocked === blocked) return;
    _state = { ..._state, isBlocked: blocked };
    _notify();
  },

  /**
   * Toggle mute / unmute, or unblock if autoplay was rejected.
   * MUST be called synchronously from a user gesture handler.
   * audio.play() runs in the same synchronous call stack — Safari/iOS safe.
   */
  toggleMute(): void {
    if (!_audio) return;

    // Case A: autoplay was blocked -> first click = start audio (do not mute)
    if (_state.isBlocked && !_state.isMuted) {
      _state = { ..._state, isBlocked: false };
      _notify();
      _audio.play().catch((err: Error) => {
        if (err.name === 'NotAllowedError') {
          _state = { ..._state, isBlocked: true };
          _notify();
        }
      });
      return;
    }

    // Case B: normal toggle
    const nextMuted = !_state.isMuted;
    if (nextMuted) {
      _audio.pause();
      _state = { ..._state, isMuted: true, isPlaying: false };
      _notify();
    } else {
      _state = { ..._state, isMuted: false };
      _notify();
      _audio.play().catch((err: Error) => {
        if (err.name === 'NotAllowedError') {
          _state = { ..._state, isBlocked: true };
          _notify();
        }
      });
    }
  },
};
