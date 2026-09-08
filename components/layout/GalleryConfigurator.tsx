'use client';

import { useEffect } from 'react';
import { galleryStore } from '@/lib/gallery-state';

interface GalleryConfiguratorProps {
  images: string[];
  slug?: string;
}

/**
 * Invisible client component that writes the current project gallery images
 * into the module-level galleryStore (not React context).
 *
 * Using a module-level store rather than React context ensures the images
 * reach DigitalGallery inside the R3F Canvas regardless of render tree
 * boundaries.
 */
export function GalleryConfigurator({ images, slug }: GalleryConfiguratorProps) {
  useEffect(() => {
    // Normalize and deduplicate, preserving order
    const seen = new Set<string>();
    const sanitized: string[] = [];
    for (const url of images) {
      if (typeof url === 'string') {
        const trimmed = url.trim();
        if (trimmed.length > 0 && !seen.has(trimmed)) {
          seen.add(trimmed);
          sanitized.push(trimmed);
        }
      }
    }

    galleryStore.set(sanitized);

    // Cleanup: clear when leaving this project page
    return () => {
      galleryStore.clear();
    };
  // Re-run only when the actual serialized images or slug change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(images), slug]);

  return null;
}

export default GalleryConfigurator;
