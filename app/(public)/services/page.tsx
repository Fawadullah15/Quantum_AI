import prisma from '@/lib/db';
import Link from 'next/link';
import { createPageMetadata, getFAQSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'AI & Custom Software Development Services — Quantum AI',
  description: 'Custom AI systems, enterprise web applications, workflow automation, and digital products engineered by Quantum AI to scale business operations.',
  path: '/services',
});

const DEFAULT_SERVICES = [
  {
    id: 's-ai',
    name: 'AI Systems & Agentic Workflows',
    category: 'AI / ML',
    description: 'Custom artificial intelligence systems, multi-agent workflows, retrieval-augmented generation (RAG), and neural reasoning architectures engineered for intelligent business decision making.',
    link: '/services/ai-development',
    linkLabel: 'VIEW AI SERVICE →',
    order: 1,
  },
  {
    id: 's-software',
    name: 'Custom Business Software',
    category: 'SOFTWARE',
    description: 'Scalable enterprise web applications, administrative management portals, offline-capable retail engines, and internal ERP platforms designed around real operational workflows.',
    link: '/services/custom-software-development',
    linkLabel: 'VIEW SOFTWARE SERVICE →',
    order: 2,
  },
  {
    id: 's-automation',
    name: 'Business Workflow Automation',
    category: 'AUTOMATION',
    description: 'End-to-end process automation, event-driven data pipelines, CRM synchronization bots, and API integrations that eliminate repetitive manual operational tasks.',
    link: '/services/business-automation',
    linkLabel: 'VIEW AUTOMATION SERVICE →',
    order: 3,
  },
  {
    id: 's-integration',
    name: 'Software & API Integration',
    category: 'INTEGRATION',
    description: 'Unified API connectors, bidirectional database synchronization, and middleware architectures that bridge isolated tools into one cohesive ecosystem.',
    link: '/services/software-integration',
    linkLabel: 'VIEW INTEGRATION SERVICE →',
    order: 4,
  },
  {
    id: 's-products',
    name: 'Digital Products & SaaS Platforms',
    category: 'PRODUCT',
    description: 'Consumer-facing SaaS platforms, educational management systems, and full-stack software products built for high user concurrency, data security, and long-term maintainability.',
    link: '/services/digital-products',
    linkLabel: 'VIEW PRODUCTS SERVICE →',
    order: 5,
  },
];

const SERVICE_FAQS = [
  {
    question: 'What does Quantum AI build as an AI and software development company?',
    answer: 'Quantum AI engineers custom artificial intelligence systems, enterprise business software, workflow automation pipelines, and scalable digital products tailored directly to business operational requirements.',
  },
  {
    question: 'Can Quantum AI integrate AI and automation into existing business systems?',
    answer: 'Yes. We build custom API connectors, retrieval-augmented search pipelines (RAG), and automation microservices that seamlessly connect with your existing databases, ERPs, CRMs, and web platforms.',
  },
  {
    question: 'What industries does Quantum AI specialize in?',
    answer: 'We have delivered software architectures across education (school operations management), retail and e-commerce (inventory and POS), enterprise sales pipelines, logistics, and data intelligence platforms.',
  },
  {
    question: 'Where is Quantum AI based and what clients do you serve?',
    answer: 'Quantum AI operates from Pakistan (Khyber Pakhtunkhwa / Peshawar) with global engineering standards, serving domestic businesses, educational institutions, and international organizations seeking reliable software architecture.',
  },
  {
    question: 'How does the custom software development process work at Quantum AI?',
    answer: 'Our structured engineering lifecycle consists of 5 clear stages: 01 Understand (requirements & operational context) -> 02 Define (technical scope & data workflows) -> 03 Design (architecture & interface) -> 04 Build (iterative development & automated testing) -> 05 Deploy (cloud infrastructure & continuous support).',
  },
];

export default async function ServicesPage() {
  const dbServices = await prisma.service.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => []);

  const services = dbServices && dbServices.length > 0 ? dbServices : DEFAULT_SERVICES;
  const faqSchema = getFAQSchema(SERVICE_FAQS);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      {/* Schema.org FAQPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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
          padding: 1.15rem clamp(1rem, 2.5vw, 1.75rem);
          display: grid;
          grid-template-columns: minmax(220px, 280px) 1fr auto;
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
          gap: 0.2rem;
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
          font-size: 1.1rem;
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
        .service-card-action {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #1677FF;
          text-decoration: none;
          letter-spacing: 0.08em;
          font-weight: 600;
          white-space: nowrap;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          background: rgba(22, 119, 255, 0.08);
          border: 1px solid rgba(22, 119, 255, 0.3);
          transition: all 0.2s;
        }
        .service-card-action:hover {
          background: rgba(22, 119, 255, 0.2);
          color: #38BDF8;
          border-color: #38BDF8;
        }

        .faq-item {
          background: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 8px;
          padding: 1.15rem 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .faq-q {
          font-size: 0.98rem;
          font-weight: 600;
          color: #F8FAFC;
          margin: 0;
        }
        .faq-a {
          font-size: 0.86rem;
          color: #94A3B8;
          line-height: 1.6;
          margin: 0;
          font-weight: 300;
        }

        @media (max-width: 860px) {
          .service-horizontal-card {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            padding: 0.95rem 1.1rem;
          }
          .service-card-title {
            font-size: 1rem;
          }
          .service-card-desc {
            font-size: 0.8125rem;
            line-height: 1.45;
          }
          .service-card-action {
            align-self: flex-start;
          }
        }
      `}</style>
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.08 / SERVICES</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: '0 0 0.65rem 0' }}>
            AI & SOFTWARE DEVELOPMENT SERVICES.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#94A3B8', maxWidth: 640, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
            Custom software architectures, enterprise AI systems, and automated workflow pipelines engineered to eliminate operational friction and scale productivity.
          </p>
        </div>

        {/* Services List */}
        <div className="services-list-container">
          {services.map((service, idx) => {
            const anchorId = (service.category?.toLowerCase() || service.name.toLowerCase().replace(/\s+/g, '-'));
            const linkTarget = (service as any).link || '/contact';
            const linkText = (service as any).linkLabel || 'DISCUSS REQUIREMENTS →';

            return (
              <div
                key={service.id}
                id={anchorId}
                className="service-horizontal-card"
                style={{ scrollMarginTop: 'calc(var(--nav-height, 72px) + 2rem)' }}
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
                <div>
                  <Link href={linkTarget} className="service-card-action">
                    {linkText}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Frequently Asked Questions Section (Organic SEO & User Clarity) ─── */}
        <div style={{ marginTop: '3.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>KNOWLEDGE BASE</div>
            <h2 style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', color: '#F8FAFC', fontWeight: 700, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.02em' }}>
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {SERVICE_FAQS.map((faq, fIdx) => (
              <div key={fIdx} className="faq-item">
                <h3 className="faq-q">{faq.question}</h3>
                <p className="faq-a">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
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
