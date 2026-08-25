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
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container">
      <div style={{ maxWidth: 'var(--max-width, 1000px)', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>SYS.03 / NEURAL NETWORK</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            INTELLIGENT SYSTEMS.
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {services.map((service: any, index: number) => (
            <div key={service.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'rgba(56, 189, 248, 0.4)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.35rem' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
                  {service.name}
                </h2>
              </div>
              <div>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.6, margin: 0 }}>
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
