'use client';

import { useEffect, useMemo } from 'react';
import { useGlobalStore } from './GlobalStore';

interface GalleryConfiguratorProps {
  images: string[];
  slug?: string;
}

/**
 * Invisible client dispatcher that syncs a project's gallery images
 * into the GlobalStore for the 3D scene (DigitalGallery), and cleans
 * them up when the project page unmounts or navigates.
 */
export function GalleryConfigurator({ images, slug }: GalleryConfiguratorProps) {
  const { setActiveGalleryImages } = useGlobalStore();

  // Normalize, filter, and deduplicate while preserving original order
  const sanitizedImages = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    for (const url of images) {
      if (typeof url === 'string') {
        const trimmed = url.trim();
        if (trimmed.length > 0 && !seen.has(trimmed)) {
          seen.add(trimmed);
          list.push(trimmed);
        }
      }
    }
    return list;
  }, [images]);

  // Serialized key to avoid re-triggering the effect unless image URLs actually change
  const serialized = useMemo(() => JSON.stringify(sanitizedImages), [sanitizedImages]);

  useEffect(() => {
    setActiveGalleryImages(sanitizedImages);

    return () => {
      setActiveGalleryImages([]);
    };
  }, [serialized, slug, setActiveGalleryImages]);

  return null;
}

export default GalleryConfigurator;
