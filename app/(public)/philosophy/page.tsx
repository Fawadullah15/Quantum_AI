import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'How We Work - Quantum AI',
  description: 'The principles Quantum AI follows when building software and AI systems: simple, clear, and connected to how businesses operate.',
  path: '/philosophy',
});

export default function PhilosophyPage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem' }} className="container">
      <div style={{ marginBottom: '2rem' }}>
        <div className="tech-label" style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.11 / PHILOSOPHY</div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #FFFFFF)', textTransform: 'uppercase' }}>
          HOW WE THINK.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 600, color: 'var(--color-text-primary, #FFFFFF)' }}>1 / SIMPLE AND USEFUL</h2>
          <p style={{ color: 'var(--color-text-secondary, #FFFFFF)', lineHeight: 1.65, fontSize: '0.92rem' }}>
            We do not build for decoration. Good software is clear, easy to read, and does exactly what your team needs. Every screen and feature has a purpose.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 600, color: 'var(--color-text-primary, #FFFFFF)' }}>2 / CLEAR INFORMATION</h2>
          <p style={{ color: 'var(--color-text-secondary, #FFFFFF)', lineHeight: 1.65, fontSize: '0.92rem' }}>
            We organize information so people can find what they need quickly. Clean layouts and plain text help staff work accurately with our software.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 600, color: 'var(--color-text-primary, #FFFFFF)' }}>3 / CONNECTED SYSTEMS</h2>
          <p style={{ color: 'var(--color-text-secondary, #FFFFFF)', lineHeight: 1.65, fontSize: '0.92rem' }}>
            We do not build isolated features. We build systems that connect with each other and with the tools you already use, so information flows without being re-entered.
          </p>
        </div>
      </div>
    </div>
  )
}
