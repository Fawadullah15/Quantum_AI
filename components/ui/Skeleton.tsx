'use client';

import React, { useState } from 'react';

/**
 * Base Shimmer Skeleton
 * Renders a Facebook / Instagram style glowing animated skeleton placeholder.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width,
  height,
  borderRadius,
  variant = 'rectangular',
  className = '',
  style = {},
  ...props
}: SkeletonProps) {
  const getRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (variant === 'circular') return '50%';
    if (variant === 'text') return '4px';
    return '8px';
  };

  const getHeight = () => {
    if (height !== undefined) return height;
    if (variant === 'text') return '0.875rem';
    return '100%';
  };

  return (
    <div
      className={`qa-skeleton ${className}`}
      style={{
        width: width ?? '100%',
        height: getHeight(),
        borderRadius: getRadius(),
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Facebook / Instagram feed style skeleton item (matches user reference doodle)
 * Circular avatar on left + 2 text lines on right.
 */
export function SkeletonFeedItem({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`qa-skeleton-feed-item ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1rem',
        backgroundColor: 'rgba(7, 18, 20, 0.5)',
        border: '1px solid rgba(20, 184, 166, 0.1)',
        borderRadius: '10px',
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Avatar circle */}
      <Skeleton variant="circular" width="46px" height="46px" style={{ flexShrink: 0 }} />

      {/* Two text lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="65%" height="13px" borderRadius="6px" />
        <Skeleton variant="text" width="42%" height="10px" borderRadius="5px" style={{ opacity: 0.7 }} />
      </div>
    </div>
  );
}

/**
 * Full Leadership / Showcase Card Skeleton
 */
export function SkeletonCard({ aspectRatio = '1/1', style = {} }: { aspectRatio?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(7, 18, 20, 0.7)',
        border: '1px solid rgba(20, 184, 166, 0.15)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Photo Area Skeleton */}
      <div style={{ width: '100%', aspectRatio, position: 'relative' }}>
        <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
      </div>

      {/* Text Lines */}
      <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <Skeleton variant="text" width="70%" height="16px" borderRadius="6px" />
        <Skeleton variant="text" width="45%" height="11px" borderRadius="4px" style={{ opacity: 0.7 }} />
        <Skeleton variant="text" width="90%" height="12px" borderRadius="4px" style={{ opacity: 0.5, marginTop: '0.35rem' }} />
        <Skeleton variant="text" width="80%" height="12px" borderRadius="4px" style={{ opacity: 0.5 }} />
      </div>
    </div>
  );
}

/**
 * Rock-Solid Image With Automatic Skeleton Shimmer and Graceful Fallback Doodle
 */
export interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  badge?: string;
}

export function ImageWithSkeleton({
  src,
  alt,
  fallbackSrc,
  aspectRatio = '1/1',
  containerStyle = {},
  containerClassName = '',
  style = {},
  badge,
  ...props
}: ImageWithSkeletonProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // If prop changes, reset
  React.useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  return (
    <div
      className={`qa-image-container ${containerClassName}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        backgroundColor: '#020708',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...containerStyle,
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            fontFamily: 'var(--font-d-din)',
            fontSize: '0.58rem',
            letterSpacing: '0.15em',
            color: '#FFFFFF',
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(20, 184, 166, 0.35)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 600,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {badge}
        </div>
      )}

      {/* Shimmer skeleton while image is loading */}
      {isLoading && (
        <div
          className="qa-skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: 0,
            zIndex: 1,
          }}
        />
      )}

      {/* Actual image */}
      {!hasError ? (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 2,
            ...style,
          }}
          {...props}
        />
      ) : (
        /* Graceful Cybernetic Avatar Doodle when image cannot be loaded */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'radial-gradient(circle at center, #0B224E 0%, #030A17 100%)',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid rgba(103, 232, 249, 0.4)',
              background: 'rgba(7, 18, 20, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#67E8F9',
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-d-din)',
              boxShadow: '0 0 20px rgba(20, 184, 166, 0.25)',
            }}
          >
            {alt
              ? alt
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'QA'}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-d-din)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
            }}
          >
            {alt || 'QUANTUM AI'}
          </span>
        </div>
      )}
    </div>
  );
}
