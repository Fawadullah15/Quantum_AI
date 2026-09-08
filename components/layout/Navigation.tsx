'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QuantumLogo } from '../ui/QuantumLogo';
import { Wordmark } from '../ui/Wordmark';

const DESKTOP_NAV = [
  { href: '/services', label: 'Solutions' },
  { href: '/work', label: 'Work' },
  { href: '/technology', label: 'Technology' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
];

const MOBILE_NAV = [
  { href: '/services', label: 'Solutions' },
  { href: '/work', label: 'Work' },
  { href: '/technology', label: 'Technology' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/leadership', label: 'Leadership' },
  { href: '/careers-partnerships', label: 'Careers & Partnerships' },
  { href: '/contact', label: 'Contact' },
];

export default function Navigation({
  companyName,
  ctaLabel = 'Start a Project',
  ctaLink = '/contact',
}: {
  companyName?: string;
  ctaLabel?: string;
  ctaLink?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  // Check if a path is active (handles nested routes)
  const isActive = (href: string) => {
    if (href === '/' && pathname !== '/') return false;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return pathname === href;
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: 'var(--header-height, 72px)',
          backgroundColor: scrolled ? 'rgba(8, 8, 13, 0.95)' : 'rgba(8, 8, 13, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--q-border-soft)',
        }}
      >
        <div className="q-container h-full mx-auto flex items-center justify-between">
          
          {/* LEFT: Brand */}
          <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-q-focus rounded-sm">
            <QuantumLogo width={28} height={28} />
            <Wordmark />
          </Link>

          {/* CENTER: Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {DESKTOP_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative outline-none focus-visible:ring-2 focus-visible:ring-q-focus rounded-sm transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-space-grotesk, sans-serif)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: active ? 'var(--q-white)' : 'var(--q-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = 'var(--q-text)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = 'var(--q-muted)';
                  }}
                >
                  {item.label}
                  {active && (
                    <span 
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-q-violet"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: CTA (Desktop) */}
          <div className="hidden md:flex items-center">
            <Link
              href={ctaLink}
              className="q-btn q-btn-primary"
            >
              {ctaLabel}
            </Link>
          </div>

          {/* RIGHT: Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center justify-center p-2 text-q-muted hover:text-q-white focus:outline-none focus:ring-2 focus:ring-q-focus rounded-md"
            onClick={() => setMobileOpen(true)}
            aria-label="Open mobile menu"
            aria-expanded={mobileOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* MOBILE FULL-WIDTH OVERLAY MENU */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--q-bg)' }}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-q-border-soft shrink-0">
          <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-q-focus rounded-sm" onClick={() => setMobileOpen(false)}>
            <QuantumLogo width={28} height={28} />
            <span className="font-sans font-bold tracking-widest text-q-white text-sm">QUANTUM AI</span>
          </Link>
          <button
            className="p-2 text-q-muted hover:text-q-white focus:outline-none focus:ring-2 focus:ring-q-focus rounded-md"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-6" aria-label="Mobile navigation">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-2xl font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-q-focus rounded-sm"
                style={{
                  fontFamily: 'var(--font-space-grotesk, sans-serif)',
                  color: active ? 'var(--q-white)' : 'var(--q-text)',
                }}
              >
                <div className="flex items-center gap-4">
                  {item.label}
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-q-violet shrink-0" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Styles for global header layout spacing to push content down (if needed, though client layout handles it usually) */}
      <style>{`
        @media (max-width: 767px) {
          :root {
            --header-height: 64px;
          }
        }
      `}</style>
    </>
  );
}
