'use client';

import React from 'react';
import Link from 'next/link';
import { QuantumLogo } from '../ui/QuantumLogo';

const footerLinks = {
  'COMPANY': [
    { href: '/about', label: 'About' },
    { href: '/leadership', label: 'Leadership' },
    { href: '/careers-partnerships', label: 'Careers' },
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
    { href: '/work', label: 'Client Work & Case Studies' },
    { href: '/products', label: 'Software Products' },
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
  companyName = 'QUANTUM AI',
  tagline = 'Intelligent software for a connected world.',
  email = 'hello@quantumai.dev',
  socials,
  copyright,
}: {
  companyName?: string;
  tagline?: string;
  email?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  copyright?: string;
}) {
  const currentYear = new Date().getFullYear();
  const displayCopyright = copyright || `© ${currentYear} ${companyName}. All rights reserved.`;

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
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>

        {/* Top grid - Desktop: 5 columns, Tablet: 3 columns, Mobile: 2 columns */}
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '2rem',
          }}
        >
          {/* Brand - spans full width on mobile, 1 col on desktop */}
          <div className="footer-brand" style={{ gridColumn: 'span 1' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', marginBottom: '1rem' }}>
              <QuantumLogo width={42} height={42} style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.45))' }} />
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
              maxWidth: 240,
              fontWeight: 400,
              fontFamily: 'var(--font-sans)',
            }}>
              {tagline}
            </p>

            {/* Social Links on Brand Column */}
            {socials && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                {socials.github && (
                  <a
                    href={socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Quantum AI GitHub Repository"
                    style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#38BDF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    title="GitHub"
                  >
                    GitHub
                  </a>
                )}
                {socials.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Quantum AI LinkedIn Company Page"
                    style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#38BDF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    title="LinkedIn"
                  >
                    LinkedIn
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Quantum AI Twitter / X Profile"
                    style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#38BDF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    title="Twitter / X"
                  >
                    Twitter
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Link columns - each spans 1 column */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="footer-col">
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
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.08em' }}>
            {displayCopyright}
          </span>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href={`mailto:${email || 'hello@quantumai.dev'}`} style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem', 
              color: '#38BDF8', 
              textDecoration: 'none', 
              letterSpacing: '0.05em' 
            }}>
              {email || 'hello@quantumai.dev'}
            </a>
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
            gap: 2rem 1.25rem !important;
          }
          .footer-brand {
            grid-column: 1 / -1 !important;
            margin-bottom: 0.5rem;
          }
          .footer-brand p {
            max-width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2rem 1rem !important;
          }
          .footer-col a {
            font-size: 0.8125rem !important;
          }
          footer {
            padding: 3rem 1.25rem 2rem !important;
          }
        }
      `}</style>
    </footer>
  );
}
