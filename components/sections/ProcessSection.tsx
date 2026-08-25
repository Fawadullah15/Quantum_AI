'use client';

import React, { useState } from 'react';

interface ProcessStep {
  step: string;
  name: string;
  desc: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    name: 'UNDERSTAND',
    desc: 'Study the business problem, operational context, and core requirements.',
  },
  {
    step: '02',
    name: 'DEFINE',
    desc: 'Scope the technical architecture, data workflows, user roles, and success milestones.',
  },
  {
    step: '03',
    name: 'DESIGN',
    desc: 'Plan the product interface, system data models, and API interfaces for maximum clarity.',
  },
  {
    step: '04',
    name: 'BUILD',
    desc: 'Develop, test, and refine the system using production-grade frameworks and rigorous validation.',
  },
  {
    step: '05',
    name: 'DEPLOY',
    desc: 'Launch, monitor, document, and support the solution in secure cloud environments.',
  },
];

export default function ProcessSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: 'clamp(2rem, 4.5vh, 3.5rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(6, 21, 43, 0.35)',
        borderTop: '1px solid rgba(22, 119, 255, 0.1)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           DESKTOP LAYOUT (> 768px): Compact Sequential Horizontal Rows
        ═══════════════════════════════════════════════════════════ */
        .process-desktop-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .process-mobile-grid {
          display: none;
        }

        .process-tab-card {
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

        .process-tab-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }

        .process-tab-card.is-expanded {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
          transform: translateY(-1px);
        }

        .process-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
        }

        .process-card-title-group {
          display: flex;
          align-items: center;
          gap: clamp(1rem, 2.5vw, 2rem);
          min-width: 0;
          flex: 1;
        }

        .process-step-label {
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

        .process-card-title {
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          font-weight: 600;
          color: #F8FAFF;
          letter-spacing: 0.04em;
          margin: 0;
          text-transform: uppercase;
          line-height: 1.3;
          white-space: normal;
        }

        .process-card-indicator {
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

        .process-tab-card.is-expanded .process-card-indicator {
          color: #38BDF8;
        }

        /* ─── Smooth Expandable Content ─── */
        .process-card-expandable {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin-top 0.25s ease;
          margin-top: 0;
        }

        .process-tab-card.is-expanded .process-card-expandable {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 0.65rem;
        }

        .process-card-expandable-content {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .process-card-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
          max-width: 800px;
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE LAYOUT (<= 768px): Clean 2-Column Process Grid
           (No hover effect, no expansion, compact and scannable)
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .process-desktop-list {
            display: none !important;
          }

          .process-mobile-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .mobile-process-tile {
            background: rgba(6, 21, 43, 0.75);
            border: 1px solid rgba(22, 119, 255, 0.16);
            border-radius: 8px;
            padding: 0.75rem 0.75rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 74px;
            box-sizing: border-box;
            min-width: 0;
            width: 100%;
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }

          .mobile-process-tile.tile-center {
            grid-column: 1 / -1;
            max-width: calc(50% - 0.25rem);
            margin: 0 auto;
            width: 100%;
          }

          .mobile-step-num {
            font-family: var(--font-mono, monospace);
            font-size: 0.62rem;
            color: #38BDF8;
            font-weight: 600;
            letter-spacing: 0.1em;
            margin-bottom: 0.25rem;
            display: block;
          }

          .mobile-step-title {
            font-size: 0.82rem;
            font-weight: 600;
            color: #F8FAFC;
            letter-spacing: 0.03em;
            margin: 0;
            text-transform: uppercase;
            line-height: 1.25;
            word-break: break-word;
            overflow-wrap: break-word;
            min-width: 0;
          }
        }

        @media (max-width: 480px) {
          .mobile-process-tile.tile-center {
            max-width: 100%;
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 380px) {
          .process-mobile-grid {
            gap: 0.4rem;
          }
          .mobile-process-tile {
            padding: 0.65rem 0.65rem;
            min-height: 66px;
          }
          .mobile-step-title {
            font-size: 0.76rem;
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
          HOW WE WORK
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
          A Clear, Structured Process.
        </h2>
        <p
          style={{
            fontSize: 'clamp(0.88rem, 1.15vw, 1.02rem)',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: 'clamp(1.25rem, 2.5vh, 2rem)',
            maxWidth: 600,
            fontWeight: 300,
          }}
        >
          We eliminate uncertainty from development through clear, iterative milestones from discovery to production launch.
        </p>

        {/* ─── Desktop View: Interactive Horizontal Process Rows with Hover Reveal ─── */}
        <div className="process-desktop-list">
          {PROCESS_STEPS.map((item, idx) => {
            const isExpanded = hoveredIdx === idx;

            return (
              <div
                key={idx}
                tabIndex={0}
                className={`process-tab-card ${isExpanded ? 'is-expanded' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                aria-expanded={isExpanded}
              >
                <div className="process-card-header">
                  <div className="process-card-title-group">
                    <span className="process-step-label">{item.step}</span>
                    <h3 className="process-card-title">{item.name}</h3>
                  </div>
                  <div className="process-card-indicator">
                    <span>{isExpanded ? 'ACTIVE' : '+'}</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="process-card-expandable">
                  <div className="process-card-expandable-content">
                    <p className="process-card-desc">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Mobile View: Clean 2-Column Grid (No Hover, Compact) ─── */}
        <div className="process-mobile-grid">
          {PROCESS_STEPS.map((item, idx) => {
            const isFifth = idx === 4;

            return (
              <div key={idx} className={`mobile-process-tile ${isFifth ? 'tile-center' : ''}`}>
                <div>
                  <span className="mobile-step-num">{item.step}</span>
                  <h3 className="mobile-step-title">{item.name}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
