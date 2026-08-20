import prisma from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Works & Case Studies | Quantum AI',
  description: 'Real client software systems, platforms, and AI architectures delivered by Quantum AI.',
}

export default async function WorkPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => [])

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) + 3.5rem)', paddingBottom: '6rem', paddingInline: 'clamp(1rem, 5vw, 4rem)', minHeight: '100vh', background: 'var(--color-void, #030712)' }}>
      <style>{`
        .works-grid-container {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          width: 100%;
        }
        .work-card {
          background-color: rgba(6, 21, 43, 0.6);
          border: 1px solid rgba(22, 119, 255, 0.15);
          border-radius: 14px;
          padding: clamp(1.75rem, 4vw, 3rem);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
          box-sizing: border-box;
          height: 100%;
        }
        .work-card:hover {
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -10px rgba(22, 119, 255, 0.2);
        }
        .work-title {
          font-size: clamp(1.75rem, 4vw, 2.75rem);
          font-weight: 700;
          color: #F8FAFC;
          margin: 0;
          letter-spacing: -0.02em;
          text-transform: none;
          transition: color 0.2s;
        }
        .work-title:hover {
          color: #38BDF8;
        }
        .work-desc {
          color: #94A3B8;
          font-size: 1.05rem;
          line-height: 1.65;
          max-width: 780px;
          margin: 0;
        }
        .work-tech-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .work-desktop-only {
          display: block;
        }

        /* ─── Mobile 2-Column Responsive Layout ─── */
        @media (max-width: 767px) {
          .works-grid-container {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: clamp(0.5rem, 2.5vw, 0.85rem);
          }
          .work-card {
            padding: clamp(0.75rem, 3vw, 1.1rem);
            gap: 0.65rem;
            border-radius: 10px;
            justify-content: space-between;
          }
          .work-card-header {
            border-bottom: none !important;
            padding-bottom: 0 !important;
            gap: 0.35rem !important;
          }
          .work-num {
            font-size: 0.85rem !important;
          }
          .work-category-badge {
            font-size: 0.625rem !important;
            padding: 0.15rem 0.4rem !important;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .work-title {
            font-size: clamp(0.72rem, 2.7vw, 0.84rem) !important;
            line-height: 1.25 !important;
            letter-spacing: -0.01em !important;
            font-weight: 700 !important;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: normal;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          .work-desc {
            font-size: 0.6875rem !important;
            line-height: 1.35 !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .work-tech-container {
            display: none !important;
          }
          .work-desktop-only {
            display: none !important;
          }
          .work-action-link {
            font-size: 0.6875rem !important;
            padding-top: 0.25rem !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', letterSpacing: '0.25em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>
            [04 — OUR WORK]
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 7.5vw, 6rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.045em', color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            SELECTED<br />DEPLOYMENTS.
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.25rem)', color: '#94A3B8', maxWidth: 600, lineHeight: 1.65, margin: 0 }}>
            Production systems, automation engines, and enterprise AI software built for clients worldwide.
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
