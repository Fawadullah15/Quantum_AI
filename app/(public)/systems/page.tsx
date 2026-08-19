import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Intelligent Systems Architecture — Quantum AI',
  description: 'Neural systems, autonomous agent nodes, and operational computational architectures.',
};

export default async function SystemsPage() {
  const services = await prisma.service.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => []);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) * 2)', paddingBottom: 'var(--space-32, 6rem)', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-32, 4rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>SYS.03 / NEURAL NETWORK</div>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            INTELLIGENT<br />SYSTEMS.
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-16, 2.5rem)' }}>
          {services.map((service: any, index: number) => (
            <div key={service.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8, 1.5rem)', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-8, 1.5rem)' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-border-2, rgba(255,255,255,0.2))', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.5rem' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
                  {service.name}
                </h2>
              </div>
              <div>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.6, margin: 0 }}>
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
