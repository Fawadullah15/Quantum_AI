export const metadata = {
  title: 'Applied Research & Intelligence Labs — Quantum AI',
  description: 'Autonomous systems, multi-modal reasoning models, and generative operational workflows.',
};

export default function ResearchPage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)', paddingBottom: 'var(--space-32)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.06 / INTELLIGENCE LAB</div>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 10rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          APPLIED<br />RESEARCH.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-16)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="eyebrow">ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Autonomous Systems</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Developing self-correcting agent architectures capable of sustained long-horizon task execution without human intervention.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="eyebrow">ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Multi-Modal Reasoning</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Bridging vision, language, and structured data to allow systems to comprehend physical and digital environments simultaneously.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="eyebrow">ACTIVE FOCUS</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Generative Workflows</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Mapping complex human operational workflows into dynamic, code-generated computational graphs.
          </p>
        </div>
      </div>
    </div>
  )
}
