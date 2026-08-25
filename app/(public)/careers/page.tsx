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
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container">
      <div style={{ maxWidth: 'var(--max-width, 1000px)', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.12 / ORBITAL SYSTEM</div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            JOIN THE SYSTEM.
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.5rem' }}>
          {roles.map((role, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem', borderBottom: '1px solid var(--color-border, rgba(30,58,138,0.22))',
              paddingBottom: '1.25rem', alignItems: 'center'
            }}>
              <div>
                <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>ORBIT / {role.orbit}</div>
                <h2 style={{ fontSize: 'clamp(1.05rem, 2vw, 1.35rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)', margin: 0 }}>{role.title}</h2>
              </div>
              <div style={{ color: 'var(--color-text-secondary, #94A3B8)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
                {role.type}
              </div>
              <div>
                <Link href="/contact" style={{
                  display: 'inline-block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem',
                  letterSpacing: '0.1em', color: '#1677FF', textDecoration: 'none',
                  border: '1px solid rgba(22, 119, 255, 0.5)', padding: '0.45rem 1.1rem', borderRadius: 6, transition: 'all 0.2s',
                  backgroundColor: 'rgba(22, 119, 255, 0.08)'
                }}>APPLY →</Link>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-16, 3rem)', color: 'var(--color-text-secondary, #94A3B8)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem' }}>
          No suitable role? Write to us at{' '}
          <a href="mailto:fawadimraj@gmail.com" style={{ color: '#1677FF', textDecoration: 'none' }}>hello@quantumai.dev</a>
        </div>
      </div>
    </div>
  );
}
