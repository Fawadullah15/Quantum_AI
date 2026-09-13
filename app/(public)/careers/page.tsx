import Link from 'next/link';
import prisma from '@/lib/db';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Engineering Careers & Open Roles — Quantum AI',
  description: 'Join the engineering and research team at Quantum AI. Explore open positions in AI systems, backend architecture, and product design.',
  path: '/careers',
});

const defaultRoles = [
  { department: 'AI Engineering', title: 'Senior AI Engineer', workType: 'Full-time · Remote' },
  { department: 'Infrastructure', title: 'Backend Systems Architect', workType: 'Full-time · Remote' },
  { department: 'Product Design', title: 'Senior Product Designer', workType: 'Full-time · Remote' },
  { department: 'Product Management', title: 'Product Manager – AI Systems', workType: 'Full-time · Remote' },
  { department: 'Research', title: 'AI Research Engineer', workType: 'Full-time · Remote' },
];

export default async function CareersPage() {
  const dbPositions = await prisma.careerPosition.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  }).catch(() => []);

  const displayRoles = dbPositions.length > 0
    ? dbPositions.map((p) => ({
        department: p.department || 'AI Engineering',
        title: p.title,
        workType: p.workType || 'Full-time · Remote',
      }))
    : defaultRoles;

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container">
      <div style={{ maxWidth: 'var(--max-width, 1000px)', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
            SYS.12 / ORBITAL SYSTEM
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            JOIN THE SYSTEM.
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            We build autonomous intelligence infrastructure, high-throughput cognitive systems, and bespoke enterprise models.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.5rem' }}>
          {displayRoles.map((role, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                borderBottom: '1px solid var(--color-border, rgba(30,58,138,0.22))',
                paddingBottom: '1.25rem',
                alignItems: 'center',
              }}
            >
              <div>
                <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  DEPARTMENT / {role.department}
                </div>
                <h2 style={{ fontSize: 'clamp(1.05rem, 2vw, 1.35rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)', margin: 0 }}>
                  {role.title}
                </h2>
              </div>

              <div style={{ color: 'var(--color-text-secondary, #94A3B8)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
                {role.workType}
              </div>

              <div>
                <Link
                  href={`/careers-partnerships?tab=career&role=${encodeURIComponent(role.title)}`}
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    color: '#1677FF',
                    textDecoration: 'none',
                    border: '1px solid rgba(22, 119, 255, 0.5)',
                    padding: '0.45rem 1.1rem',
                    borderRadius: 6,
                    transition: 'all 0.2s',
                    backgroundColor: 'rgba(22, 119, 255, 0.08)',
                  }}
                >
                  APPLY NOW →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-16, 3rem)', color: 'var(--color-text-secondary, #94A3B8)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem' }}>
          No suitable role? Write to us directly at{' '}
          <a href="mailto:careers@quantumai.dev" style={{ color: '#1677FF', textDecoration: 'none' }}>
            careers@quantumai.dev
          </a>
        </div>
      </div>
    </div>
  );
}
