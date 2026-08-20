'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumLogo } from '../ui/QuantumLogo';
import { Wordmark } from '../ui/Wordmark';

// ─── Nav Data ────────────────────────────────────────────────────────────────

interface DropdownItem { href: string; label: string; desc?: string }
interface NavItem { href: string; label: string; dropdown?: DropdownItem[] }

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  {
    href: '/services', label: 'Solutions',
    dropdown: [
      { href: '/services#ai', label: 'AI Systems', desc: 'Intelligent systems built on real models' },
      { href: '/services#software', label: 'Business Software', desc: 'Platforms that run your operations' },
      { href: '/services#automation', label: 'Automation', desc: 'Eliminate repetitive manual work' },
      { href: '/services#products', label: 'Digital Products', desc: 'Complete software for real users' },
    ],
  },
  { href: '/work', label: 'Work' },
  {
    href: '/technology', label: 'Technology',
    dropdown: [
      { href: '/technologies/artificial-intelligence', label: 'Artificial Intelligence', desc: 'Models, agents, and AI systems' },
      { href: '/technologies/machine-learning', label: 'Machine Learning', desc: 'Learning from your data' },
      { href: '/technologies/cloud-systems', label: 'Cloud Systems', desc: 'Scalable infrastructure' },
      { href: '/technologies/data-systems', label: 'Data Systems', desc: 'Structured data at scale' },
    ],
  },
  { href: '/about', label: 'About' },
  { href: '/leadership', label: 'Team' },
  { href: '/contact', label: 'Contact' },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function DropdownMenu({ items, visible }: { items: DropdownItem[]; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.75rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 260,
            backgroundColor: 'rgba(6, 21, 43, 0.96)',
            border: '1px solid rgba(22, 119, 255, 0.2)',
            borderRadius: 14,
            padding: '0.5rem',
            boxShadow: '0 16px 48px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(22,119,255,0.08)',
            zIndex: 200,
            backdropFilter: 'blur(20px)',
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
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(79, 70, 229, 0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#F8FAFF', marginBottom: item.desc ? '0.2rem' : 0 }}>
                {item.label}
              </div>
              {item.desc && (
                <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>{item.desc}</div>
              )}
            </Link>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Navigation ─────────────────────────────────────────────────────────

export default function Navigation({ companyName }: { companyName?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
      document.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  const handleNavEnter = (href: string, hasDropdown: boolean) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHoveredItem(href);
    if (hasDropdown) setActiveDropdown(href);
  };

  const handleNavLeave = () => {
    leaveTimer.current = setTimeout(() => {
      setHoveredItem(null);
      setActiveDropdown(null);
    }, 120);
  };

  const handleDropdownEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ─── Desktop Floating Navbar ─── */}
      <div
        style={{
          position: 'fixed',
          top: scrolled ? '0.625rem' : '1.25rem',
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 1.5rem',
          transition: 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
        }}
        className="main-navbar-container"
      >
        <div
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            width: '100%',
            maxWidth: 1160,
          }}
        >
          {/* Liquid Edge Wrapper */}
          <div
            className="liquid-edge-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              overflow: 'hidden',
              zIndex: 0,
            }}
          >
            <div className="liquid-gradient" />
          </div>

          {/* Nav Surface */}
          <header
            role="banner"
            style={{
              position: 'relative',
              margin: '1.5px',
              borderRadius: 999,
              height: scrolled ? 58 : 66,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.25rem 0 0.85rem',
              transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s',
              backgroundColor: scrolled ? 'rgba(10, 15, 45, 0.94)' : 'rgba(10, 15, 45, 0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 1,
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              aria-label="Quantum AI — Home"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <QuantumLogo width={52} height={52} style={{ filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.5))' }} />
              <span className="nav-wordmark-text" style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: '0.92rem',
                letterSpacing: '0.12em',
                color: '#F8FAFF',
                textTransform: 'uppercase',
              }}>
                {companyName || 'QUANTUM AI'}
              </span>
            </Link>

            {/* Desktop Links */}
            <nav
              aria-label="Primary navigation"
              className="nav-desktop-links"
              style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', position: 'relative' }}
            >
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.href}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => handleNavEnter(item.href, !!item.dropdown)}
                  onMouseLeave={handleNavLeave}
                >
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
                      padding: '0.5rem 0.875rem',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: isActive(item.href) ? '#F8FAFF' : '#94A3B8',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    onFocus={() => handleNavEnter(item.href, !!item.dropdown)}
                    onBlur={handleNavLeave}
                  >
                    {item.label}
                    {item.dropdown && (
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                        style={{ opacity: 0.5, transition: 'transform 0.2s', transform: activeDropdown === item.href ? 'rotate(180deg)' : 'none' }}>
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </Link>

                  {/* Spring Hover Pill */}
                  {(hoveredItem === item.href || (isActive(item.href) && hoveredItem === null)) && (
                    <motion.div
                      layoutId="navPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 999,
                        backgroundColor: 'rgba(79, 70, 229, 0.13)',
                        border: '1px solid rgba(79, 70, 229, 0.25)',
                        zIndex: 0,
                        boxShadow: '0 0 12px rgba(79, 70, 229, 0.15)',
                      }}
                    />
                  )}

                  {/* Dropdown */}
                  {item.dropdown && (
                    <div onMouseEnter={handleDropdownEnter} onMouseLeave={handleNavLeave}>
                      <DropdownMenu items={item.dropdown} visible={activeDropdown === item.href} />
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA */}
            <div className="nav-cta-area" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
              <Link
                href="/careers-partnerships"
                className="nav-cta-btn nav-careers-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 1.1rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#F8FAFF',
                  textDecoration: 'none',
                  borderRadius: 999,
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  transition: 'background-color 0.2s, border-color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.22)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                }}
              >
                Careers & Partnerships
              </Link>

              <Link
                href="/contact"
                className="nav-cta-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#F8FAFF',
                  textDecoration: 'none',
                  borderRadius: 999,
                  border: '1px solid rgba(22, 119, 255, 0.5)',
                  backgroundColor: 'rgba(22, 119, 255, 0.12)',
                  transition: 'background-color 0.2s, border-color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.5)';
                }}
              >
                Start a Project
              </Link>

              {/* Mobile Hamburger */}
              <button
                className="nav-hamburger"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                  display: 'none',
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFF',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: 8,
                  lineHeight: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </header>
        </div>
      </div>

      {/* ─── Full-Screen Mobile Drawer ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 990,
                backgroundColor: 'rgba(2, 8, 23, 0.6)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: '-100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220, mass: 0.9 }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(6, 21, 43, 0.97)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(22, 119, 255, 0.2)',
                padding: '1.5rem 1.5rem 2rem',
                overflowY: 'auto',
                maxHeight: '100dvh',
              }}
            >
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <Link href="/" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                  <QuantumLogo width={54} height={54} style={{ filter: 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.5))' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.12em', color: '#F8FAFF', textTransform: 'uppercase' }}>
                    QUANTUM AI
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.5rem', borderRadius: 8 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Nav Links */}
              <nav aria-label="Mobile navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {NAV_ITEMS.map((item) => (
                  <div key={item.href} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.08)' }}>
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
                        color: '#F8FAFF',
                        fontSize: '1.25rem',
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
                        <motion.div
                          animate={{ rotate: mobileAccordion === item.href ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          style={{ color: '#1677FF', flexShrink: 0, marginLeft: '0.5rem' }}
                        >
                          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                            <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}
                    </button>

                    {/* Accordion Items */}
                    <AnimatePresence>
                      {item.dropdown && mobileAccordion === item.href && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ paddingBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(22, 119, 255, 0.3)', marginLeft: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {item.dropdown.map((drop) => (
                              <Link
                                key={drop.href}
                                href={drop.href}
                                onClick={() => setMobileOpen(false)}
                                style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem 0.75rem', borderRadius: 8, transition: 'color 0.15s' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFF')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                              >
                                {drop.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </nav>

              {/* Bottom CTA */}
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  href="/careers-partnerships"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.875rem',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38BDF8',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Careers & Partnerships
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '1rem',
                    backgroundColor: '#1677FF',
                    color: '#fff',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '0.05em',
                  }}
                >
                  Start a Project →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Responsive CSS ─── */}
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
            rgba(2,8,23,0) 0%,
            rgba(2,8,23,0) 65%,
            #1677FF 82%,
            #55D6FF 92%,
            rgba(2,8,23,0) 100%
          );
          animation: navbarSpin 5s linear infinite;
          border-radius: inherit;
        }
        @media (prefers-reduced-motion: reduce) {
          .liquid-gradient { animation: none; background: rgba(22,119,255,0.15); }
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
