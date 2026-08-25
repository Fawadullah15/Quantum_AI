'use client';

import React from 'react';
import { NovaButton } from '@/components/ui/Buttons';

interface PhilosophyItem {
  step: string;
  title: string;
  desc: string;
}

const PHILOSOPHY_ITEMS: PhilosophyItem[] = [
  {
    step: '01',
    title: 'Understand First',
    desc: 'Study the problem before building the solution.',
  },
  {
    step: '02',
    title: 'Build Smarter',
    desc: 'Choose technology for value, not hype.',
  },
  {
    step: '03',
    title: 'Keep it Human',
    desc: 'Powerful systems should feel simple to use.',
  },
  {
    step: '04',
    title: 'Create What Matters',
    desc: 'Build technology with real purpose and value.',
  },
];

export default function WhyQuantumSection() {
  return (
    <section
      style={{
        padding: 'clamp(2.5rem, 5vh, 4rem) clamp(1rem, 5vw, 6rem)',
        pointerEvents: 'auto',
      }}
    >
      <style>{`
        .why-quantum-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: clamp(2rem, 4vw, 4rem);
          align-items: center;
        }

        .why-left-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .why-right-cards {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
        }

        .think-deeper-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 0.75rem clamp(0.85rem, 2vw, 1.25rem);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          box-sizing: border-box;
          transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .think-deeper-card:hover {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px -4px rgba(22, 119, 255, 0.2);
        }

        .think-card-num {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #38BDF8;
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .think-card-title {
          font-size: clamp(0.98rem, 1.5vw, 1.08rem);
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.01em;
          margin: 0;
          text-transform: none;
          line-height: 1.3;
        }

        .think-card-desc {
          color: #94A3B8;
          font-size: 0.84rem;
          line-height: 1.45;
          margin: 0;
          font-weight: 300;
        }

        /* ═══════════════════════════════════════════════════════════
           TABLET & MOBILE BREAKPOINTS
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 900px) {
          .why-quantum-container {
            grid-template-columns: 1fr;
            gap: 2.25rem;
          }
        }

        @media (max-width: 768px) {
          .why-right-cards {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.55rem;
          }

          .think-deeper-card {
            padding: 0.75rem 0.85rem;
            min-height: 105px;
            justify-content: flex-start;
          }

          .think-card-num {
            font-size: 0.62rem;
          }

          .think-card-title {
            font-size: 0.84rem;
            line-height: 1.25;
          }

          .think-card-desc {
            font-size: 0.75rem;
            line-height: 1.35;
          }
        }

        @media (max-width: 380px) {
          .think-deeper-card {
            padding: 0.65rem 0.75rem;
            min-height: 98px;
          }
          .think-card-title {
            font-size: 0.78rem;
          }
          .think-card-desc {
            font-size: 0.7rem;
          }
        }
      `}</style>

      <div className="why-quantum-container">
        {/* Left Column: Core Statement & CTA */}
        <div className="why-left-content">
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
            WHY QUANTUM AI.
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.35rem, 2.5vw, 2.1rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: '#F8FAFF',
              marginBottom: '0.65rem',
              textTransform: 'uppercase',
              maxWidth: 560,
            }}
          >
            We turn complex problems into intelligent, useful systems.
          </h2>
          <p
            style={{
              fontSize: 'clamp(0.85rem, 1.2vw, 0.95rem)',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '1.35rem',
              fontWeight: 300,
              maxWidth: 520,
            }}
          >
            We combine AI, software, and thoughtful engineering to build technology that solves real problems and creates lasting value.
          </p>
          <NovaButton href="/about">LEARN MORE ABOUT US</NovaButton>
        </div>

        {/* Right Column: THINK DEEPER Philosophy Cards */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: '#38BDF8',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: '0.65rem',
              paddingBottom: '0.4rem',
              borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>THINK DEEPER</span>
            <span style={{ color: '#64748B', fontSize: '0.6rem' }}>[PHILOSOPHY]</span>
          </div>

          <div className="why-right-cards">
            {PHILOSOPHY_ITEMS.map((item, i) => (
              <div key={i} className="think-deeper-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="think-card-num">{item.step}</span>
                  <h3 className="think-card-title">{item.title}</h3>
                </div>
                <p className="think-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
