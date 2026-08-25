import prisma from '@/lib/db'
import Link from 'next/link'
import { createPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata = createPageMetadata({
  title: 'Selected Deployments & Client Case Studies — Quantum AI',
  description: 'Explore production deployments, operational software platforms, and custom AI systems engineered for enterprise clients.',
  path: '/work',
})

export default async function WorkPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => [])

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', paddingInline: 'clamp(1rem, 5vw, 4rem)', minHeight: '100vh', background: 'var(--color-void, #030712)' }}>
      <style>{`
        .works-grid-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }
        .work-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 1.15rem clamp(1rem, 2.5vw, 1.75rem);
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s, background-color 0.2s;
          box-sizing: border-box;
          width: 100%;
          text-decoration: none;
        }
        .work-card:hover {
          background-color: rgba(8, 28, 58, 0.8);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.2);
        }
        .work-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .work-eyebrow {
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          color: #38BDF8;
          letter-spacing: 0.15em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .work-client {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #94A3B8;
        }
        .work-title {
          font-size: clamp(1.1rem, 2vw, 1.35rem);
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.015em;
          text-transform: none;
          line-height: 1.25;
          transition: color 0.2s;
        }
        .work-title:hover {
          color: #38BDF8;
        }
        .work-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          max-width: 800px;
          margin: 0;
          font-weight: 300;
        }
        .work-tech-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        @media (max-width: 767px) {
          .work-card {
            padding: 0.9rem 1rem;
            gap: 0.5rem;
          }
          .work-title {
            font-size: 0.95rem !important;
          }
          .work-desc {
            font-size: 0.8125rem !important;
            line-height: 1.45 !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', letterSpacing: '0.25em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
            [04 — OUR WORK]
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em', color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            SELECTED DEPLOYMENTS & CASE STUDIES.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#94A3B8', maxWidth: 640, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
            Production software platforms, enterprise automation engines, and custom AI systems delivered by Quantum AI.
          </p>
        </div>

        {/* Empty State */}
        {caseStudies.length === 0 ? (
          <div style={{
            background: 'rgba(6, 21, 43, 0.4)',
            border: '1px dashed rgba(22, 119, 255, 0.25)',
            borderRadius: 14,
            padding: '5rem 2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', color: '#1677FF', marginBottom: '1rem' }}>
              COMING SOON
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.75rem' }}>
              Case Studies In Review
            </h2>
            <p style={{ color: '#64748B', maxWidth: 460, margin: '0 auto 2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Our engineering case studies are currently being curated. Contact us to learn more about our past enterprise work.
            </p>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                padding: '0.75rem 1.75rem',
                backgroundColor: '#1677FF',
                borderRadius: 8,
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              Start a Project →
            </Link>
          </div>
        ) : (
          <div className="works-grid-container">
            {caseStudies.map((study, index) => {
              const techList = study.technologies ? study.technologies.split(',').map((t: string) => t.trim()) : []

              return (
                <div key={study.id} className="work-card">
                  <div>
                    {/* Top Bar: Number + Industry + Year */}
                    <div
                      className="work-card-header"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                        paddingBottom: '0.85rem',
                        marginBottom: '0.65rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="work-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: '#38BDF8' }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {study.client && (
                          <span className="work-desktop-only" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            {study.client}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span
                          className="work-category-badge"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: '#38BDF8',
                            backgroundColor: 'rgba(22, 119, 255, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                          }}
                        >
                          {study.industry ? study.industry.split('/')[0].trim() : 'Technology'}
                        </span>
                        <span className="work-desktop-only" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B' }}>
                          {study.year || new Date().getFullYear()}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <Link href={`/work/${study.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '0.45rem' }}>
                      <h2 className="work-title">
                        {study.title}
                      </h2>
                    </Link>

                    {/* Description / Problem */}
                    <p className="work-desc">
                      {study.problem || study.solution}
                    </p>

                    {/* Tech Tags (Desktop/Tablet Only) */}
                    {techList.length > 0 && (
                      <div className="work-tech-container">
                        {techList.map((t: string) => (
                          <span
                            key={t}
                            style={{
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '0.25rem 0.65rem',
                              backgroundColor: 'rgba(22, 119, 255, 0.08)',
                              border: '1px solid rgba(22, 119, 255, 0.15)',
                              borderRadius: 4,
                              color: '#55D6FF',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Link */}
                  <div className="work-action-link" style={{ paddingTop: '0.5rem' }}>
                    <Link
                      href={`/work/${study.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        letterSpacing: '0.1em',
                        color: '#38BDF8',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      READ CASE STUDY ↗
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
