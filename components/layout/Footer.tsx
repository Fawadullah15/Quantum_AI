'use client';

import React from 'react';
import Link from 'next/link';
import { QuantumLogo } from '../ui/QuantumLogo';

const footerLinks = {
  'COMPANY': [
    { href: '/about', label: 'About' },
    { href: '/leadership', label: 'Leadership' },
    { href: '/careers', label: 'Careers' },
  ],
  'SERVICES': [
    { href: '/services#ai', label: 'AI Systems' },
    { href: '/services#software', label: 'Business Software' },
    { href: '/services#automation', label: 'Automation' },
    { href: '/services#products', label: 'Digital Products' },
  ],
  'TECHNOLOGIES': [
    { href: '/technologies/artificial-intelligence', label: 'Artificial Intelligence' },
    { href: '/technologies/machine-learning', label: 'Machine Learning' },
    { href: '/technologies/cloud-systems', label: 'Cloud Systems' },
    { href: '/technologies/data-systems', label: 'Data Systems' },
  ],
  'WORK': [
    { href: '/work', label: 'Case Studies' },
    { href: '/work', label: 'Projects' },
    { href: '/contact', label: 'Start a Project' },
  ],
};

const lnk: React.CSSProperties = {
  color: '#64748B',
  textDecoration: 'none',
  transition: 'color 0.2s',
  display: 'block',
  fontSize: '0.875rem',
  lineHeight: 1.6,
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
      padding: 'clamp(3rem, 6vh, 5rem) clamp(1.25rem, 4vw, 4rem) 2rem',
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
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {/* Top grid - Desktop: 5 columns, Tablet: 3 columns, Mobile: 2 columns */}
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '2rem',
          }}
        >
          {/* Brand - spans 1 column */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
              <QuantumLogo width={28} height={28} />
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
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              maxWidth: 200,
              fontWeight: 400,
              fontFamily: 'var(--font-sans)',
            }}>
              {tagline}
            </p>
          </div>

          {/* Link columns - each spans 1 column */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: '#94A3B8',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                {section}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#334155', letterSpacing: '0.08em' }}>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href={`mailto:${email}`} style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.7rem', 
              color: '#334155', 
              textDecoration: 'none', 
              letterSpacing: '0.08em' 
            }}>
              {email}
            </a>
            <Link
              href="/admin/login"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#1E3A5F', textDecoration: 'none', letterSpacing: '0.08em' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1E3A5F')}
            >
              ADMIN
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
          footer {
            padding: 3rem 1.25rem 2rem !important;
          }
        }
      `}</style>
    </footer>
  );
}
