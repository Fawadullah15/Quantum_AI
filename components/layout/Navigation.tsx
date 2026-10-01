'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ... (Rest of imports and types stay the same, removing framer-motion)

interface NavItem {
  label: string;
  href: string;
  hideOnDesktop?: boolean;
  dropdown?: { label: string; href: string; desc?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'Technology', href: '/technology' },
  { label: 'Products', href: '/products' },
  { label: 'Insights', href: '/insights' },
  { label: 'Leadership', href: '/leadership' },
  { label: 'Contact', href: '/contact', hideOnDesktop: true },
];

export function DesktopDropdown({ items, visible, onMouseEnter, onMouseLeave }: { items: { label: string; href: string; desc?: string }[], visible: boolean, onMouseEnter: () => void, onMouseLeave: () => void }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '8px'}) scale(${visible ? '1' : '0.97'})`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        marginTop: '0.75rem',
        width: '280px',
        background: '#040A10',
        borderRadius: 12,
        padding: '0.6rem',
        border: '1px solid rgba(20, 184, 166, 0.25)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(20, 184, 166, 0.1) inset',
        zIndex: 100,
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'block',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(15, 118, 110, 0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#FFFFFF', marginBottom: item.desc ? '0.2rem' : 0 }}>
            {item.label}
          </div>
          {item.desc && <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.desc}</div>}
        </Link>
      ))}
    </div>
  );
}

export default function Navigation({ companyName, ctaLabel, ctaLink }: { companyName?: string, ctaLabel?: string, ctaLink?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileAccordion(null);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleNavEnter = (href: string, hasDropdown: boolean) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setHoveredItem(href);
    if (hasDropdown) setDropdownOpen(href);
    else setDropdownOpen(null);
  };

  const handleNavLeave = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      setHoveredItem(null);
      setDropdownOpen(null);
    }, 150);
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          paddingTop: scrolled ? '0.5rem' : '1.5rem',
          paddingBottom: scrolled ? '0.5rem' : '1.5rem',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="main-navbar-container"
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            padding: '0 2rem',
            transition: 'padding 0.3s',
          }}
        >
          {/* Main Pill Wrapper */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '999px',
              backgroundColor: scrolled ? 'rgba(2, 7, 8, 0.85)' : 'rgba(2, 7, 8, 0.5)',
              backdropFilter: scrolled ? 'blur(20px)' : 'blur(10px)',
              WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(10px)',
              border: '1px solid rgba(20, 184, 166, 0.15)',
              boxShadow: scrolled ? '0 10px 40px -10px rgba(0, 0, 0, 0.5)' : 'none',
              padding: '0.45rem 0.5rem 0.45rem 1.2rem',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Spinning Edge Light (Pure CSS) */}
            <div className="liquid-edge-ring" style={{ position: 'absolute', inset: -1, borderRadius: 999, padding: 1, zIndex: -1, overflow: 'hidden' }}>
              <div className="liquid-gradient" />
            </div>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', position: 'relative', zIndex: 20 }}>
              <div id="navbar-quantum-logo" style={{ width: '22px', height: '22px', background: 'url(/quantum-q-logo.png) center/contain no-repeat' }} />
              <div className="nav-wordmark-text" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Quantum AI
              </div>
            </Link>

            {/* Desktop Center Links */}
            <nav className="nav-desktop-links" style={{ display: 'flex', gap: 'clamp(0.15rem, 0.35vw, 0.25rem)', alignItems: 'center', position: 'relative' }}>
              {NAV_ITEMS.filter((item) => !item.hideOnDesktop).map((item) => {
                const active = hoveredItem === item.href || (isActive(item.href) && hoveredItem === null);
                return (
                  <div key={item.href} style={{ position: 'relative' }} onMouseEnter={() => handleNavEnter(item.href, !!item.dropdown)} onMouseLeave={handleNavLeave}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      aria-haspopup={item.dropdown ? 'menu' : undefined}
                      style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.45rem clamp(0.55rem, 0.75vw, 0.85rem)',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 400,
                        color: active ? '#FFFFFF' : '#94A3B8',
                        textDecoration: 'none',
                        letterSpacing: '0.04em',
                        transition: 'color 0.2s',
                        outline: 'none',
                      }}
                    >
                      {item.label}
                      {item.dropdown && (
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.6, marginTop: '2px', transform: active ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </Link>
                    
                    {/* Hover Pill Replacement */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 999,
                        backgroundColor: 'rgba(15, 118, 110, 0.13)',
                        border: '1px solid rgba(15, 118, 110, 0.25)',
                        zIndex: 0,
                        boxShadow: '0 0 12px rgba(15, 118, 110, 0.15)',
                        opacity: active ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                      }}
                    />

                    {/* Dropdown */}
                    {item.dropdown && (
                      <DesktopDropdown
                        items={item.dropdown}
                        visible={dropdownOpen === item.href}
                        onMouseEnter={() => handleNavEnter(item.href, true)}
                        onMouseLeave={handleNavLeave}
                      />
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Desktop Right Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', position: 'relative', zIndex: 20 }}>
              <Link
                href="/careers-partnerships"
                className="nav-careers-btn"
                style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94A3B8', textDecoration: 'none', letterSpacing: '0.05em', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                CAREERS
              </Link>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} className="nav-careers-btn" />
              <Link
                href={ctaLink || '/contact'}
                className="nav-cta-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1.1rem', backgroundColor: '#FFFFFF', color: '#020708', borderRadius: 999, textDecoration: 'none', fontSize: '0.75rem', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.04em', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {ctaLabel || 'Start a Project'}
              </Link>

              {/* Mobile Hamburger */}
              <button
                className="nav-hamburger"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: mobileOpen ? 'auto' : 'none',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2, 7, 8, 0.8)',
            backdropFilter: 'blur(12px)',
            opacity: mobileOpen ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setMobileOpen(false)}
        />
        
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: '#040A10',
            borderBottom: '1px solid rgba(20, 184, 166, 0.2)',
            padding: '5rem 1.5rem 2rem 1.5rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            transform: mobileOpen ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Close inside drawer */}
          <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem' }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav aria-label="Mobile navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {NAV_ITEMS.map((item) => (
              <div key={item.href} style={{ borderBottom: '1px solid rgba(20, 184, 166, 0.08)' }}>
                <button
                  onClick={() => {
                    if (item.dropdown) {
                      setMobileAccordion(mobileAccordion === item.href ? null : item.href);
                    } else {
                      setMobileOpen(false);
                    }
                  }}
                  aria-expanded={item.dropdown ? mobileAccordion === item.href : undefined}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '1.125rem 0',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    fontSize: '1.05rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  {item.dropdown ? (
                    <span>{item.label}</span>
                  ) : (
                    <Link href={item.href} onClick={() => setMobileOpen(false)} style={{ color: 'inherit', textDecoration: 'none', width: '100%', display: 'block' }}>
                      {item.label}
                    </Link>
                  )}
                  {item.dropdown && (
                    <div style={{ color: '#FFFFFF', flexShrink: 0, marginLeft: '0.5rem', transform: mobileAccordion === item.href ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
                      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                        <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>

                {item.dropdown && (
                  <div
                    style={{
                      height: mobileAccordion === item.href ? 'auto' : 0,
                      opacity: mobileAccordion === item.href ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'height 0.3s ease, opacity 0.3s ease',
                      display: mobileAccordion === item.href ? 'block' : 'none' // Simplest way to handle height auto transition is actually not perfect in CSS without JS scrollHeight, but this works okay for a mobile accordion. Actually let's just leave it as block/none toggle to save complexity.
                    }}
                  >
                    <div style={{ paddingBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(20, 184, 166, 0.3)', marginLeft: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {item.dropdown.map((drop) => (
                        <Link
                          key={drop.href}
                          href={drop.href}
                          onClick={() => setMobileOpen(false)}
                          style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem 0.75rem', borderRadius: 8, transition: 'color 0.15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                        >
                          {drop.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom CTA */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Link
              href="/careers-partnerships"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.7rem',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                color: '#FFFFFF',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Join our team
            </Link>

            <Link
              href={ctaLink || '/contact'}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: '#0F766E',
                color: '#fff',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.05em',
              }}
            >
              {ctaLabel || 'Start a Project'} +'
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes navbarSpin {
          from { --gradient-angle: 0deg; }
          to { --gradient-angle: 360deg; }
        }
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .liquid-edge-ring { pointer-events: none; }
        .liquid-gradient {
          position: absolute;
          inset: 0;
          background: conic-gradient(
            from var(--gradient-angle),
            rgba(2, 7, 8,0) 0%,
            rgba(2, 7, 8,0) 65%,
            #0F766E 82%,
            #67E8F9 92%,
            rgba(2, 7, 8,0) 100%
          );
          animation: navbarSpin 5s linear infinite;
          border-radius: inherit;
        }
        @media (prefers-reduced-motion: reduce) {
          .liquid-gradient { animation: none; background: rgba(20, 184, 166,0.15); }
        }
        @media (max-width: 1120px) {
          .nav-careers-btn { display: none !important; }
        }
        @media (max-width: 900px) {
          .nav-desktop-links { display: none !important; }
          .nav-wordmark-text { font-size: 0.78rem !important; }
          .nav-hamburger { display: flex !important; }
          .nav-cta-btn { display: none !important; }
        }
        @media (min-width: 901px) {
          .nav-hamburger { display: none !important; }
        }
        @media (max-width: 600px) {
          .main-navbar-container { padding: 0 0.75rem !important; }
        }
      `}</style>
    </>
  );
}
