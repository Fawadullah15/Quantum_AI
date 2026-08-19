import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Services & Capabilities — Quantum AI',
  description: 'AI systems, custom software platforms, intelligent automation, and digital products engineered for scale.',
};

const DEFAULT_SERVICES = [
  {
    id: 's-ai',
    name: 'AI Systems',
    category: 'AI',
    description: 'Custom artificial intelligence systems, multi-agent workflows, retrieval-augmented generation (RAG), and neural architectures engineered for enterprise decision making.',
    icon: 'Brain',
    order: 1,
  },
  {
    id: 's-software',
    name: 'Business Software',
    category: 'SOFTWARE',
    description: 'Scalable enterprise web applications, administrative dashboards, ERP systems, and internal operational platforms designed around real business processes.',
    icon: 'LayoutDashboard',
    order: 2,
  },
  {
    id: 's-automation',
    name: 'Automation',
    category: 'AUTOMATION',
    description: 'End-to-end workflow automation, event-driven pipelines, API integrations, and synchronization bots that eliminate repetitive manual operational tasks.',
    icon: 'Bot',
    order: 3,
  },
  {
    id: 's-products',
    name: 'Digital Products',
    category: 'PRODUCT',
    description: 'Consumer-facing SaaS platforms, intelligent mobile-responsive tools, and full-stack software products built for high user concurrency and scale.',
    icon: 'Layers',
    order: 4,
  },
];

export default async function ServicesPage() {
  const dbServices = await prisma.service.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => []);

  const services = dbServices && dbServices.length > 0 ? dbServices : DEFAULT_SERVICES;

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) * 2)', paddingBottom: 'var(--space-32, 6rem)', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-32, 4rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>SYS.08 / SERVICES</div>
          <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            CAPABILITIES.
          </h1>
        </div>

        <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-16, 2rem)', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-16, 2.5rem)' }}>
          {services.map((service, idx) => {
            const anchorId = (service.category?.toLowerCase() || service.name.toLowerCase().replace(/\s+/g, '-'));
            return (
              <div
                key={service.id}
                id={anchorId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-6, 1rem)',
                  scrollMarginTop: 'calc(var(--nav-height, 80px) + 2rem)',
                  padding: '2rem',
                  backgroundColor: 'rgba(6, 21, 43, 0.55)',
                  border: '1px solid rgba(22, 119, 255, 0.2)',
                  borderRadius: 14,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.15em', fontWeight: 600 }}>
                  MODULE {String(idx + 1).padStart(2, '0')}{service.category ? ` · ${service.category}` : ''}
                </div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: 'var(--color-text-primary, #F8FAFC)', margin: 0 }}>
                  {service.name}
                </h2>
                <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.65, margin: 0, fontSize: '1rem', fontWeight: 300 }}>
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#F8FAFC', marginBottom: '1rem', fontWeight: 700 }}>HAVE A SPECIFIC SYSTEM IN MIND?</h2>
          <p style={{ color: '#94A3B8', marginBottom: '2rem', maxWidth: 500, margin: '0 auto 2rem' }}>We design and deploy custom intelligent architectures tailored to your operational requirements.</p>
          <Link href="/contact" style={{ display: 'inline-block', padding: '1rem 2.5rem', backgroundColor: '#1677FF', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em' }}>
            START A PROJECT →
          </Link>
        </div>
      </div>

      <style>{`
        .services-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        @media (max-width: 768px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
