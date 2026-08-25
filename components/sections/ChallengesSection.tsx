'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ChallengeItem {
  code: string;
  title: string;
  desc: string;
  shortDesc: string;
  link: string;
  action: string;
}

const CHALLENGES: ChallengeItem[] = [
  {
    code: '01 // OPERATIONS',
    title: 'Manual Operations',
    desc: 'Replace repetitive, error-prone manual tasks with reliable software workflows and automated pipelines that run 24/7.',
    shortDesc: 'Automated 24/7 pipelines and workflows that replace manual errors.',
    link: '/services#automation',
    action: 'Automate',
  },
  {
    code: '02 // INTEGRATION',
    title: 'Disconnected Data',
    desc: 'Bring fragmented spreadsheets, legacy databases, and third-party tools into a single, cohesive source of truth.',
    shortDesc: 'Unify fragmented tools and databases into a single source of truth.',
    link: '/services#software',
    action: 'Integrate',
  },
  {
    code: '03 // SPEED',
    title: 'Slow Workflows',
    desc: 'Build intuitive internal tools and dashboards that accelerate execution and eliminate delays.',
    shortDesc: 'Custom internal tools and dashboards that accelerate execution.',
    link: '/services#software',
    action: 'Accelerate',
  },
  {
    code: '04 // ARCHITECTURE',
    title: 'Complex Business Processes',
    desc: 'Turn difficult operational procedures and domain logic into clear, structured, and scalable digital systems.',
    shortDesc: 'Transform difficult domain logic into structured digital systems.',
    link: '/services#ai',
    action: 'Architect',
  },
];

export default function ChallengesSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: 'clamp(2rem, 4.5vh, 3.5rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(4, 14, 36, 0.5)',
        borderTop: '1px solid rgba(22, 119, 255, 0.08)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           DESKTOP LAYOUT (> 768px): Horizontal Expandable Rows
        ═══════════════════════════════════════════════════════════ */
        .challenges-desktop-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .challenges-mobile-grid {
          display: none;
        }

        .challenge-tab-card {
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

        .challenge-tab-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }

        .challenge-tab-card.is-expanded {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
          transform: translateY(-1px);
        }

        .challenge-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
        }

        .challenge-card-title-group {
          display: flex;
          align-items: center;
          gap: clamp(1rem, 2.5vw, 2rem);
          min-width: 0;
          flex: 1;
        }

        .challenge-card-code {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #38BDF8;
          letter-spacing: 0.15em;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
          width: 175px;
          min-width: 175px;
          display: inline-block;
        }

        .challenge-card-title {
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          font-weight: 600;
          color: #F8FAFF;
          letter-spacing: -0.01em;
          margin: 0;
          text-transform: none;
          line-height: 1.3;
          white-space: normal;
        }

        .challenge-card-indicator {
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

        .challenge-tab-card.is-expanded .challenge-card-indicator {
          color: #38BDF8;
        }

        .challenge-card-expandable {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin-top 0.25s ease;
          margin-top: 0;
        }

        .challenge-tab-card.is-expanded .challenge-card-expandable {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 0.65rem;
        }

        .challenge-card-expandable-content {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .challenge-card-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
          max-width: 800px;
        }

        .challenge-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #38BDF8;
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          font-weight: 700;
          text-transform: uppercase;
          padding-top: 0.15rem;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .challenge-tab-card:hover .challenge-card-cta {
          color: #55D6FF;
          transform: translateX(3px);
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE LAYOUT (<= 768px): Clean 2x2 Compact Block Grid
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .challenges-desktop-list {
            display: none !important;
          }

          .challenges-mobile-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .mobile-challenge-block {
            background: rgba(6, 21, 43, 0.75);
            border: 1px solid rgba(22, 119, 255, 0.16);
            border-radius: 8px;
            padding: 0.65rem 0.65rem;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 0.35rem;
            box-sizing: border-box;
            min-width: 0;
            width: 100%;
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }

          .mobile-challenge-block:active {
            background-color: rgba(8, 28, 58, 0.95);
            border-color: rgba(56, 189, 248, 0.4);
          }

          .mobile-block-code {
            font-family: var(--font-mono, monospace);
            font-size: 0.56rem;
            color: #38BDF8;
            letter-spacing: 0.08em;
            font-weight: 600;
            text-transform: uppercase;
            line-height: 1;
            overflow-wrap: break-word;
          }

          .mobile-block-title {
            font-size: 0.8rem;
            font-weight: 600;
            color: #F8FAFC;
            letter-spacing: -0.01em;
            margin: 0;
            line-height: 1.25;
            word-break: break-word;
            overflow-wrap: break-word;
            min-width: 0;
          }

          .mobile-block-desc {
            font-size: 0.68rem;
            color: #94A3B8;
            line-height: 1.35;
            margin: 0;
            font-weight: 300;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: break-word;
            overflow-wrap: break-word;
          }

          .mobile-block-action {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            color: #38BDF8;
            font-family: var(--font-mono, monospace);
            font-size: 0.62rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-top: 0.15rem;
          }
        }

        @media (max-width: 380px) {
          .challenges-mobile-grid {
            gap: 0.4rem;
          }
          .mobile-challenge-block {
            padding: 0.55rem 0.55rem;
            gap: 0.3rem;
          }
          .mobile-block-title {
            font-size: 0.75rem;
          }
          .mobile-block-desc {
            font-size: 0.65rem;
            -webkit-line-clamp: 2;
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
            marginBottom: '0.45rem',
            fontWeight: 600,
          }}
        >
          CHALLENGES WE SOLVE
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.75rem, 3.2vw, 2.65rem)',
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: '#F8FAFF',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}
        >
          What are you trying to improve?
        </h2>
        <p
          style={{
            fontSize: 'clamp(0.88rem, 1.15vw, 1.02rem)',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: 'clamp(1.25rem, 2.5vh, 2rem)',
            maxWidth: 640,
            fontWeight: 300,
          }}
        >
          Modern organizations face operational bottlenecks and disconnected data. We engineer software systems to eliminate friction and scale productivity.
        </p>

        {/* ─── Desktop View: Interactive Expanding Horizontal Bars ─── */}
        <div className="challenges-desktop-list">
          {CHALLENGES.map((item, idx) => {
            const isExpanded = hoveredIdx === idx;

            return (
              <Link
                key={idx}
                href={item.link}
                className={`challenge-tab-card ${isExpanded ? 'is-expanded' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                aria-expanded={isExpanded}
              >
                <div className="challenge-card-header">
                  <div className="challenge-card-title-group">
                    <span className="challenge-card-code">{item.code}</span>
                    <h3 className="challenge-card-title">{item.title}</h3>
                  </div>
                  <div className="challenge-card-indicator">
                    <span>{isExpanded ? item.action : '+'}</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="challenge-card-expandable">
                  <div className="challenge-card-expandable-content">
                    <p className="challenge-card-desc">{item.desc}</p>
                    <div className="challenge-card-cta">
                      <span>{item.action}</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ─── Mobile View: Compact 2x2 Blocks with Small Font (Zero Hover/Jump) ─── */}
        <div className="challenges-mobile-grid">
          {CHALLENGES.map((item, idx) => (
            <Link key={idx} href={item.link} className="mobile-challenge-block">
              <div>
                <span className="mobile-block-code">{item.code}</span>
                <h3 className="mobile-block-title">{item.title}</h3>
              </div>
              <p className="mobile-block-desc">{item.desc}</p>
              <div className="mobile-block-action">
                <span>{item.action}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
