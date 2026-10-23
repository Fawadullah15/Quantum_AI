'use client';

import React from 'react';
import { Skeleton, SkeletonFeedItem, SkeletonCard } from '@/components/ui/Skeleton';

/**
 * Public Route Loading State
 * Displays a Facebook/Instagram-style animated shimmer skeleton
 * whenever the website is loading or the connection is slow.
 */
export default function PublicLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#020708',
        color: '#FFFFFF',
        paddingTop: 'calc(var(--nav-height, 72px) + 2rem)',
        paddingBottom: '5rem',
        paddingInline: 'clamp(1.25rem, 5vw, 4rem)',
        position: 'relative',
        zIndex: 5,
        overflowX: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Top Hero Skeleton Area */}
        <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton variant="text" width="140px" height="14px" borderRadius="4px" style={{ opacity: 0.6 }} />
          <Skeleton variant="text" width="90%" height="48px" borderRadius="10px" />
          <Skeleton variant="text" width="70%" height="48px" borderRadius="10px" />
          <Skeleton variant="text" width="85%" height="18px" borderRadius="6px" style={{ opacity: 0.5, marginTop: '0.5rem' }} />
          <Skeleton variant="text" width="60%" height="18px" borderRadius="6px" style={{ opacity: 0.5 }} />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Skeleton width="160px" height="44px" borderRadius="8px" />
            <Skeleton width="140px" height="44px" borderRadius="8px" style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* Facebook / Instagram Feed Style Skeleton List (Matches user reference) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 600 }}>
          <SkeletonFeedItem />
          <SkeletonFeedItem />
          <SkeletonFeedItem />
        </div>

        {/* Showcase Grid Skeletons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1.5rem',
          }}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
