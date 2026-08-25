import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Engineering Philosophy & Design Tenets — Quantum AI',
  description: 'How we think: aesthetics as utility, architectural scale, computational precision, and systemic intelligence.',
  path: '/philosophy',
});

export default function PhilosophyPage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem' }} className="container">
      <div style={{ marginBottom: '2rem' }}>
        <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.11 / PHILOSOPHY</div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase' }}>
          HOW WE THINK.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)' }}>1 / AESTHETICS = UTILITY</h2>
          <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.65, fontSize: '0.92rem' }}>
            We do not believe in decoration. True premium design emerges from the perfect, friction-less alignment of structure, function, and extreme legibility. Every pixel must earn its place.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)' }}>2 / ARCHITECTURAL SCALE</h2>
          <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.65, fontSize: '0.92rem' }}>
            Information hierarchy is dictated by size, contrast, and space. We use clean typography and structured space to command attention and guide the eye, treating software interfaces like high-precision instruments.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)' }}>3 / SYSTEMIC INTELLIGENCE</h2>
          <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.65, fontSize: '0.92rem' }}>
            We do not build isolated features. We engineer interconnected computational environments. Every product is a node within a larger, self-sustaining intelligence ecosystem.
          </p>
        </div>
      </div>
    </div>
  )
}
