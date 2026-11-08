import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Industries We Serve — Quantum AI',
  description: 'Quantum AI builds software, automation, and AI systems for manufacturing, industrial operations, engineering, business, retail, and technology companies.',
  path: '/industries',
});

export default function IndustriesPage() {
  const industries = [
    "MANUFACTURING", "INDUSTRIAL OPERATIONS", "ENGINEERING", "BUSINESS & ENTERPRISE",
    "RETAIL & INVENTORY", "SOFTWARE & TECHNOLOGY"
  ];

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem' }} className="container">
      <div style={{ marginBottom: '2rem' }}>
        <div className="tech-label" style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.10 / INDUSTRIES</div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #FFFFFF)', textTransform: 'uppercase' }}>
          INDUSTRIES WE SERVE.
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
            <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#FFFFFF' }}>SECTOR {String(idx + 1).padStart(2, '0')}</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary, #FFFFFF)', marginTop: '0.5rem' }}>{ind}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}
