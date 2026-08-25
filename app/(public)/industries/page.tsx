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
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem' }} className="container">
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>SYS.10 / GLOBAL SECTORS</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase' }}>
          APPLIED ACROSS SYSTEMS.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.5rem' }}>
        {industries.map((ind, idx) => (
          <div key={idx} style={{ 
            padding: '1.25rem', 
            border: '1px solid var(--color-border, rgba(30,58,138,0.22))',
            backgroundColor: 'rgba(6, 21, 43, 0.65)',
            backdropFilter: 'blur(10px)',
            borderRadius: 6,
            transition: 'border-color 0.3s ease'
          }}>
            <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#64748B' }}>SECTOR {String(idx + 1).padStart(2, '0')}</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)', marginTop: '0.5rem' }}>{ind}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}
