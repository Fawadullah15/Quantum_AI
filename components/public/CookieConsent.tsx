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
      {/* 1. Cookie Notice Banner */}
      {showBanner && !showModal && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            left: '1.25rem',
            right: '1.25rem',
            maxWidth: '680px',
            margin: '0 auto',
            zIndex: 9998,
            backgroundColor: 'rgba(10, 15, 29, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(20, 184, 166, 0.1)',
            padding: '1.25rem 1.5rem',
            color: '#FFFFFF',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#14B8A6',
                    boxShadow: '0 0 8px #14B8A6',
                  }}
                />
                <h2
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: '#FFFFFF',
                    margin: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  Privacy & Cookie Preferences
                </h2>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.55,
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: 0,
                }}
              >
                Quantum AI uses strictly necessary storage for system security, audio preferences, and announcement delivery.
                Optional analytics measure anonymous campaign interactions to help us improve our engineering communications.
                Read our{' '}
                <Link
                  href="/cookies"
                  style={{ color: '#14B8A6', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  Cookie Policy
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  style={{ color: '#14B8A6', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {/* Banner Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                alignSelf: 'center',
              }}
            >
              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-d-din)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#030712',
                  backgroundColor: '#14B8A6',
                  border: '1px solid #14B8A6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2DD4BF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14B8A6')}
              >
                Accept All
              </button>

              <button
                type="button"
                onClick={handleRejectOptional}
                style={{
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-d-din)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              >
                Reject Optional
              </button>

              <button
                type="button"
                onClick={openCustomizeModal}
                style={{
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-d-din)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#14B8A6',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(20, 184, 166, 0.4)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.1)';
                  e.currentTarget.style.borderColor = '#14B8A6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.4)';
                }}
              >
                Customize
              </button>
            </div>
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
            backgroundColor: 'rgba(3, 7, 18, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#0A0F1D',
              border: '1px solid rgba(20, 184, 166, 0.35)',
              borderRadius: '14px',
              padding: '1.75rem',
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
                paddingBottom: '1rem',
              }}
            >
              <div>
                <h2
                  id="cookie-modal-title"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    color: '#FFFFFF',
                    margin: '0 0 0.25rem 0',
                  }}
                >
                  Cookie & Storage Settings
                </h2>
                <p
                  id="cookie-modal-desc"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8125rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Customize how Quantum AI stores information on your device. Strictly necessary technologies cannot be disabled as they are required for basic site operations.
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
                  fontSize: '1.25rem',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
              {/* Category 1: Strictly Necessary */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: '#FFFFFF',
                      }}
                    >
                      Strictly Necessary Storage
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.15rem 0.45rem',
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
                      width: '42px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(20, 184, 166, 0.4)',
                      position: 'relative',
                      opacity: 0.8,
                      cursor: 'not-allowed',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#14B8A6',
                      }}
                    />
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0,
                  }}
                >
                  Essential for website security, CSRF protection, admin authentication sessions (<code>next-auth</code>), audio toggle state, announcement dismissal tracking, and recording your privacy preferences.
                </p>
              </div>

              {/* Category 2: Performance & Analytics */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    Performance & Analytics
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    aria-label="Toggle performance and analytics storage"
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
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
                        left: analyticsEnabled ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
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
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0,
                  }}
                >
                  Measures anonymous impression and interaction telemetry for engineering announcements (<code>/api/campaigns/track</code>). No third-party behavioral profiling or cross-site tracking scripts are loaded.
                </p>
              </div>

              {/* Category 3: Marketing & Campaigns */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    Marketing & Conversion Attribution
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={marketingEnabled}
                    aria-label="Toggle marketing storage"
                    onClick={() => setMarketingEnabled(!marketingEnabled)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
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
                        left: marketingEnabled ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
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
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0,
                  }}
                >
                  Used if we run partner attribution or sponsor campaigns. When disabled, promotional campaign telemetry and conversion signals will not be recorded.
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
                gap: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleRejectOptional}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-d-din)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                >
                  Reject All Optional
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-d-din)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#14B8A6',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(20, 184, 166, 0.4)',
                    borderRadius: '6px',
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
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-d-din)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#030712',
                  backgroundColor: '#14B8A6',
                  border: '1px solid #14B8A6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2DD4BF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14B8A6')}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
