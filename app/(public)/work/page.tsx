import prisma from '@/lib/db'
import Link from 'next/link'

export const dynamic = "force-dynamic";

export default async function WorkPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => [])

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.04 / RESULTS</div>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          CASE<br />STUDIES.
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-48)' }}>
        {caseStudies.map((study, index) => (
          <div key={study.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-12)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 'clamp(4rem, 10vw, 10rem)', fontWeight: 700, color: 'var(--color-border-2)', lineHeight: 0.8, letterSpacing: '-0.05em', fontFamily: 'var(--font-mono)' }}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="eyebrow">{study.industry}</div>
                <div className="eyebrow">{study.year}</div>
              </div>
            </div>

            <Link href={`/work/${study.slug}`} style={{ textDecoration: 'none' }}>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', textTransform: 'uppercase', marginBottom: 'var(--space-6)', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-core)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}>
                {study.title}
              </h2>
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-12)' }}>
              <div>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
                  {study.problem}
                </p>
                <div style={{ marginTop: 'var(--space-6)' }}>
                   <Link href={`/work/${study.slug}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                      letterSpacing: '0.2em', color: 'var(--color-text-primary)',
                      textDecoration: 'none', borderBottom: '1px solid var(--color-border-2)', paddingBottom: '0.25rem',
                      transition: 'border-color 0.2s',
                    }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-core)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-2)'}>
                      READ CASE STUDY ↗
                    </Link>
                </div>
              </div>
              
              {/* Optional metrics or tags could go here */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-6)' }}>
                 <div className="eyebrow">TECHNOLOGIES USED</div>
                 <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                   {study.technologies.split(',').map(t => <div key={t}>{t.trim()}</div>)}
                 </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
