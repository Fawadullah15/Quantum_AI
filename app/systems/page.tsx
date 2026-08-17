import prisma from '@/lib/db'

export default async function SystemsPage() {
  const services = await prisma.service.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  })

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.03 / NEURAL NETWORK</div>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          INTELLIGENT<br />SYSTEMS.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-16)' }}>
        {services.map((service, index) => (
          <div key={service.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-8)' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-border-2)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
                {service.name}
              </h2>
            </div>
            <div>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
