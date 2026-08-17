export default function CareersPage() {
  const roles = [
    { orbit: 'AI', title: 'Senior AI Engineer', type: 'Full-time · Remote' },
    { orbit: 'ENGINEERING', title: 'Backend Systems Architect', type: 'Full-time · Remote' },
    { orbit: 'DESIGN', title: 'Senior Product Designer', type: 'Full-time · Remote' },
    { orbit: 'PRODUCT', title: 'Product Manager – AI Systems', type: 'Full-time · Remote' },
    { orbit: 'RESEARCH', title: 'AI Research Engineer', type: 'Full-time · Remote' },
  ];

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)', paddingBottom: 'var(--space-32)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.12 / ORBITAL SYSTEM</div>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 10rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          JOIN<br />THE SYSTEM.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
        {roles.map((role, idx) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-8)', borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-8)', alignItems: 'center'
          }}>
            <div>
              <div className="tech-label" style={{ marginBottom: 'var(--space-2)' }}>ORBIT / {role.orbit}</div>
              <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{role.title}</h2>
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {role.type}
            </div>
            <div>
              <a href="/contact" style={{
                display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                letterSpacing: '0.15em', color: 'var(--color-core)', textDecoration: 'none',
                border: '1px solid var(--color-core)', padding: '0.6rem 1.5rem', transition: 'all 0.2s'
              }}>APPLY →</a>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-16)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
        No suitable role? Write to us at{' '}
        <a href="mailto:hello@company.com" style={{ color: 'var(--color-core)', textDecoration: 'none' }}>hello@company.com</a>
      </div>
    </div>
  );
}
