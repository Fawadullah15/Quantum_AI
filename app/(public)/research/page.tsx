import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Applied Research & Intelligence Labs — Quantum AI',
  description: 'Applied research into autonomous agent frameworks, multi-modal reasoning models, and generative operational systems.',
  path: '/research',
});

export default function ResearchPage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem' }} className="container">
      <div style={{ marginBottom: '2rem' }}>
        <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.06 / INTELLIGENCE LAB</div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase' }}>
          APPLIED RESEARCH.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', border: '1px solid rgba(30,58,138,0.22)', backgroundColor: 'rgba(6, 21, 43, 0.65)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#38BDF8' }}>ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)' }}>Autonomous Systems</h2>
          <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.65, fontSize: '0.9rem' }}>
            Developing self-correcting agent architectures capable of sustained long-horizon task execution without human intervention.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', border: '1px solid rgba(30,58,138,0.22)', backgroundColor: 'rgba(6, 21, 43, 0.65)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#38BDF8' }}>ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)' }}>Multi-Modal Reasoning</h2>
          <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.65, fontSize: '0.9rem' }}>
            Bridging vision, language, and structured data to allow systems to comprehend physical and digital environments simultaneously.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', border: '1px solid rgba(30,58,138,0.22)', backgroundColor: 'rgba(6, 21, 43, 0.65)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#38BDF8' }}>ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)' }}>Generative Workflows</h2>
          <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.65, fontSize: '0.9rem' }}>
            Mapping complex human operational workflows into dynamic, code-generated computational graphs.
          </p>
        </div>
      </div>
    </div>
  )
}
