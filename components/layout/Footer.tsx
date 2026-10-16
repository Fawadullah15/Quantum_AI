'use client';

import React from 'react';
import Link from 'next/link';
import { QuantumLogo } from '../ui/QuantumLogo';
import { openCookiePreferencesModal } from '@/lib/consent';

// ─── Navigation groups ───────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'COMPANY',
    links: [
      { href: '/about', label: 'About' },
      { href: '/leadership', label: 'Leadership' },
      { href: '/careers-partnerships', label: 'Careers' },
    ],
  },
  {
    label: 'SERVICES',
    links: [
      { href: '/services#ai', label: 'AI Systems' },
      { href: '/services#software', label: 'Business Software' },
      { href: '/services#automation', label: 'Automation' },
      { href: '/services#products', label: 'Digital Products' },
    ],
  },
  {
    label: 'TECHNOLOGIES',
    links: [
      { href: '/technologies/artificial-intelligence', label: 'Artificial Intelligence' },
      { href: '/technologies/machine-learning', label: 'Machine Learning' },
      { href: '/technologies/cloud-systems', label: 'Cloud Systems' },
      { href: '/technologies/data-systems', label: 'Data Systems' },
    ],
  },
  {
    label: 'WORK',
    links: [
      { href: '/work', label: 'Client Work & Case Studies' },
      { href: '/products', label: 'Software Products' },
      { href: '/contact', label: 'Start a Project' },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Footer({
  companyName = 'QUANTUM AI',
  tagline = 'Intelligent software for a connected world.',
  email = 'quantumai.cmp@gmail.com',
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
  const displayCopyright = copyright || `© ${currentYear} Quantum AI. All rights reserved.`;

  return (
    <footer className="qaf-root">
      {/* ── Top hairline glow ── */}
      <div className="qaf-topline" aria-hidden="true" />

      <div className="qaf-inner">

        {/* ════════════════════════════════════
            SECTION A — Brand Signature
        ════════════════════════════════════ */}
        <div className="qaf-brand">
          <Link href="/" className="qaf-wordmark" aria-label="Quantum AI — Home">
            <QuantumLogo width={40} height={40} />
            <span className="qaf-wordmark-text">{companyName}</span>
          </Link>
          <p className="qaf-tagline">{tagline}</p>
        </div>

        {/* ════════════════════════════════════
            SECTION B — Closing Brand Element
        ════════════════════════════════════ */}
        <div className="qaf-signature" aria-hidden="true">
          <span className="qaf-sig-line" />
          <span className="qaf-sig-phrase">INTELLIGENCE, BUILT INTO EVERYTHING.</span>
        </div>

        {/* ════════════════════════════════════
            SECTION C — Navigation Grid
        ════════════════════════════════════ */}
        <nav className="qaf-nav" aria-label="Footer navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="qaf-nav-col">
              <h3 className="qaf-nav-heading">{group.label}</h3>
              <ul className="qaf-nav-list">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="qaf-nav-link">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ════════════════════════════════════
            SECTION D — Bottom Signature Bar
        ════════════════════════════════════ */}
        <div className="qaf-bottom">
          <div className="qaf-bottom-divider" aria-hidden="true" />

          {/* Copyright */}
          <p className="qaf-copyright">{displayCopyright}</p>

          {/* Legal links row */}
          <div className="qaf-legal">
            <Link href="/privacy" className="qaf-legal-link">Privacy Policy</Link>
            <span className="qaf-legal-sep" aria-hidden="true" />
            <Link href="/terms" className="qaf-legal-link">Terms &amp; Conditions</Link>
            <span className="qaf-legal-sep" aria-hidden="true" />
            <Link href="/cookies" className="qaf-legal-link">Cookie Policy</Link>
            <button
              type="button"
              className="qaf-legal-btn"
              onClick={() => openCookiePreferencesModal()}
            >
              Cookie Settings
            </button>
          </div>

          {/* Email */}
          <a
            href={`mailto:${email}`}
            className="qaf-email"
            aria-label={`Email us at ${email}`}
          >
            {email}
          </a>
        </div>
      </div>

      {/* ════════════════════════════════════
          STYLES
      ════════════════════════════════════ */}
      <style>{`

        /* ── Root ── */
        .qaf-root {
          position: relative;
          z-index: 20;
          background: #020708;
          border-top: 1px solid rgba(15, 118, 110, 0.18);
          padding: 0;
          /* Ensure the floating sound toggle (bottom-right) never overlaps */
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* Subtle teal top-edge glow */
        .qaf-topline {
          position: absolute;
          top: -1px;
          left: 0;
          right: 0;
          height: 1px;
          box-shadow: 0 0 48px 12px rgba(15, 118, 110, 0.22);
          pointer-events: none;
        }

        /* ── Inner wrapper ── */
        .qaf-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 1.5rem 2.5rem;
        }

        /* ── Section A: Brand ── */
        .qaf-brand {
          margin-bottom: 2rem;
        }
        .qaf-wordmark {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          margin-bottom: 0.85rem;
        }
        .qaf-wordmark-text {
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.18em;
          color: #FFFFFF;
          text-transform: uppercase;
        }
        .qaf-tagline {
          font-family: var(--font-d-din);
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.55;
          font-weight: 400;
          letter-spacing: 0.01em;
        }

        /* ── Section B: Signature phrase ── */
        .qaf-signature {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 2.5rem;
        }
        .qaf-sig-line {
          display: block;
          width: 28px;
          height: 1px;
          background: #67E8F9;
          flex-shrink: 0;
          opacity: 0.8;
        }
        .qaf-sig-phrase {
          font-family: var(--font-d-din);
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          color: #67E8F9;
          text-transform: uppercase;
          line-height: 1;
          opacity: 0.75;
        }

        /* ── Section C: Navigation ── */
        .qaf-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.25rem 1.25rem;
          margin-bottom: 2.75rem;
        }
        .qaf-nav-col {
          min-width: 0; /* Prevent overflow in narrow grid cells */
        }
        .qaf-nav-heading {
          font-family: var(--font-d-din);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: rgba(103, 232, 249, 0.7);
          text-transform: uppercase;
          margin-bottom: 0.9rem;
          line-height: 1;
        }
        .qaf-nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .qaf-nav-link {
          font-family: var(--font-sans);
          font-size: 0.875rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          line-height: 1.5;
          transition: color 0.18s ease;
          display: block;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .qaf-nav-link:hover {
          color: #FFFFFF;
        }

        /* ── Section D: Bottom bar ── */
        .qaf-bottom {
          /* Reserve right-side space for the sound toggle (approx 60px + safe padding) */
        }
        .qaf-bottom-divider {
          height: 1px;
          background: rgba(15, 118, 110, 0.2);
          margin-bottom: 1.4rem;
        }
        .qaf-copyright {
          font-family: var(--font-d-din);
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.38);
          letter-spacing: 0.06em;
          margin-bottom: 0.85rem;
          line-height: 1.4;
        }
        .qaf-legal {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.55rem 0.9rem;
          margin-bottom: 0.85rem;
        }
        .qaf-legal-link {
          font-family: var(--font-d-din);
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.18s ease;
          white-space: nowrap;
        }
        .qaf-legal-link:hover {
          color: rgba(255, 255, 255, 0.85);
        }
        .qaf-legal-sep {
          display: inline-block;
          width: 1px;
          height: 10px;
          background: rgba(255, 255, 255, 0.12);
          vertical-align: middle;
        }
        .qaf-legal-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: var(--font-d-din);
          font-size: 0.7rem;
          color: #67E8F9;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: color 0.18s ease;
          line-height: 1;
        }
        .qaf-legal-btn:hover {
          color: #FFFFFF;
        }
        .qaf-email {
          display: inline-block;
          font-family: var(--font-d-din);
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.18s ease;
          /* Ensure comfortable tap target */
          padding: 0.25rem 0;
          min-height: 36px;
          line-height: 36px;
        }
        .qaf-email:hover {
          color: #67E8F9;
        }

        /* ── Tablet (768px+) ── */
        @media (min-width: 768px) {
          .qaf-inner {
            padding: 3.5rem 2.5rem 2.5rem;
          }
          .qaf-brand {
            margin-bottom: 2.25rem;
          }
          .qaf-wordmark-text {
            font-size: 0.95rem;
          }
          .qaf-tagline {
            font-size: 0.9rem;
            max-width: 340px;
          }
          .qaf-nav {
            grid-template-columns: repeat(4, 1fr);
            gap: 0 2.5rem;
            margin-bottom: 3rem;
          }
          .qaf-legal {
            gap: 0.5rem 1.1rem;
          }
          .qaf-copyright,
          .qaf-legal-link,
          .qaf-legal-btn,
          .qaf-email {
            font-size: 0.75rem;
          }
        }

        /* ── Desktop (1024px+) ── */
        @media (min-width: 1024px) {
          .qaf-inner {
            padding: 4rem 3rem 2.75rem;
          }

          /* On desktop: brand + signature sit above nav as a distinct header area */
          .qaf-brand {
            margin-bottom: 1.5rem;
          }
          .qaf-signature {
            margin-bottom: 3rem;
          }
          .qaf-nav {
            grid-template-columns: repeat(4, 1fr);
            gap: 0 3rem;
          }
          .qaf-nav-link {
            font-size: 0.9rem;
          }

          /* Bottom: side-by-side layout */
          .qaf-bottom {
            display: flex;
            flex-direction: column;
          }
          .qaf-bottom-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.75rem;
          }
        }

        /* ── Wide Desktop (1440px+) ── */
        @media (min-width: 1440px) {
          .qaf-inner {
            padding: 4.5rem 4rem 3rem;
          }
          .qaf-wordmark-text {
            font-size: 1rem;
          }
          .qaf-tagline {
            font-size: 0.9375rem;
          }
        }

        /* ── Narrow mobile (≤ 359px) ── */
        @media (max-width: 359px) {
          .qaf-inner {
            padding: 2.5rem 1.25rem 2rem;
          }
          .qaf-nav-link {
            font-size: 0.8125rem;
          }
          .qaf-sig-phrase {
            font-size: 0.58rem;
          }
        }

        /* Touch-target guard: keep footer clear of the sound toggle */
        @media (max-width: 767px) {
          .qaf-root {
            /* Sound toggle is fixed bottom-right at ~60px wide, add extra bottom clearance */
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </footer>
  );
}
