'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PublicCampaign } from '@/lib/campaigns';

interface CampaignDisplayProps {
  campaign?: PublicCampaign | null;
  previewMode?: boolean;
  onPreviewClose?: () => void;
  previewDevice?: 'desktop' | 'mobile';
}

export function CampaignDisplay({
  campaign: initialCampaign,
  previewMode = false,
  onPreviewClose,
  previewDevice = 'desktop',
}: CampaignDisplayProps) {
  const [campaign, setCampaign] = useState<PublicCampaign | null>(initialCampaign || null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(0);
  const hasTrackedImpressionRef = useRef(false);

  // Sync prop changes (especially for preview mode)
  useEffect(() => {
    setCampaign(initialCampaign || null);
  }, [initialCampaign]);

  // Client-side hydration: Query /api/campaigns/active on mount
  // Ensures newly published campaigns display immediately even if the parent page/layout was cached by CDN
  useEffect(() => {
    if (previewMode) return;

    let isMounted = true;
    fetch('/api/campaigns/active', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.campaign) {
          setCampaign(data.campaign);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [previewMode]);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Determine eligibility and open popup
  useEffect(() => {
    if (!campaign) {
      setIsVisible(false);
      return;
    }

    if (previewMode) {
      setIsVisible(true);
      setIsDismissed(false);
      setProgress(100);
      return;
    }

    // Check repeat policy stored in browser
    try {
      const storageKey = `qa_cmp_${campaign.id}_${campaign.updatedAt || 'v1'}`;

      if (campaign.repeatPolicy === 'SESSION') {
        const dismissedInSession = sessionStorage.getItem(storageKey);
        if (dismissedInSession) return;
      } else if (campaign.repeatPolicy === 'ONCE_PERSISTENT') {
        const dismissedInLocal = localStorage.getItem(storageKey);
        if (dismissedInLocal) return;
      } else if (campaign.repeatPolicy === 'COOLDOWN') {
        const lastSeenStr = localStorage.getItem(`qa_cmp_seen_${campaign.id}`);
        if (lastSeenStr) {
          const lastSeen = parseInt(lastSeenStr, 10);
          const cooldownMs = (campaign.cooldownMinutes || 1440) * 60 * 1000;
          if (Date.now() - lastSeen < cooldownMs) return;
        }
      }

      // Small delay on first paint so page is ready and layout is stable
      const openTimer = setTimeout(() => {
        setIsVisible(true);

        // Record cooldown timestamp
        if (campaign.repeatPolicy === 'COOLDOWN') {
          try {
            localStorage.setItem(`qa_cmp_seen_${campaign.id}`, Date.now().toString());
          } catch {}
        }
      }, 350);

      return () => clearTimeout(openTimer);
    } catch {
      // If storage restricted, show once safely
      setIsVisible(true);
    }
  }, [campaign, previewMode]);

  // Track impression once visible
  useEffect(() => {
    if (isVisible && campaign && !previewMode && !hasTrackedImpressionRef.current) {
      hasTrackedImpressionRef.current = true;
      try {
        fetch('/api/campaigns/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id, event: 'impression' }),
        }).catch(() => {});
      } catch {}
    }
  }, [isVisible, campaign, previewMode]);

  // Handle countdown timer & progress line
  const durationMs = (campaign?.dismissDuration || 5) * 1000;

  const startTimer = useCallback((duration: number) => {
    if (!campaign?.autoDismiss || previewMode) return;

    startTimeRef.current = Date.now();
    remainingTimeRef.current = duration;

    // Interval for smooth progress line (updates every 50ms)
    const updateInterval = 50;
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const pct = (remaining / durationMs) * 100;
      setProgress(pct);

      if (remaining <= 0) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, updateInterval);

    // Timeout for closing
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);
  }, [campaign?.autoDismiss, durationMs, previewMode]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    timerRef.current = null;
    progressIntervalRef.current = null;
  }, []);

  // Launch timer when visible
  useEffect(() => {
    if (isVisible && !isDismissed && campaign?.autoDismiss && !previewMode) {
      startTimer(durationMs);
    }
    return () => clearTimers();
  }, [isVisible, isDismissed, campaign?.autoDismiss, durationMs, previewMode, startTimer, clearTimers]);

  // Pause on mouse enter, resume on mouse leave
  const handleMouseEnter = () => {
    if (!campaign?.autoDismiss || previewMode || isDismissed) return;
    setIsPaused(true);
    clearTimers();
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    if (!campaign?.autoDismiss || previewMode || isDismissed) return;
    setIsPaused(false);
    if (remainingTimeRef.current > 0) {
      startTimer(remainingTimeRef.current);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    clearTimers();
    setIsVisible(false);
    setIsDismissed(true);

    if (previewMode) {
      onPreviewClose?.();
      return;
    }

    if (!campaign) return;

    try {
      const storageKey = `qa_cmp_${campaign.id}_${campaign.updatedAt || 'v1'}`;
      if (campaign.repeatPolicy === 'SESSION') {
        sessionStorage.setItem(storageKey, '1');
      } else if (campaign.repeatPolicy === 'ONCE_PERSISTENT') {
        localStorage.setItem(storageKey, '1');
      }
    } catch {}
  };

  // Track click telemetry
  const handleCtaClick = () => {
    if (!campaign || previewMode) return;
    try {
      fetch('/api/campaigns/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, event: 'click' }),
      }).catch(() => {});
    } catch {}
  };

  if (!campaign || !isVisible || isDismissed) {
    return null;
  }

  // Display creative image (mobile or desktop)
  const displayImage = (previewDevice === 'mobile' && campaign.mobileImageUrl)
    ? campaign.mobileImageUrl
    : campaign.imageUrl;

  // Position styles
  const isBanner = campaign.type === 'PROMOTIONAL_BANNER' || campaign.displayPosition === 'TOP_BANNER';
  const isCompact = campaign.type === 'COMPACT_NOTIFICATION';
  const isImageOnly = campaign.type === 'IMAGE_ONLY';

  // Desktop vs Mobile preview styling
  const isPreviewMobile = previewMode && previewDevice === 'mobile';

  // Position wrapper styles
  const getContainerStyle = (): React.CSSProperties => {
    if (previewMode) {
      return {
        width: '100%',
        maxWidth: isPreviewMobile ? '360px' : isBanner ? '100%' : isCompact ? '460px' : '480px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
      };
    }

    if (isBanner) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 9998,
      };
    }

    // Default positioning for popups
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      maxWidth: 'calc(100vw - 2rem)',
      width: isCompact ? '440px' : '440px',
    };

    switch (campaign.displayPosition) {
      case 'TOP_CENTER':
        return {
          ...base,
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'BOTTOM_RIGHT':
        return {
          ...base,
          bottom: '24px',
          right: '24px',
        };
      case 'TOP_RIGHT':
      default:
        return {
          ...base,
          top: '84px',
          right: '24px',
        };
    }
  };

  return (
    <aside
      aria-label="Quantum AI Announcement"
      role="status"
      style={getContainerStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`qa-campaign-container ${prefersReducedMotion ? 'no-motion' : 'animate-in'}`}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: 'rgba(5, 12, 14, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(103, 232, 249, 0.22)',
          borderRadius: isBanner ? '0px' : '14px',
          boxShadow: isBanner
            ? '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(20, 184, 166, 0.12)'
            : '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(103, 232, 249, 0.15)',
          overflow: 'hidden',
          transition: prefersReducedMotion ? 'none' : 'border-color 0.25s ease, box-shadow 0.25s ease',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          color: '#F0FDFA',
        }}
      >
        {/* Countdown Progress Line */}
        {campaign.showProgress && campaign.autoDismiss && !isCompact && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              zIndex: 20,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #14B8A6 0%, #67E8F9 100%)',
                boxShadow: '0 0 8px #67E8F9',
                transition: prefersReducedMotion || isPaused ? 'none' : 'width 0.05s linear',
              }}
            />
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          aria-label="Close announcement"
          style={{
            position: 'absolute',
            top: isBanner ? '50%' : '10px',
            right: '12px',
            transform: isBanner ? 'translateY(-50%)' : 'none',
            zIndex: 30,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(2, 7, 8, 0.75)',
            border: '1px solid rgba(103, 232, 249, 0.3)',
            color: '#67E8F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s, color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.color = '#F87171';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(2, 7, 8, 0.75)';
            e.currentTarget.style.color = '#67E8F9';
            e.currentTarget.style.borderColor = 'rgba(103, 232, 249, 0.3)';
          }}
        >
          ✕
        </button>

        {/* ── FORMAT 1: PROMOTIONAL BANNER ── */}
        {isBanner ? (
          <div
            style={{
              padding: '0.75rem 3.5rem 0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              minHeight: '48px',
            }}
          >
            {campaign.badge && (
              <span
                style={{
                  backgroundColor: 'rgba(20, 184, 166, 0.2)',
                  border: '1px solid #14B8A6',
                  color: '#67E8F9',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {campaign.badge}
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {campaign.headline && (
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 600 }}>
                  {campaign.headline}
                </strong>
              )}
              {campaign.description && (
                <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                  {campaign.description}
                </span>
              )}
            </div>

            {campaign.destinationUrl && campaign.ctaLabel && (
              <Link
                href={campaign.destinationUrl}
                target={campaign.openInNewTab ? '_blank' : '_self'}
                rel={campaign.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={handleCtaClick}
                style={{
                  backgroundColor: '#14B8A6',
                  color: '#020708',
                  padding: '0.35rem 0.95rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono, monospace)',
                  transition: 'background-color 0.2s',
                }}
              >
                {campaign.ctaLabel} →
              </Link>
            )}
          </div>
        ) : isCompact ? (
          /* ── FORMAT 2: COMPACT NOTIFICATION ── */
          <div
            style={{
              padding: '0.9rem 2.75rem 0.9rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '1rem',
              }}
            >
              📢
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                {campaign.badge && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: '#67E8F9',
                      letterSpacing: '0.08em',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    [{campaign.badge}]
                  </span>
                )}
                {campaign.headline && (
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {campaign.headline}
                  </h4>
                )}
              </div>
              {campaign.description && (
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {campaign.description}
                </p>
              )}
            </div>

            {campaign.destinationUrl && (
              <Link
                href={campaign.destinationUrl}
                target={campaign.openInNewTab ? '_blank' : '_self'}
                rel={campaign.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={handleCtaClick}
                style={{
                  fontSize: '0.78rem',
                  color: '#67E8F9',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono, monospace)',
                  flexShrink: 0,
                }}
              >
                {campaign.ctaLabel || 'View'} →
              </Link>
            )}
          </div>
        ) : isImageOnly ? (
          /* ── FORMAT 3: IMAGE ONLY CAMPAIGN ── */
          <div>
            {campaign.destinationUrl ? (
              <Link
                href={campaign.destinationUrl}
                target={campaign.openInNewTab ? '_blank' : '_self'}
                rel={campaign.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={handleCtaClick}
                style={{ display: 'block', position: 'relative', width: '100%', aspectRatio: '16/9' }}
              >
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={campaign.imageAlt || 'Advertisement'}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    style={{ objectFit: 'cover' }}
                    unoptimized={true}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#071214', color: '#67E8F9' }}>
                    Visual Creative
                  </div>
                )}
              </Link>
            ) : (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={campaign.imageAlt || 'Advertisement'}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    style={{ objectFit: 'cover' }}
                    unoptimized={true}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#071214', color: '#67E8F9' }}>
                    Visual Creative
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── FORMAT 4 & 5: IMAGE POPUP & ANNOUNCEMENT POPUP ── */
          <div>
            {/* Optional Creative Visual Header */}
            {displayImage && campaign.type === 'IMAGE_POPUP' && (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#020708' }}>
                {campaign.destinationUrl ? (
                  <Link
                    href={campaign.destinationUrl}
                    target={campaign.openInNewTab ? '_blank' : '_self'}
                    rel={campaign.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={handleCtaClick}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                  >
                    <Image
                      src={displayImage}
                      alt={campaign.imageAlt || campaign.headline || 'Announcement'}
                      fill
                      sizes="(max-width: 640px) 100vw, 480px"
                      style={{ objectFit: 'cover' }}
                      unoptimized={true}
                    />
                  </Link>
                ) : (
                  <Image
                    src={displayImage}
                    alt={campaign.imageAlt || campaign.headline || 'Announcement'}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    style={{ objectFit: 'cover' }}
                    unoptimized={true}
                  />
                )}
              </div>
            )}

            {/* Content Body */}
            <div style={{ padding: '1.25rem 1.4rem' }}>
              {/* Category / Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                {campaign.badge && (
                  <span
                    style={{
                      backgroundColor: 'rgba(20, 184, 166, 0.15)',
                      border: '1px solid rgba(20, 184, 166, 0.35)',
                      color: '#67E8F9',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {campaign.badge}
                  </span>
                )}
                {campaign.type === 'ANNOUNCEMENT_POPUP' && (
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                    OFFICIAL TRANSMISSION
                  </span>
                )}
              </div>

              {/* Headline */}
              {campaign.headline && (
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: '0 0 0.45rem 0',
                    lineHeight: 1.35,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {campaign.headline}
                </h3>
              )}

              {/* Description */}
              {campaign.description && (
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: '#94A3B8',
                    lineHeight: 1.5,
                    margin: '0 0 0.85rem 0',
                  }}
                >
                  {campaign.description}
                </p>
              )}

              {/* Optional Supporting Text / Disclaimer */}
              {campaign.supportingText && (
                <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                  {campaign.supportingText}
                </p>
              )}

              {/* Action Button */}
              {campaign.destinationUrl && campaign.ctaLabel && (
                <div style={{ marginTop: '0.5rem' }}>
                  <Link
                    href={campaign.destinationUrl}
                    target={campaign.openInNewTab ? '_blank' : '_self'}
                    rel={campaign.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={handleCtaClick}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      backgroundColor: '#14B8A6',
                      color: '#020708',
                      padding: '0.5rem 1.15rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--font-mono, monospace)',
                      transition: 'background-color 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#67E8F9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#14B8A6';
                    }}
                  >
                    {campaign.ctaLabel} →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes qaCampaignSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .qa-campaign-container.animate-in {
          animation: qaCampaignSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .qa-campaign-container.no-motion {
          animation: none;
        }
      `}</style>
    </aside>
  );
}
