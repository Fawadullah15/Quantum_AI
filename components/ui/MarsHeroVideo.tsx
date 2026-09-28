'use client';

import React, { useRef, useEffect, useState } from 'react';

export default function MarsHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force required attributes for mobile & desktop autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const tryPlay = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked by browser policy (e.g. low power mode)
            // Retry on first user interaction
            setIsPlaying(false);
          });
      }
    };

    tryPlay();

    // Event listeners to ensure continuous playback
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      // If paused unexpectedly, attempt to resume
      tryPlay();
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', tryPlay);

    // One-time fallback gesture listeners for stubborn mobile browsers
    const onUserInteraction = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });
    window.addEventListener('pointerdown', onUserInteraction, { passive: true, once: true });
    window.addEventListener('scroll', onUserInteraction, { passive: true, once: true });

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', tryPlay);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('pointerdown', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: '#020708',
      }}
    >
      <style>{`
        .mars-hero-video {
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: right center;
          transition: opacity 0.5s ease-in-out;
        }

        /* Tablet responsive adjustment */
        @media (max-width: 1024px) {
          .mars-hero-video {
            object-position: 85% center;
          }
        }

        /* Mobile responsive adjustment */
        @media (max-width: 640px) {
          .mars-hero-video {
            object-position: 72% 25%;
            opacity: 0.85;
          }
          .mars-hero-vignette-mobile {
            background: linear-gradient(
              180deg,
              rgba(2, 7, 8, 0.4) 0%,
              rgba(2, 7, 8, 0.75) 40%,
              rgba(2, 7, 8, 0.95) 100%
            ) !important;
          }
        }
      `}</style>

      {/* Video element with fast poster fallback and dual sources */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/mars-poster.png"
        className="mars-hero-video"
      >
        <source src="/Mars_Rotation.mp4" type="video/mp4" />
        <source
          src="https://sxcontent9668.azureedge.us/cms-assets/assets/Mars_Rotation_Web_HB_d96299f9de.mp4"
          type="video/mp4"
        />
      </video>

      {/* Desktop Deep Space Void Vignette: ensures headline & buttons on the left have pure contrast */}
      <div
        className="mars-hero-vignette-desktop"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, #020708 0%, rgba(2, 7, 8, 0.95) 28%, rgba(2, 7, 8, 0.6) 55%, rgba(2, 7, 8, 0.05) 80%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Mobile-specific protective overlay */}
      <div
        className="mars-hero-vignette-mobile"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Top Navbar dissolve */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: 'linear-gradient(180deg, #020708 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom dissolve into next section */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '240px',
          background: 'linear-gradient(0deg, #020708 0%, rgba(2, 7, 8, 0.85) 45%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
