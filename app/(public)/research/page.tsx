import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Applied Research - Quantum AI',
  description: 'Quantum AI research areas: AI agents, document and image understanding, and workflow automation.',
  path: '/research',
});

export default function ResearchPage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem' }} className="container">
      <div style={{ marginBottom: '2rem' }}>
        <div className="tech-label" style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.06 / RESEARCH AREAS</div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #FFFFFF)', textTransform: 'uppercase' }}>
          APPLIED RESEARCH.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', border: '1px solid rgba(30,58,138,0.22)', backgroundColor: 'rgba(6, 21, 43, 0.65)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#FFFFFF' }}>ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary, #FFFFFF)' }}>AI Agents</h2>
          <p style={{ color: 'var(--color-text-secondary, #FFFFFF)', lineHeight: 1.65, fontSize: '0.9rem' }}>
            Developing AI agents that complete multi-step business tasks reliably, with human review where it matters.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', border: '1px solid rgba(30,58,138,0.22)', backgroundColor: 'rgba(6, 21, 43, 0.65)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#FFFFFF' }}>ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary, #FFFFFF)' }}>Documents and Images</h2>
          <p style={{ color: 'var(--color-text-secondary, #FFFFFF)', lineHeight: 1.65, fontSize: '0.9rem' }}>
            Combining text, images, and structured data so AI systems can understand business documents and images.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', border: '1px solid rgba(30,58,138,0.22)', backgroundColor: 'rgba(6, 21, 43, 0.65)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ fontSize: '0.65rem', color: '#FFFFFF' }}>ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary, #FFFFFF)' }}>Workflow Automation</h2>
          <p style={{ color: 'var(--color-text-secondary, #FFFFFF)', lineHeight: 1.65, fontSize: '0.9rem' }}>
            Turning real business procedures into automated, step-by-step workflows.
          </p>
        </div>
      </div>
    </div>
  )
}
