'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface ChallengeItem {
  code: string;
  title: string;
  desc: string;
  link: string;
  action: string;
}

const CHALLENGES: ChallengeItem[] = [
  {
    code: '01 // OPERATIONS',
    title: 'Manual Operations',
    desc: 'Replace repetitive, error-prone manual tasks with reliable software workflows and automated pipelines that run 24/7.',
    link: '/services#automation',
    action: 'Automate',
  },
  {
    code: '02 // INTEGRATION',
    title: 'Disconnected Data',
    desc: 'Bring fragmented spreadsheets, legacy databases, and third-party tools into a single, cohesive source of truth.',
    link: '/services#software',
    action: 'Integrate',
  },
  {
    code: '03 // SPEED',
    title: 'Slow Workflows',
    desc: 'Build intuitive internal tools and dashboards that accelerate execution and eliminate delays.',
    link: '/services#software',
    action: 'Accelerate',
  },
  {
    code: '04 // ARCHITECTURE',
    title: 'Complex Business Processes',
    desc: 'Turn difficult operational procedures and domain logic into clear, structured, and scalable digital systems.',
    link: '/services#ai',
    action: 'Architect',
  },
];

export default function ChallengesSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileActiveIdx, setMobileActiveIdx] = useState<number>(0);
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Detect touch devices
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Viewport Center Detection for Mobile / Touch Devices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowCenter = window.innerHeight / 2;
          let closestIdx = 0;
          let minDistance = Infinity;

          cardRefs.current.forEach((el, idx) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const distance = Math.abs(windowCenter - cardCenter);

            // If card is on screen, check distance to center
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
              if (distance < minDistance) {
                minDistance = distance;
                closestIdx = idx;
              }
            }
          });

          // Only activate if the card is reasonably close to center (within 35% of viewport)
          if (minDistance < window.innerHeight * 0.35) {
            setMobileActiveIdx(closestIdx);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      style={{
        padding: 'clamp(2.5rem, 5vh, 4rem) clamp(1rem, 5vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(4, 14, 36, 0.5)',
        borderTop: '1px solid rgba(22, 119, 255, 0.08)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.08)',
      }}
    >
      <style>{`
        .challenges-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
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
          align-items: baseline;
          gap: clamp(0.75rem, 2vw, 1.5rem);
          flex-wrap: wrap;
          min-width: 0;
        }

        .challenge-card-code {
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          color: #38BDF8;
          letter-spacing: 0.15em;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
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
          word-break: normal;
          overflow-wrap: normal;
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

        /* ─── Smooth CSS Grid Expansion for Collapsible Body ─── */
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

        @media (max-width: 768px) {
          .challenge-tab-card {
            padding: 0.8rem 1rem;
          }
          .challenge-card-title-group {
            flex-direction: column;
            gap: 0.2rem;
            align-items: flex-start;
          }
          .challenge-card-title {
            font-size: 0.98rem;
          }
          .challenge-card-desc {
            font-size: 0.8125rem;
            line-height: 1.45;
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
            marginBottom: '0.5rem',
            fontWeight: 600,
          }}
        >
          CHALLENGES WE SOLVE
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 2.8vw, 2.25rem)',
            fontWeight: 700,
            lineHeight: 1.15,
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
            fontSize: 'clamp(0.88rem, 1.3vw, 0.98rem)',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: 'clamp(1.25rem, 2.5vh, 2rem)',
            maxWidth: 640,
            fontWeight: 300,
          }}
        >
          Modern organizations face operational bottlenecks and disconnected data. We engineer software systems to eliminate friction and scale productivity.
        </p>

        {/* Interactive Compact Cards */}
        <div className="challenges-list">
          {CHALLENGES.map((item, idx) => {
            // Determine if card is expanded:
            // On desktop/mouse: expanded when hovered or focused
            // On touch/mobile: expanded when active via center-screen detection or tapped
            const isHovered = hoveredIdx === idx;
            const isMobileActive = isTouch && mobileActiveIdx === idx;
            const isExpanded = isHovered || isMobileActive;

            return (
              <Link
                key={idx}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                href={item.link}
                className={`challenge-tab-card ${isExpanded ? 'is-expanded' : ''}`}
                onMouseEnter={() => !isTouch && setHoveredIdx(idx)}
                onMouseLeave={() => !isTouch && setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                onClick={() => {
                  if (isTouch && mobileActiveIdx !== idx) {
                    setMobileActiveIdx(idx);
                  }
                }}
                aria-expanded={isExpanded}
              >
                {/* Default Visible Top Row */}
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

                {/* Smoothly Revealed Content on Interaction */}
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
      </div>
    </section>
  );
}
