import Link from 'next/link';

export const metadata = {
  title: 'Careers — Quantum AI',
  description: 'Join our team building intelligent software, neural systems, and AI workflows.',
};

export default function CareersPage() {
  const roles = [
    { orbit: 'AI', title: 'Senior AI Engineer', type: 'Full-time · Remote' },
    { orbit: 'ENGINEERING', title: 'Backend Systems Architect', type: 'Full-time · Remote' },
    { orbit: 'DESIGN', title: 'Senior Product Designer', type: 'Full-time · Remote' },
    { orbit: 'PRODUCT', title: 'Product Manager – AI Systems', type: 'Full-time · Remote' },
    { orbit: 'RESEARCH', title: 'AI Research Engineer', type: 'Full-time · Remote' },
  ];

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) * 2)', paddingBottom: 'var(--space-32, 6rem)', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-32, 4rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>SYS.12 / ORBITAL SYSTEM</div>
          <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            JOIN<br />THE SYSTEM.
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8, 1.5rem)', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-16, 2rem)' }}>
          {roles.map((role, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-8, 1.5rem)', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))',
              paddingBottom: 'var(--space-8, 1.5rem)', alignItems: 'center'
            }}>
              <div>
                <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>ORBIT / {role.orbit}</div>
                <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)', margin: 0 }}>{role.title}</h2>
              </div>
              <div style={{ color: 'var(--color-text-secondary, #94A3B8)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem' }}>
                {role.type}
              </div>
              <div>
                <Link href="/contact" style={{
                  display: 'inline-block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem',
                  letterSpacing: '0.15em', color: '#1677FF', textDecoration: 'none',
                  border: '1px solid #1677FF', padding: '0.6rem 1.5rem', borderRadius: 6, transition: 'all 0.2s'
                }}>APPLY →</Link>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-16, 3rem)', color: 'var(--color-text-secondary, #94A3B8)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem' }}>
          No suitable role? Write to us at{' '}
          <a href="mailto:hello@quantumai.dev" style={{ color: '#1677FF', textDecoration: 'none' }}>hello@quantumai.dev</a>
        </div>
      </div>
    </div>
  );
}
