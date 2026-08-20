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
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) + 3.5rem)', paddingBottom: '6rem', paddingInline: 'clamp(1.25rem, 5vw, 4rem)', minHeight: '100vh', background: 'var(--color-void, #030712)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', letterSpacing: '0.25em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 600 }}>
            [04 — OUR WORK]
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 7.5vw, 6.5rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.045em', color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            SELECTED<br />DEPLOYMENTS.
          </h1>
          <p style={{ fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', color: '#94A3B8', maxWidth: 600, lineHeight: 1.7 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {caseStudies.map((study, index) => {
              const techList = study.technologies ? study.technologies.split(',').map((t: string) => t.trim()) : []

              return (
                <div
                  key={study.id}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.6)',
                    border: '1px solid rgba(22, 119, 255, 0.15)',
                    borderRadius: 14,
                    padding: 'clamp(1.75rem, 4vw, 3rem)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    transition: 'border-color 0.25s, transform 0.25s',
                  }}
                >
                  {/* Top Bar: Number + Industry + Year */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(22, 119, 255, 0.1)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#38BDF8' }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {study.client && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {study.client}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#1677FF', backgroundColor: 'rgba(22, 119, 255, 0.1)', padding: '0.2rem 0.6rem', borderRadius: 4, textTransform: 'uppercase' }}>
                        {study.industry || 'Technology'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B' }}>
                        {study.year || new Date().getFullYear()}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <Link href={`/work/${study.slug}`} style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em', textTransform: 'none', transition: 'color 0.2s' }}>
                      {study.title}
                    </h2>
                  </Link>

                  {/* Description / Problem */}
                  <p style={{ color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 780, margin: 0 }}>
                    {study.problem || study.solution}
                  </p>

                  {/* Tech Tags */}
                  {techList.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
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

                  {/* Bottom Action Link */}
                  <div style={{ paddingTop: '0.75rem' }}>
                    <Link
                      href={`/work/${study.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        letterSpacing: '0.12em',
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
