'use client';

import React, { useRef, useEffect, useState } from 'react';

const DESKTOP_LOCAL = '/Mars_Rotation.mp4';
const DESKTOP_CDN = 'https://sxcontent9668.azureedge.us/cms-assets/assets/Mars_Rotation_Web_HB_d96299f9de.mp4';
const DESKTOP_POSTER = '/mars-poster.png';

const MOBILE_LOCAL = '/Mobile_Mars.mp4';
const MOBILE_CDN = 'https://sxcontent9668.azureedge.us/cms-assets/assets/Mobile_v4_HB_e1d2eda88f.mp4';
const MOBILE_POSTER = '/mars-mobile-poster.png';

export default function MarsHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Detect mobile viewport (<= 768px)
    const mql = window.matchMedia('(max-width: 768px)');
    const initialMobile = mql.matches;
    setIsMobile(initialMobile);

    // Force required attributes for mobile & desktop autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // Synchronize active source if browser mis-evaluated media queries on initial load
    const syncSourceForDevice = (mobileActive: boolean) => {
      const current = video.currentSrc || '';
      const isCurrentlyMobile = current.includes('Mobile_Mars') || current.includes('Mobile_v4_HB');
      const isCurrentlyDesktop = current.includes('Mars_Rotation');

      if (current) {
        if (!mobileActive && isCurrentlyMobile) {
          video.src = DESKTOP_LOCAL;
          video.poster = DESKTOP_POSTER;
          video.load();
        } else if (mobileActive && isCurrentlyDesktop) {
          video.src = MOBILE_LOCAL;
          video.poster = MOBILE_POSTER;
          video.load();
        }
      }
    };

    const tryPlay = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked by browser policy (e.g. low power mode)
            setIsPlaying(false);
          });
      }
    };

    syncSourceForDevice(initialMobile);
    tryPlay();

    // Event listeners to ensure continuous playback
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      tryPlay();
    };

    // If local video fails to load, gracefully fall back to Azure edge CDN
    const onError = () => {
      const isNowMobile = window.matchMedia('(max-width: 768px)').matches;
      const cdnUrl = isNowMobile ? MOBILE_CDN : DESKTOP_CDN;
      if (video.src !== cdnUrl) {
        video.src = cdnUrl;
        video.load();
        video.play().catch(() => {});
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', tryPlay);
    video.addEventListener('error', onError);

    // One-time fallback gesture listeners for mobile phones (low power mode / battery saver)
    const onUserInteraction = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });
    window.addEventListener('pointerdown', onUserInteraction, { passive: true, once: true });
    window.addEventListener('scroll', onUserInteraction, { passive: true, once: true });

    // Handle viewport changes (e.g. screen rotation or desktop window resize)
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const mobileActive = e.matches;
      setIsMobile(mobileActive);
      video.poster = mobileActive ? MOBILE_POSTER : DESKTOP_POSTER;
      syncSourceForDevice(mobileActive);
      video.load();
      video.play().catch(() => {});
    };

    mql.addEventListener('change', handleMediaChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', tryPlay);
      video.removeEventListener('error', onError);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('pointerdown', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
      mql.removeEventListener('change', handleMediaChange);
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

        /* Tablet responsive adjustment (769px to 1024px) */
        @media (max-width: 1024px) and (min-width: 769px) {
          .mars-hero-video {
            object-position: 85% center;
          }
        }

        /* Mobile phones responsive adjustment (<= 768px) */
        @media (max-width: 768px) {
          .mars-hero-video {
            object-position: 38% center;
            opacity: 0.90;
          }
          .mars-hero-vignette-desktop {
            display: none !important;
          }
          .mars-hero-vignette-mobile {
            display: block !important;
            background: linear-gradient(
              180deg,
              rgba(2, 7, 8, 0.35) 0%,
              rgba(2, 7, 8, 0.65) 40%,
              rgba(2, 7, 8, 0.92) 80%,
              #020708 100%
            ) !important;
          }
        }

        @media (min-width: 769px) {
          .mars-hero-vignette-mobile {
            display: none !important;
          }
        }
      `}</style>

      {/* Video element with fast poster fallback and dual sources for mobile & desktop */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={isMobile ? MOBILE_POSTER : DESKTOP_POSTER}
        className="mars-hero-video"
      >
        {/* Mobile sources (loaded when screen <= 768px) */}
        <source
          src={MOBILE_LOCAL}
          type="video/mp4"
          media="(max-width: 768px)"
        />
        <source
          src={MOBILE_CDN}
          type="video/mp4"
          media="(max-width: 768px)"
        />

        {/* Desktop sources (loaded when screen > 768px) */}
        <source
          src={DESKTOP_LOCAL}
          type="video/mp4"
          media="(min-width: 769px)"
        />
        <source
          src={DESKTOP_CDN}
          type="video/mp4"
          media="(min-width: 769px)"
        />

        {/* Fallback default source */}
        <source src={DESKTOP_LOCAL} type="video/mp4" />
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
