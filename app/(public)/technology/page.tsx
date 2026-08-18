import prisma from '@/lib/db'

export default async function TechnologyPage() {
  const technologies = await prisma.technology.findMany({
    where: { published: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })

  // Group by category
  const grouped = technologies.reduce((acc, tech) => {
    if (!acc[tech.category]) acc[tech.category] = []
    acc[tech.category].push(tech)
    return acc
  }, {} as Record<string, typeof technologies>)

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.02 / ARCHITECTURE</div>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          CORE<br />TECHNOLOGY.
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-40)' }}>
        {Object.entries(grouped).map(([category, techs], groupIndex) => (
          <div key={category} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-12)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-12)' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-border-2)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                  {String(groupIndex + 1).padStart(2, '0')}
                </div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
                  {category}
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                {techs.map(tech => (
                  <div key={tech.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', borderBottom: '1px solid var(--color-border-2)', paddingBottom: 'var(--space-8)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
                      {tech.name}
                    </h3>
                    <div>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                        {tech.shortDescription}
                      </p>
                      {tech.usage && (
                        <div style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-core)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          USAGE: {tech.usage}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  )
}
