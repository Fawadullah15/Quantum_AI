import prisma from '@/lib/db';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'AI & Custom Software Engineering Services — Quantum AI',
  description: 'Explore our core software development services: custom AI architectures, enterprise web applications, workflow automation, and scalable digital products.',
  path: '/services',
});

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
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) + 2rem)', paddingBottom: '5rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      <style>{`
        .services-list-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }
        .service-horizontal-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 1rem clamp(1rem, 2.5vw, 1.75rem);
          display: grid;
          grid-template-columns: minmax(180px, 240px) 1fr;
          align-items: center;
          gap: 1.5rem;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s, background-color 0.2s;
          box-sizing: border-box;
          width: 100%;
        }
        .service-horizontal-card:hover {
          background-color: rgba(8, 28, 58, 0.8);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.2);
        }
        .service-card-left {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .service-card-eyebrow {
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          color: #38BDF8;
          letter-spacing: 0.15em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .service-card-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.01em;
          margin: 0;
          line-height: 1.3;
        }
        .service-card-desc {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
        }

        @media (max-width: 860px) {
          .service-horizontal-card {
            grid-template-columns: 1fr;
            gap: 0.45rem;
            padding: 0.9rem 1.1rem;
          }
          .service-card-title {
            font-size: 1rem;
          }
          .service-card-desc {
            font-size: 0.8125rem;
            line-height: 1.45;
          }
        }
      `}</style>
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.08 / SERVICES</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
            CAPABILITIES.
          </h1>
          <p style={{ fontSize: 'clamp(0.88rem, 1.3vw, 1rem)', color: '#94A3B8', maxWidth: 600, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
            Custom software architectures, intelligent systems, and automated pipelines designed to scale business operations.
          </p>
        </div>

        <div className="services-list-container">
          {services.map((service, idx) => {
            const anchorId = (service.category?.toLowerCase() || service.name.toLowerCase().replace(/\s+/g, '-'));
            return (
              <div
                key={service.id}
                id={anchorId}
                className="service-horizontal-card"
                style={{ scrollMarginTop: 'calc(var(--nav-height, 80px) + 2rem)' }}
              >
                <div className="service-card-left">
                  <span className="service-card-eyebrow">
                    MODULE {String(idx + 1).padStart(2, '0')}{service.category ? ` · ${service.category}` : ''}
                  </span>
                  <h2 className="service-card-title">
                    {service.name}
                  </h2>
                </div>
                <p className="service-card-desc">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '3.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.1)', paddingTop: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: '#F8FAFC', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>HAVE A SPECIFIC SYSTEM IN MIND?</h2>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem', maxWidth: 500, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.55 }}>We design and deploy custom intelligent architectures tailored to your operational requirements.</p>
          <Link href="/contact" style={{ display: 'inline-block', padding: '0.75rem 1.75rem', backgroundColor: '#1677FF', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
            START A PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}
