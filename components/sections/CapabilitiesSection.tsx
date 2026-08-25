'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TechCategory {
  num: string;
  title: string;
  desc: string;
  tags: string[];
}

const TECH_CATEGORIES: TechCategory[] = [
  {
    num: '01',
    title: 'AI & MACHINE LEARNING',
    desc: 'Models, neural networks, retrieval platforms, and agentic workflows.',
    tags: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'RAG', 'AI Agents'],
  },
  {
    num: '02',
    title: 'APPLICATIONS',
    desc: 'Frontend applications and scalable backend APIs.',
    tags: ['Next.js', 'React', 'TypeScript', 'Node.js', 'FastAPI'],
  },
  {
    num: '03',
    title: 'DATA SYSTEMS',
    desc: 'Transactional, document, cache, and vector data systems.',
    tags: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Vector DB'],
  },
  {
    num: '04',
    title: 'INFRASTRUCTURE',
    desc: 'Cloud infrastructure, containers, security, and automation.',
    tags: ['Docker', 'AWS', 'Linux', 'REST APIs', 'DevOps'],
  },
];

export default function CapabilitiesSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: 'clamp(2rem, 4.5vh, 3.5rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(6, 21, 43, 0.3)',
        borderTop: '1px solid rgba(22, 119, 255, 0.08)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           DESKTOP LAYOUT (> 768px): Compact Expandable Tech Cards
        ═══════════════════════════════════════════════════════════ */
        .capabilities-desktop-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
        }

        .capabilities-mobile-grid {
          display: none;
        }

        .tech-tab-card {
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

        .tech-tab-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }

        .tech-tab-card.is-expanded {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
          transform: translateY(-1px);
        }

        .tech-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
        }

        .tech-card-title-group {
          display: flex;
          align-items: center;
          gap: clamp(1rem, 2.5vw, 2rem);
          min-width: 0;
          flex: 1;
        }

        .tech-card-num {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #38BDF8;
          font-weight: 600;
          letter-spacing: 0.1em;
          flex-shrink: 0;
          width: 45px;
          min-width: 45px;
          display: inline-block;
        }

        .tech-card-title {
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          font-weight: 600;
          color: #F8FAFF;
          letter-spacing: 0.02em;
          margin: 0;
          text-transform: uppercase;
          line-height: 1.3;
          white-space: normal;
        }

        .tech-card-indicator {
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

        .tech-tab-card.is-expanded .tech-card-indicator {
          color: #38BDF8;
        }

        /* ─── Smooth Expandable Content ─── */
        .tech-card-expandable {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin-top 0.25s ease;
          margin-top: 0;
        }

        .tech-tab-card.is-expanded .tech-card-expandable {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 0.75rem;
        }

        .tech-card-expandable-content {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-top: 0.35rem;
          border-top: 1px solid rgba(22, 119, 255, 0.1);
        }

        .tech-card-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
          max-width: 800px;
        }

        .tech-tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .tech-tag-badge {
          font-size: 0.7rem;
          font-family: var(--font-mono, monospace);
          padding: 0.15rem 0.5rem;
          background-color: rgba(22, 119, 255, 0.08);
          border: 1px solid rgba(22, 119, 255, 0.18);
          border-radius: 4px;
          color: #55D6FF;
          white-space: nowrap;
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE LAYOUT (<= 768px): Clean 2x2 Tech Grid
           (No hover effect, no expansion, compact and scannable)
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .capabilities-desktop-list {
            display: none !important;
          }

          .capabilities-mobile-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .mobile-tech-tile {
            background: rgba(6, 21, 43, 0.75);
            border: 1px solid rgba(22, 119, 255, 0.16);
            border-radius: 8px;
            padding: 0.75rem 0.75rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 78px;
            box-sizing: border-box;
            min-width: 0;
            width: 100%;
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }

          .mobile-tech-num {
            font-family: var(--font-mono, monospace);
            font-size: 0.62rem;
            color: #38BDF8;
            font-weight: 600;
            letter-spacing: 0.1em;
            margin-bottom: 0.25rem;
            display: block;
          }

          .mobile-tech-title {
            font-size: 0.8rem;
            font-weight: 600;
            color: #F8FAFC;
            letter-spacing: 0.02em;
            margin: 0;
            text-transform: uppercase;
            line-height: 1.25;
            word-break: break-word;
            overflow-wrap: break-word;
            min-width: 0;
          }
        }

        @media (max-width: 380px) {
          .capabilities-mobile-grid {
            gap: 0.4rem;
          }
          .mobile-tech-tile {
            padding: 0.65rem 0.65rem;
            min-height: 70px;
          }
          .mobile-tech-title {
            font-size: 0.74rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header with Title and Link */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 'clamp(1.5rem, 3vh, 2rem)',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
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
              CAPABILITIES
            </p>
            <h2
              className="section-heading"
              style={{
                fontSize: 'clamp(2.5rem, 4.8vw, 3.85rem)',
                fontWeight: 700,
                lineHeight: 1.02,
                color: '#F8FAFF',
                marginBottom: '0.65rem',
                letterSpacing: '-0.035em',
                textTransform: 'uppercase',
              }}
            >
              Our tech stack.
            </h2>
            <p
              className="section-desc"
              style={{
                fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
                color: '#94A3B8',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 580,
                fontWeight: 300,
              }}
            >
              Production technologies engineered for high uptime, clean code maintainability, and domain intelligence.
            </p>
          </div>

          <Link
            href="/technology"
            style={{
              color: '#38BDF8',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
            }}
          >
            View full technology stack <span>→</span>
          </Link>
        </div>

        {/* ─── Desktop View: Interactive Compact Tech Rows with Hover Reveal ─── */}
        <div className="capabilities-desktop-list">
          {TECH_CATEGORIES.map((group, idx) => {
            const isExpanded = hoveredIdx === idx;

            return (
              <div
                key={idx}
                tabIndex={0}
                className={`tech-tab-card ${isExpanded ? 'is-expanded' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                aria-expanded={isExpanded}
              >
                <div className="tech-card-header">
                  <div className="tech-card-title-group">
                    <span className="tech-card-num">{group.num}</span>
                    <h3 className="tech-card-title">{group.title}</h3>
                  </div>
                  <div className="tech-card-indicator">
                    <span>{isExpanded ? 'VIEWING' : '+'}</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="tech-card-expandable">
                  <div className="tech-card-expandable-content">
                    <p className="tech-card-desc">{group.desc}</p>
                    <div className="tech-tags-list">
                      {group.tags.map((t) => (
                        <span key={t} className="tech-tag-badge">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Mobile View: Clean 2x2 Grid (No Hover, Compact) ─── */}
        <div className="capabilities-mobile-grid">
          {TECH_CATEGORIES.map((group, idx) => (
            <div key={idx} className="mobile-tech-tile">
              <div>
                <span className="mobile-tech-num">{group.num}</span>
                <h3 className="mobile-tech-title">{group.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
