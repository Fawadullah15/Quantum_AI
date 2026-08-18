import prisma from '@/lib/db'

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  })

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)', paddingBottom: 'var(--space-32)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.08 / SERVICES</div>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 10rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          CAPABILITIES.
        </h1>
      </div>

      <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-16)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
        {services.map((service, idx) => (
          <div key={service.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="eyebrow">MODULE {String(idx + 1).padStart(2, '0')}</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{service.name}</h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {service.description}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        .services-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1024px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
