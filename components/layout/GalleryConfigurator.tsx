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

    console.log('[GalleryConfigurator] Mounting with slug:', slug);
    console.log('[GalleryConfigurator] Input images:', images);
    console.log('[GalleryConfigurator] Setting sanitized:', sanitized);

    galleryStore.set(sanitized);

    // Cleanup: temporarily disabled to ensure React 18 Strict Mode double-invoke 
    // isn't accidentally leaving the store empty.
    return () => {
      console.log('[GalleryConfigurator] Unmounting for slug:', slug);
      // galleryStore.clear(); // Disabled for isolation test
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(images), slug]);

  return null;
}


export default GalleryConfigurator;
