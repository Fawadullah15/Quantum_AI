'use client';

import React from 'react';
import Link from 'next/link';
import { QuantumLogo } from '../ui/QuantumLogo';

const footerLinks = {
  'SERVICES': [
    { href: '/services#ai', label: 'AI Systems' },
    { href: '/services#software', label: 'Business Software' },
    { href: '/services#automation', label: 'Automation' },
    { href: '/services#products', label: 'Digital Products' },
  ],
  'COMPANY': [
    { href: '/about', label: 'About' },
    { href: '/work', label: 'Our Work' },
    { href: '/technology', label: 'Technology' },
    { href: '/contact', label: 'Contact' },
  ],
};

const lnk: React.CSSProperties = {
  color: '#64748B',
  textDecoration: 'none',
  transition: 'color 0.2s',
  display: 'block',
};

export default function Footer({
  companyName,
  tagline,
  email,
}: {
  companyName: string;
  tagline: string;
  email: string;
}) {
  return (
    <footer style={{
      position: 'relative',
      zIndex: 20,
      padding: 'clamp(4rem, 8vh, 7rem) clamp(1.25rem, 6vw, 6rem) 2.5rem',
      borderTop: '1px solid rgba(22, 119, 255, 0.1)',
      backgroundColor: 'var(--color-void)',
    }}>
      {/* Subtle Indigo Top Gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        boxShadow: '0 0 40px 15px rgba(55, 48, 163, 0.15)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>

        {/* Top grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
              <QuantumLogo width={26} height={26} />
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.15em',
                color: '#F8FAFF',
                textTransform: 'uppercase',
              }}>
                {companyName}
              </span>
            </Link>
            <p style={{
              color: '#64748B',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              maxWidth: 240,
              fontWeight: 300,
              fontFamily: 'var(--font-sans)',
            }}>
              {tagline}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                color: '#94A3B8',
                marginBottom: '1.25rem',
                textTransform: 'uppercase',
              }}>
                {section}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {links.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    style={lnk}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              color: '#94A3B8',
              marginBottom: '1.25rem',
              textTransform: 'uppercase',
            }}>
              GET IN TOUCH
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a href={`mailto:${email}`} style={lnk}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#20A8FF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
              >
                {email}
              </a>
              <Link href="/contact" style={{ ...lnk, color: '#1677FF', fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#55D6FF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#1677FF')}
              >
                Start a Project →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(22, 119, 255, 0.08)',
          paddingTop: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#334155', letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </span>
          <Link
            href="/admin/login"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#1E3A5F', textDecoration: 'none', letterSpacing: '0.1em' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#1E3A5F')}
          >
            ADMIN
          </Link>
        </div>
      </div>
    </footer>
  );
}
