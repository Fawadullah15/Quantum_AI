'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SolutionItem {
  step: string;
  name: string;
  desc: string;
  href: string;
}

const SOLUTIONS: SolutionItem[] = [
  {
    step: '01',
    name: 'AI Systems',
    desc: 'Custom AI systems for business workflows and intelligent decision making.',
    href: '/services#ai',
  },
  {
    step: '02',
    name: 'Business Software',
    desc: 'Web applications and internal systems designed around real business processes.',
    href: '/services#software',
  },
  {
    step: '03',
    name: 'Automation',
    desc: 'Automated workflows that reduce repetitive manual work.',
    href: '/services#automation',
  },
  {
    step: '04',
    name: 'Digital Products',
    desc: 'Customer facing software products, platforms, and intelligent tools.',
    href: '/services#products',
  },
];

export default function SolutionsSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: 'clamp(2rem, 4.5vh, 3.5rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           DESKTOP LAYOUT (> 768px): Compact Interactive Horizontal Cards
        ═══════════════════════════════════════════════════════════ */
        .solutions-desktop-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .solutions-mobile-grid {
          display: none;
        }

        .solution-tab-card {
          position: relative;
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 0.85rem clamp(1rem, 2.5vw, 1.75rem);
          text-decoration: none;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
          outline: none;
        }

        .solution-tab-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }

        .solution-tab-card.is-expanded {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
          transform: translateY(-1px);
        }

        .solution-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
        }

        .solution-card-title-group {
          display: flex;
          align-items: center;
          gap: clamp(1rem, 2.5vw, 2rem);
          min-width: 0;
          flex: 1;
        }

        .solution-card-num {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #38BDF8;
          font-weight: 600;
          letter-spacing: 0.05em;
          flex-shrink: 0;
          width: 45px;
          min-width: 45px;
          display: inline-block;
        }

        .solution-card-title {
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          font-weight: 600;
          color: #F8FAFF;
          letter-spacing: -0.01em;
          margin: 0;
          text-transform: none;
          line-height: 1.3;
          white-space: normal;
        }

        .solution-card-indicator {
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

        .solution-tab-card.is-expanded .solution-card-indicator {
          color: #38BDF8;
        }

        /* ─── Smooth CSS Grid Expansion for Collapsible Body ─── */
        .solution-card-expandable {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin-top 0.25s ease;
          margin-top: 0;
        }

        .solution-tab-card.is-expanded .solution-card-expandable {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 0.65rem;
        }

        .solution-card-expandable-content {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .solution-card-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
          max-width: 800px;
        }

        .solution-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #1677FF;
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          font-weight: 700;
          text-transform: uppercase;
          padding-top: 0.15rem;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .solution-tab-card:hover .solution-card-cta {
          color: #38BDF8;
          transform: translateX(3px);
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE LAYOUT (<= 768px): Clean 2x2 Grid of Small Tiles
           (No hover effect, no expansion, compact and scannable)
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .solutions-desktop-list {
            display: none !important;
          }

          .solutions-mobile-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .mobile-solution-tile {
            background: rgba(6, 21, 43, 0.75);
            border: 1px solid rgba(22, 119, 255, 0.16);
            border-radius: 8px;
            padding: 0.75rem 0.75rem;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 78px;
            box-sizing: border-box;
            min-width: 0;
            width: 100%;
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }

          .mobile-solution-tile:active {
            background-color: rgba(8, 28, 58, 0.95);
            border-color: rgba(56, 189, 248, 0.4);
          }

          .mobile-solution-num {
            font-family: var(--font-mono, monospace);
            font-size: 0.62rem;
            color: #38BDF8;
            font-weight: 600;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
            display: block;
          }

          .mobile-solution-title {
            font-size: 0.82rem;
            font-weight: 600;
            color: #F8FAFC;
            letter-spacing: -0.01em;
            margin: 0;
            line-height: 1.25;
            word-break: break-word;
            overflow-wrap: break-word;
            min-width: 0;
          }

          .mobile-solution-arrow {
            font-family: var(--font-mono, monospace);
            font-size: 0.68rem;
            color: #64748B;
            align-self: flex-end;
            margin-top: 0.2rem;
          }
        }

        @media (max-width: 380px) {
          .solutions-mobile-grid {
            gap: 0.4rem;
          }
          .mobile-solution-tile {
            padding: 0.65rem 0.65rem;
            min-height: 70px;
          }
          .mobile-solution-title {
            font-size: 0.78rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Eyebrow & Title */}
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#1677FF',
            marginBottom: '0.4rem',
            fontWeight: 600,
          }}
        >
          SOLUTIONS
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.35rem, 2.5vw, 2.1rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: '#F8FAFF',
            marginBottom: '0.4rem',
            textTransform: 'uppercase',
          }}
        >
          Systems built to execute.
        </h2>
        <p
          style={{
            fontSize: 'clamp(0.82rem, 1.2vw, 0.95rem)',
            color: '#94A3B8',
            lineHeight: 1.55,
            marginBottom: 'clamp(1rem, 2vh, 1.75rem)',
            maxWidth: 600,
            fontWeight: 300,
          }}
        >
          We construct custom software architectures designed to fit directly into your business model and operational workflow.
        </p>

        {/* ─── Desktop View: Interactive Expanding Horizontal Cards ─── */}
        <div className="solutions-desktop-list">
          {SOLUTIONS.map((item, idx) => {
            const isExpanded = hoveredIdx === idx;

            return (
              <Link
                key={idx}
                href={item.href}
                className={`solution-tab-card ${isExpanded ? 'is-expanded' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                aria-expanded={isExpanded}
              >
                <div className="solution-card-header">
                  <div className="solution-card-title-group">
                    <span className="solution-card-num">{item.step}</span>
                    <h3 className="solution-card-title">{item.name}</h3>
                  </div>
                  <div className="solution-card-indicator">
                    <span>{isExpanded ? 'DISCOVER' : '+'}</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="solution-card-expandable">
                  <div className="solution-card-expandable-content">
                    <p className="solution-card-desc">{item.desc}</p>
                    <div className="solution-card-cta">
                      <span>DISCOVER SOLUTION</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ─── Mobile View: Clean 2x2 Grid of Small Tiles (No Hover, No Expansion) ─── */}
        <div className="solutions-mobile-grid">
          {SOLUTIONS.map((item, idx) => (
            <Link key={idx} href={item.href} className="mobile-solution-tile">
              <div>
                <span className="mobile-solution-num">{item.step}</span>
                <h3 className="mobile-solution-title">{item.name}</h3>
              </div>
              <span className="mobile-solution-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
