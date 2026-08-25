'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TrustPrinciple {
  code: string;
  title: string;
  desc: string;
}

const TRUST_PRINCIPLES: TrustPrinciple[] = [
  {
    code: '01 // PRIVACY',
    title: 'Data Privacy & Ownership',
    desc: 'Your proprietary data, intellectual property, and client records remain completely yours, isolated in private cloud containers.',
  },
  {
    code: '02 // ACCESS',
    title: 'Role-Based Access Control',
    desc: 'Granular user permission models, session authentication, and audit logs built into all internal platforms and APIs.',
  },
  {
    code: '03 // INFRASTRUCTURE',
    title: 'Production Cloud Reliability',
    desc: 'Modern containerized infrastructure with continuous health monitoring, automated backups, and high uptime resilience.',
  },
  {
    code: '04 // CONTINUITY',
    title: 'Long-Term Support & Evolution',
    desc: 'Clean, documented codebases and ongoing engineering maintenance so your systems stay performant as your business grows.',
  },
];

export default function TrustSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: 'clamp(2rem, 4.5vh, 3.5rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(4, 14, 36, 0.6)',
        borderTop: '1px solid rgba(22, 119, 255, 0.1)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           DESKTOP LAYOUT (> 768px): Compact Expandable Trust Cards
        ═══════════════════════════════════════════════════════════ */
        .trust-desktop-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
        }

        .trust-mobile-grid {
          display: none;
        }

        .trust-tab-card {
          position: relative;
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 0.85rem clamp(1rem, 2.5vw, 1.75rem);
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
          outline: none;
          cursor: pointer;
        }

        .trust-tab-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }

        .trust-tab-card.is-expanded {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
          transform: translateY(-1px);
        }

        .trust-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
        }

        .trust-card-title-group {
          display: flex;
          align-items: center;
          gap: clamp(1rem, 2.5vw, 2rem);
          min-width: 0;
          flex: 1;
        }

        .trust-card-code {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #38BDF8;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          flex-shrink: 0;
          width: 185px;
          min-width: 185px;
          display: inline-block;
        }

        .trust-card-title {
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          font-weight: 600;
          color: #F8FAFF;
          letter-spacing: -0.01em;
          margin: 0;
          text-transform: none;
          line-height: 1.3;
          white-space: normal;
        }

        .trust-card-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #64748B;
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
          transition: color 0.25s ease, transform 0.25s ease;
        }

        .trust-tab-card.is-expanded .trust-card-indicator {
          color: #38BDF8;
        }

        /* ─── Smooth Expandable Content ─── */
        .trust-card-expandable {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin-top 0.25s ease;
          margin-top: 0;
        }

        .trust-tab-card.is-expanded .trust-card-expandable {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 0.65rem;
        }

        .trust-card-expandable-content {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .trust-card-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
          max-width: 800px;
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE LAYOUT (<= 768px): Clean 2x2 Trust Grid
           (No hover effect, no expansion, compact and scannable)
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .trust-desktop-list {
            display: none !important;
          }

          .trust-mobile-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .mobile-trust-tile {
            background: rgba(6, 21, 43, 0.75);
            border: 1px solid rgba(22, 119, 255, 0.16);
            border-radius: 8px;
            padding: 0.75rem 0.75rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 80px;
            box-sizing: border-box;
            min-width: 0;
            width: 100%;
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }

          .mobile-trust-code {
            font-family: var(--font-mono, monospace);
            font-size: 0.56rem;
            color: #38BDF8;
            font-weight: 600;
            letter-spacing: 0.08em;
            margin-bottom: 0.25rem;
            display: block;
            text-transform: uppercase;
            overflow-wrap: break-word;
          }

          .mobile-trust-title {
            font-size: 0.8rem;
            font-weight: 600;
            color: #F8FAFC;
            letter-spacing: -0.01em;
            margin: 0;
            text-transform: none;
            line-height: 1.25;
            word-break: break-word;
            overflow-wrap: break-word;
            min-width: 0;
          }
        }

        @media (max-width: 380px) {
          .trust-mobile-grid {
            gap: 0.4rem;
          }
          .mobile-trust-tile {
            padding: 0.65rem 0.65rem;
            min-height: 72px;
          }
          .mobile-trust-title {
            font-size: 0.75rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Eyebrow & Title */}
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#1677FF',
            marginBottom: '0.5rem',
            fontWeight: 600,
          }}
        >
          TRUST & SECURITY
        </p>
        <h2
          className="section-heading"
          style={{
            fontSize: 'clamp(2.5rem, 4.8vw, 3.85rem)',
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            color: '#F8FAFF',
            marginBottom: '0.65rem',
            textTransform: 'uppercase',
          }}
        >
          Engineered for Reliability and Security.
        </h2>
        <p
          className="section-desc"
          style={{
            fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
            maxWidth: 620,
            fontWeight: 300,
          }}
        >
          We prioritize data privacy, strict access control, and dependable cloud infrastructure across every software solution we deploy.
        </p>

        {/* ─── Desktop View: Interactive Compact Trust Rows with Hover Reveal ─── */}
        <div className="trust-desktop-list">
          {TRUST_PRINCIPLES.map((item, idx) => {
            const isExpanded = hoveredIdx === idx;

            return (
              <div
                key={idx}
                tabIndex={0}
                className={`trust-tab-card ${isExpanded ? 'is-expanded' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                aria-expanded={isExpanded}
              >
                <div className="trust-card-header">
                  <div className="trust-card-title-group">
                    <span className="trust-card-code">{item.code}</span>
                    <h3 className="trust-card-title">{item.title}</h3>
                  </div>
                  <div className="trust-card-indicator">
                    <span>{isExpanded ? 'VERIFIED' : '+'}</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="trust-card-expandable">
                  <div className="trust-card-expandable-content">
                    <p className="trust-card-desc">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Mobile View: Clean 2x2 Grid (No Hover, Compact) ─── */}
        <div className="trust-mobile-grid">
          {TRUST_PRINCIPLES.map((item, idx) => (
            <div key={idx} className="mobile-trust-tile">
              <div>
                <span className="mobile-trust-code">{item.code}</span>
                <h3 className="mobile-trust-title">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Trust Next Step ─── */}
        <div style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(22, 119, 255, 0.12)', paddingTop: '1.25rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
            Ready to build secure, reliable software systems for your business?
          </p>
          <Link
            href="/contact"
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.75rem',
              color: '#38BDF8',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              fontWeight: 600,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'color 0.2s',
            }}
          >
            START A PROJECT →
          </Link>
        </div>
      </div>
    </section>
  );
}
