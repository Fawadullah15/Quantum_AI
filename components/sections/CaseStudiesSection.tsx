'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CaseStudyItem {
  step: string;
  industry: string;
  year: string;
  title: string;
  desc: string;
  technologies: string[];
  slug: string;
  image?: string;
  gradient: string;
  accentIcon: string;
}

const CASE_STUDIES: CaseStudyItem[] = [
  {
    step: '01',
    industry: 'Education',
    year: '2026',
    title: 'School Operations Manager',
    desc: 'Built for educational institutions to eliminate fragmented paper records and spreadsheets by centralizing student registries, attendance, fee collection, and administrative reporting into one real-time platform.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
    slug: 'school-operations-manager',
    gradient: 'linear-gradient(135deg, #061A3A 0%, #0F2B5C 100%)',
    accentIcon: '🎓',
  },
  {
    step: '02',
    industry: 'Retail',
    year: '2026',
    title: 'Offline Shop Management System',
    desc: 'Built for retail businesses operating in areas with unstable internet to ensure point-of-sale transactions, product inventory, and daily sales tracking work seamlessly offline with automatic cloud sync.',
    technologies: ['Python', 'FastAPI', 'SQLAlchemy', 'SQLite', 'React'],
    slug: 'offline-shop-management-system',
    gradient: 'linear-gradient(135deg, #091C36 0%, #113665 100%)',
    accentIcon: '🛍️',
  },
  {
    step: '03',
    industry: 'Technology',
    year: '2026',
    title: 'Quantum AI Corporate Website',
    desc: 'Designed as a high-performance corporate platform to showcase deployed software systems, interactive technology demos, and live client inquiry pipelines with zero layout latency.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Prisma'],
    slug: 'quantum-ai-corporate-website',
    gradient: 'linear-gradient(135deg, #071630 0%, #133B70 100%)',
    accentIcon: '⚡',
  },
  {
    step: '04',
    industry: 'Nonprofit',
    year: '2026',
    title: 'Youth Development Program Website',
    desc: 'Engineered for community organizations to centralize leadership registries, regional chapter initiatives, and public announcements into a secure, accessible web portal.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Prisma'],
    slug: 'youth-development-program-website',
    gradient: 'linear-gradient(135deg, #051A2E 0%, #0A3258 100%)',
    accentIcon: '🌐',
  },
];

export default function CaseStudiesSection({ initialStudies }: { initialStudies?: any[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [studies, setStudies] = useState<any[]>(initialStudies || CASE_STUDIES);

  React.useEffect(() => {
    fetch('/api/case-studies')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const published = data.filter((s: any) => s.published !== false);
          if (published.length > 0) {
            const mapped = published.slice(0, 4).map((s: any, i: number) => ({
              step: String(i + 1).padStart(2, '0'),
              industry: s.industry ? s.industry.split('/')[0].trim() : 'Technology',
              year: String(s.year || new Date().getFullYear()),
              title: s.title,
              desc: s.problem || s.solution || '',
              technologies: s.technologies
                ? s.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
                : ['Next.js', 'TypeScript', 'Prisma'],
              slug: s.slug,
              image: s.heroImage || undefined,
              gradient: i % 2 === 0 ? 'linear-gradient(135deg, #061A3A 0%, #0F2B5C 100%)' : 'linear-gradient(135deg, #091C36 0%, #113665 100%)',
              accentIcon: '⚡',
            }));
            setStudies(mapped);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      style={{
        padding: 'clamp(2.5rem, 5vh, 4rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(6, 21, 43, 0.25)',
        borderTop: '1px solid rgba(22, 119, 255, 0.08)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           DESKTOP LAYOUT (> 768px): Compact Horizontal Cards with Image & Hover Reveal
        ═══════════════════════════════════════════════════════════ */
        .case-studies-desktop-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          width: 100%;
        }

        .case-studies-mobile-grid {
          display: none;
        }

        .cs-tab-card {
          position: relative;
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 12px;
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

        .cs-tab-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }

        .cs-tab-card.is-expanded {
          background-color: rgba(8, 28, 58, 0.88);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
          transform: translateY(-1px);
        }

        .cs-card-header {
          display: flex;
          align-items: center;
          gap: clamp(1rem, 2.5vw, 1.75rem);
          width: 100%;
        }

        /* Compact Desktop Image Thumbnail */
        .cs-thumb-wrapper {
          width: 130px;
          height: 78px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
          border: 1px solid rgba(56, 189, 248, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        }

        .cs-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cs-thumb-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
          color: #38BDF8;
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .cs-card-middle {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex-grow: 1;
          min-width: 0;
        }

        .cs-card-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          color: #38BDF8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .cs-card-meta-dot {
          color: #64748B;
        }

        .cs-card-meta-year {
          color: #94A3B8;
        }

        .cs-card-title {
          font-size: clamp(1.05rem, 1.8vw, 1.25rem);
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.015em;
          margin: 0;
          text-transform: none;
          line-height: 1.25;
          white-space: normal;
        }

        .cs-card-indicator {
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

        .cs-tab-card.is-expanded .cs-card-indicator {
          color: #38BDF8;
        }

        /* ─── Smooth Expandable Content ─── */
        .cs-card-expandable {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin-top 0.25s ease;
          margin-top: 0;
        }

        .cs-tab-card.is-expanded .cs-card-expandable {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 0.75rem;
        }

        .cs-card-expandable-content {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-top: 0.25rem;
          border-top: 1px solid rgba(22, 119, 255, 0.1);
        }

        .cs-card-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
          max-width: 900px;
        }

        .cs-card-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cs-tech-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .cs-tech-pill {
          font-size: 0.68rem;
          color: #55D6FF;
          background-color: rgba(22, 119, 255, 0.08);
          border: 1px solid rgba(22, 119, 255, 0.18);
          padding: 0.12rem 0.45rem;
          border-radius: 4px;
          font-family: var(--font-mono, monospace);
        }

        .cs-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #38BDF8;
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          font-weight: 700;
          text-transform: uppercase;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .cs-tab-card:hover .cs-card-cta {
          color: #55D6FF;
          transform: translateX(3px);
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE LAYOUT (<= 768px): Clean 2x2 Grid with Project Photos
           (No hover effect, no expansion, compact and scannable)
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .case-studies-desktop-list {
            display: none !important;
          }

          .case-studies-mobile-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .mobile-cs-tile {
            background: rgba(6, 21, 43, 0.75);
            border: 1px solid rgba(22, 119, 255, 0.16);
            border-radius: 8px;
            padding: 0.55rem;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            box-sizing: border-box;
            overflow: hidden;
            min-width: 0;
            width: 100%;
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }

          .mobile-cs-tile:active {
            background-color: rgba(8, 28, 58, 0.95);
            border-color: rgba(56, 189, 248, 0.4);
          }

          .mobile-cs-img-wrap {
            width: 100%;
            aspect-ratio: 16 / 10;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid rgba(56, 189, 248, 0.2);
            position: relative;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }

          .mobile-cs-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .mobile-cs-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.25rem;
            font-family: var(--font-mono, monospace);
            font-size: 0.56rem;
            color: #38BDF8;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 600;
            line-height: 1.2;
            margin-top: 0.15rem;
            word-break: break-word;
            overflow-wrap: break-word;
            min-width: 0;
          }

          .mobile-cs-title {
            font-size: 0.78rem;
            font-weight: 600;
            color: #F8FAFC;
            letter-spacing: -0.01em;
            margin: 0;
            line-height: 1.25;
            word-break: break-word;
            overflow-wrap: break-word;
            min-width: 0;
          }

          .mobile-cs-arrow {
            font-family: var(--font-mono, monospace);
            font-size: 0.65rem;
            color: #38BDF8;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 0.2rem;
            margin-top: auto;
            padding-top: 0.2rem;
          }
        }

        @media (max-width: 380px) {
          .mobile-cs-tile {
            padding: 0.55rem;
            gap: 0.35rem;
          }
          .mobile-cs-title {
            font-size: 0.75rem;
          }
          .mobile-cs-meta {
            font-size: 0.52rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header with Heading & Link to /work */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 'clamp(1.25rem, 2.5vh, 2rem)',
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
              CASE STUDIES
            </p>
            <h2
              className="section-heading"
              style={{
                fontSize: 'clamp(2.5rem, 4.8vw, 3.85rem)',
                fontWeight: 700,
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                color: '#F8FAFF',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Selected deployments.
            </h2>
          </div>

          <Link
            href="/work"
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
            View all case studies <span>→</span>
          </Link>
        </div>

        {/* ─── Desktop View: Interactive Compact Cards with Photos & Hover Reveal ─── */}
        <div className="case-studies-desktop-list">
          {studies.map((study, idx) => {
            const isExpanded = hoveredIdx === idx;

            return (
              <Link
                key={idx}
                href={`/work/${study.slug}`}
                className={`cs-tab-card ${isExpanded ? 'is-expanded' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                aria-expanded={isExpanded}
              >
                {/* Default Visible Header Row (Photo + Meta + Title) */}
                <div className="cs-card-header">
                  <div className="cs-thumb-wrapper" style={{ background: study.gradient }}>
                    {study.image ? (
                      <img src={study.image} alt={study.title} className="cs-thumb-img" />
                    ) : (
                      <div className="cs-thumb-fallback">
                        <span style={{ fontSize: '1.25rem' }}>{study.accentIcon}</span>
                        <span>{study.industry}</span>
                      </div>
                    )}
                  </div>

                  <div className="cs-card-middle">
                    <div className="cs-card-meta">
                      <span>{study.industry}</span>
                      <span className="cs-card-meta-dot">·</span>
                      <span className="cs-card-meta-year">{study.year}</span>
                    </div>
                    <h3 className="cs-card-title">{study.title}</h3>
                  </div>

                  <div className="cs-card-indicator">
                    <span>{isExpanded ? 'VIEW' : '+'}</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Smoothly Revealed Content on Hover / Focus */}
                <div className="cs-card-expandable">
                  <div className="cs-card-expandable-content">
                    <p className="cs-card-desc">{study.desc}</p>
                    <div className="cs-card-bottom-row">
                      <div className="cs-tech-pills">
                        {study.technologies.map((t: string) => (
                          <span key={t} className="cs-tech-pill">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="cs-card-cta">
                        <span>VIEW CASE STUDY</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ─── Mobile View: Clean 2x2 Grid with Project Photos (No Hover) ─── */}
        <div className="case-studies-mobile-grid">
          {studies.map((study, idx) => (
            <Link key={idx} href={`/work/${study.slug}`} className="mobile-cs-tile">
              <div className="mobile-cs-img-wrap" style={{ background: study.gradient }}>
                {study.image ? (
                  <img src={study.image} alt={study.title} className="mobile-cs-img" />
                ) : (
                  <div className="cs-thumb-fallback">
                    <span style={{ fontSize: '1.1rem' }}>{study.accentIcon}</span>
                    <span style={{ fontSize: '0.55rem' }}>{study.industry}</span>
                  </div>
                )}
              </div>

              <div className="mobile-cs-meta">
                <span>{study.industry}</span>
                <span style={{ color: '#64748B' }}>·</span>
                <span style={{ color: '#94A3B8' }}>{study.year}</span>
              </div>

              <h3 className="mobile-cs-title">{study.title}</h3>

              <div className="mobile-cs-arrow">
                <span>VIEW</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
