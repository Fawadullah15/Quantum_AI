/**
 * Module-level gallery store — works across all render tree boundaries,
 * including React Three Fiber Canvas which has its own internal reconciler.
 *
 * GalleryConfigurator writes here when a project page mounts/unmounts.
 * DigitalGallery reads from here via useSyncExternalStore.
 *
 * This completely bypasses React Context and eliminates any context-crossing issues.
 */

type Listener = () => void;

let _images: string[] = [];
const _listeners = new Set<Listener>();

export const galleryStore = {
  /** Return the current snapshot — required by useSyncExternalStore */
  getSnapshot(): string[] {
    return _images;
  },

  /** Subscribe to changes — required by useSyncExternalStore */
  subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  },

  /** Write new images and notify all subscribers */
  set(images: string[]): void {
    _images = images;
    _listeners.forEach((fn) => fn());
  },

  /** Clear images (call on page unmount) */
  clear(): void {
    _images = [];
    _listeners.forEach((fn) => fn());
  },
};
