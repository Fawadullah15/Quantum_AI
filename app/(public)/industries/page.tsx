export const metadata = {
  title: 'Industries & Sectors — Quantum AI',
  description: 'Applied intelligent software systems across healthcare, finance, logistics, education, manufacturing, and enterprise sectors.',
};

export default function IndustriesPage() {
  const industries = [
    "HEALTHCARE", "FINANCE", "LOGISTICS", "EDUCATION",
    "MANUFACTURING", "RETAIL", "REAL ESTATE", "GOVERNMENT"
  ];

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)', paddingBottom: 'var(--space-32)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.10 / GLOBAL SECTORS</div>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 10rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          APPLIED<br />ACROSS<br />SYSTEMS.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-12)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
        {industries.map((ind, idx) => (
          <div key={idx} style={{ 
            padding: 'var(--space-8)', 
            border: '1px solid var(--color-border)',
            backgroundColor: 'rgba(2, 3, 5, 0.5)',
            backdropFilter: 'blur(10px)',
            transition: 'border-color 0.3s ease'
          }}>
            <div className="eyebrow">SECTOR {String(idx + 1).padStart(2, '0')}</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 'var(--space-4)' }}>{ind}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}
