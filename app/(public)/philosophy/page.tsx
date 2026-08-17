export default function PhilosophyPage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)', paddingBottom: 'var(--space-32)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.11 / PHILOSOPHY</div>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 10rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          HOW WE<br />THINK.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-16)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>1 / AESTHETICS = UTILITY</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '1.2rem' }}>
            We do not believe in decoration. True premium design emerges from the perfect, friction-less alignment of structure, function, and extreme legibility. Every pixel must earn its place.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>2 / ARCHITECTURAL SCALE</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '1.2rem' }}>
            Information hierarchy is dictated by size, contrast, and space. We use massive typography and vast emptiness to command attention and guide the eye, treating software interfaces like physical installations.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>3 / SYSTEMIC INTELLIGENCE</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '1.2rem' }}>
            We do not build isolated features. We engineer interconnected computational environments. Every product is a node within a larger, self-sustaining intelligence ecosystem.
          </p>
        </div>
      </div>
    </div>
  )
}
