'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  getStoredConsent,
  saveConsent,
  OPEN_PREFERENCES_EVENT,
  type ConsentPreferences,
} from '@/lib/consent';

export function CookieConsent() {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Preference state inside modal
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Initialize from storage on client mount
  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setShowBanner(true);
    } else {
      setAnalyticsEnabled(stored.analytics);
      setMarketingEnabled(stored.marketing);
    }
    setHasLoaded(true);

    // Listen for custom open event (e.g. from footer link or policy page)
    const handleOpen = () => {
      triggerRef.current = document.activeElement as HTMLElement;
      const current = getStoredConsent();
      if (current) {
        setAnalyticsEnabled(current.analytics);
        setMarketingEnabled(current.marketing);
      }
      setShowModal(true);
      setShowBanner(false);
    };

    window.addEventListener(OPEN_PREFERENCES_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, handleOpen);
  }, []);

  // Handle ESC key inside modal
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Focus management when modal opens
  useEffect(() => {
    if (showModal && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [showModal]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    // If no consent has been given at all, restore the banner
    if (!getStoredConsent()) {
      setShowBanner(true);
    }
    // Return focus to triggering element
    if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
      triggerRef.current.focus();
    }
  }, []);

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
    setAnalyticsEnabled(true);
    setMarketingEnabled(true);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleRejectOptional = () => {
    saveConsent({ analytics: false, marketing: false });
    setAnalyticsEnabled(false);
    setMarketingEnabled(false);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    saveConsent({ analytics: analyticsEnabled, marketing: marketingEnabled });
    setShowBanner(false);
    setShowModal(false);
  };

  const openCustomizeModal = () => {
    setShowBanner(false);
    setShowModal(true);
  };

  if (!hasLoaded) {
    return null;
  }

  return (
    <>
      {/* 1. Sleek, Compact Cookie Notification (Non-Intrusive) */}
      {showBanner && !showModal && (
        <aside
          role="region"
          aria-label="Cookie preferences"
          className="qa-cookie-banner"
        >
          {/* Header with teal indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#14B8A6',
                  boxShadow: '0 0 8px #14B8A6',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-d-din)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  color: '#14B8A6',
                  textTransform: 'uppercase',
                }}
              >
                Cookie Preferences
              </span>
            </div>
            <button
              type="button"
              onClick={handleRejectOptional}
              aria-label="Dismiss cookie notice with essential only"
              title="Decline optional cookies"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.45)',
                cursor: 'pointer',
                padding: '0.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                lineHeight: 1,
                borderRadius: '4px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)')}
            >
              ✕
            </button>
          </div>

          {/* Concise explanation */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              lineHeight: 1.45,
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 0.75rem 0',
            }}
          >
            We use essential and performance cookies to optimize site systems. View our{' '}
            <Link
              href="/cookies"
              style={{ color: '#14B8A6', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              Cookie Policy
            </Link>
            .
          </p>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <button
              type="button"
              onClick={handleAcceptAll}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                fontFamily: 'var(--font-d-din)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#030712',
                backgroundColor: '#14B8A6',
                border: '1px solid #14B8A6',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2DD4BF')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14B8A6')}
            >
              Accept
            </button>

            <button
              type="button"
              onClick={handleRejectOptional}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.72rem',
                fontWeight: 500,
                fontFamily: 'var(--font-d-din)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.85)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
            >
              Decline
            </button>

            <button
              type="button"
              onClick={openCustomizeModal}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 500,
                fontFamily: 'var(--font-d-din)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#14B8A6',
                backgroundColor: 'transparent',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                borderRadius: '5px',
                cursor: 'pointer',
                marginLeft: 'auto',
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.1)';
                e.currentTarget.style.borderColor = '#14B8A6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.35)';
              }}
            >
              Settings
            </button>
          </div>
        </aside>
      )}

      {/* 2. Preferences Modal Dialog */}
      {showModal && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            backgroundColor: 'rgba(3, 7, 18, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
            aria-describedby="cookie-modal-desc"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#0A0F1D',
              border: '1px solid rgba(20, 184, 166, 0.35)',
              borderRadius: '14px',
              padding: '1.5rem',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(20, 184, 166, 0.15)',
              animation: 'scaleIn 0.2s ease-out forwards',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.85rem',
              }}
            >
              <div>
                <h2
                  id="cookie-modal-title"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: '#FFFFFF',
                    margin: '0 0 0.2rem 0',
                  }}
                >
                  Cookie &amp; Storage Preferences
                </h2>
                <p
                  id="cookie-modal-desc"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.78rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  Choose which data categories you allow. Strictly necessary technologies are required for basic security and site stability.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close cookie settings dialog"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  lineHeight: 1,
                  borderRadius: '6px',
                  transition: 'color 0.2s, background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            </div>

            {/* Storage Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {/* Category 1: Strictly Necessary */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#FFFFFF',
                      }}
                    >
                      Strictly Necessary Storage
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '0.12rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(20, 184, 166, 0.15)',
                        color: '#14B8A6',
                        fontFamily: 'var(--font-d-din)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Always Active
                    </span>
                  </div>

                  <span
                    aria-label="Strictly necessary storage is always active"
                    style={{
                      display: 'inline-block',
                      width: '38px',
                      height: '20px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(20, 184, 166, 0.4)',
                      position: 'relative',
                      opacity: 0.8,
                      cursor: 'not-allowed',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#14B8A6',
                      }}
                    />
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                    color: 'rgba(255, 255, 255, 0.68)',
                    margin: 0,
                  }}
                >
                  Essential for website security, CSRF defense, administrative authentication, audio state, and recording your privacy preferences.
                </p>
              </div>

              {/* Category 2: Performance & Analytics */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    Performance &amp; Analytics
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    aria-label="Toggle performance and analytics storage"
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    style={{
                      width: '40px',
                      height: '22px',
                      borderRadius: '11px',
                      backgroundColor: analyticsEnabled ? '#14B8A6' : 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      outline: 'none',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: analyticsEnabled ? '21px' : '3px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      }}
                    />
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                    color: 'rgba(255, 255, 255, 0.68)',
                    margin: 0,
                  }}
                >
                  Measures anonymous impression and interaction telemetry for engineering announcements (<code>/api/campaigns/track</code>). No third-party profiling.
                </p>
              </div>

              {/* Category 3: Marketing & Campaigns */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    Marketing &amp; Attribution
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={marketingEnabled}
                    aria-label="Toggle marketing storage"
                    onClick={() => setMarketingEnabled(!marketingEnabled)}
                    style={{
                      width: '40px',
                      height: '22px',
                      borderRadius: '11px',
                      backgroundColor: marketingEnabled ? '#14B8A6' : 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      outline: 'none',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: marketingEnabled ? '21px' : '3px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      }}
                    />
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                    color: 'rgba(255, 255, 255, 0.68)',
                    margin: 0,
                  }}
                >
                  Used if we run partner attribution or sponsor campaigns. When disabled, promotional conversion signals are not recorded.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.65rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '1rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleRejectOptional}
                  style={{
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-d-din)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                >
                  Decline Optional
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  style={{
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-d-din)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#14B8A6',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(20, 184, 166, 0.4)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Accept All
                </button>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                style={{
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-d-din)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#030712',
                  backgroundColor: '#14B8A6',
                  border: '1px solid #14B8A6',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2DD4BF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14B8A6')}
              >
                Save Choices
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .qa-cookie-banner {
          position: fixed;
          bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
          left: calc(1.5rem + env(safe-area-inset-left, 0px));
          width: 350px;
          max-width: calc(100vw - 2.5rem);
          z-index: 9998;
          background: rgba(8, 14, 26, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(20, 184, 166, 0.25);
          border-radius: 12px;
          box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.75), 0 0 20px rgba(20, 184, 166, 0.08);
          padding: 0.9rem 1.1rem;
          color: #FFFFFF;
          animation: cookieFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 640px) {
          .qa-cookie-banner {
            bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
            left: 1rem;
            right: 1rem;
            width: auto;
            max-width: none;
            padding: 0.85rem 1rem;
          }
        }

        @keyframes cookieFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
