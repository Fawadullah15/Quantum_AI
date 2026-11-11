import prisma from '@/lib/db';
import Link from 'next/link';
import { createPageMetadata, getFAQSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'AI, Custom Software & Automation Services — Quantum AI',
  description: 'Quantum AI builds AI systems, custom software, business automation, and system integrations for manufacturers, engineering firms, and businesses.',
  path: '/services',
});

const DEFAULT_SERVICES = [
  {
    id: 's-ai',
    name: 'AI Systems & Agentic Workflows',
    category: 'AI / ML',
    description: 'AI assistants and agents that search company documents and data, answer questions, and support day-to-day decisions.',
    link: '/services/ai-development',
    linkLabel: 'VIEW AI SERVICE →',
    order: 1,
  },
  {
    id: 's-software',
    name: 'Custom Business Software',
    category: 'SOFTWARE',
    description: 'Manufacturing, production, inventory, and business management software, including ERP and CRM systems, built around how your teams work.',
    link: '/services/custom-software-development',
    linkLabel: 'VIEW SOFTWARE SERVICE →',
    order: 2,
  },
  {
    id: 's-automation',
    name: 'Business Workflow Automation',
    category: 'AUTOMATION',
    description: 'Automated workflows that replace repetitive manual work such as data entry, reporting, and approvals.',
    link: '/services/business-automation',
    linkLabel: 'VIEW AUTOMATION SERVICE →',
    order: 3,
  },
  {
    id: 's-integration',
    name: 'Software & API Integration',
    category: 'INTEGRATION',
    description: 'Connections between your existing software, databases, and tools so information is shared instead of re-entered.',
    link: '/services/software-integration',
    linkLabel: 'VIEW INTEGRATION SERVICE →',
    order: 4,
  },
  {
    id: 's-products',
    name: 'Digital Products & SaaS Platforms',
    category: 'PRODUCT',
    description: 'SaaS platforms and software products for technology companies, built to be secure, reliable, and easy to maintain.',
    link: '/services/digital-products',
    linkLabel: 'VIEW PRODUCTS SERVICE →',
    order: 5,
  },
];

const SERVICE_FAQS = [
  {
    question: 'What does Quantum AI build as an AI and software development company?',
    answer: 'Quantum AI is an AI and software engineering company. We build AI systems and agents, custom business and industrial software, workflow automation, system integrations, and SaaS products.',
  },
  {
    question: 'Can Quantum AI integrate AI and automation into existing business systems?',
    answer: 'Yes. We connect new software, AI tools, and automation to your existing databases, ERP and CRM systems, and web platforms through custom integrations.',
  },
  {
    question: 'What industries does Quantum AI specialize in?',
    answer: 'Our focus is manufacturing and industrial companies, engineering and technical firms, established businesses, and technology companies. Our past projects include engineering design tools, school operations, retail inventory and point-of-sale, and sales pipeline automation.',
  },
  {
    question: 'Where is Quantum AI based and what clients do you serve?',
    answer: 'Quantum AI operates from Peshawar, Khyber Pakhtunkhwa, Pakistan, and works with local businesses and international organizations that need reliable custom software.',
  },
  {
    question: 'How does the custom software development process work at Quantum AI?',
    answer: 'We work in five clear stages: 01 Understand your business problem, 02 Define what the system will do, 03 Design how it will work, 04 Build and test it, and 05 Deploy and support it.',
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
          background-color: rgba(6, 21, 43, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.16);
          border-left: 3px solid #1677FF;
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
          background-color: rgba(8, 28, 58, 0.9);
          border-color: rgba(56, 189, 248, 0.5);
          border-left-color: #38BDF8;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px -6px rgba(22, 119, 255, 0.3);
        }
        .service-card-left {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .service-card-eyebrow {
          font-family: var(--font-d-din);
          font-size: 0.68rem;
          color: #38BDF8;
          letter-spacing: 0.15em;
          font-weight: 700;
          text-transform: uppercase;
        }
        .service-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #F8FAFC;
          letter-spacing: -0.01em;
          margin: 0;
          line-height: 1.3;
        }
        .service-card-desc {
          color: #CBD5E1;
          font-size: 0.88rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
        }
        .service-card-action {
          font-family: var(--font-d-din);
          font-size: 0.72rem;
          color: #38BDF8;
          text-decoration: none;
          letter-spacing: 0.08em;
          font-weight: 700;
          white-space: nowrap;
          padding: 0.45rem 0.85rem;
          border-radius: 6px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.3);
          transition: all 0.2s;
        }
        .service-card-action:hover {
          background: rgba(56, 189, 248, 0.2);
          color: #FFFFFF;
          border-color: #38BDF8;
          transform: translateX(3px);
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
          color: #FFFFFF;
          margin: 0;
        }
        .faq-a {
          font-size: 0.86rem;
          color: #FFFFFF;
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
          <div className="tech-label" style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>[SYS.08 // ENGINEERING &amp; APPLIED SERVICES]</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--color-text-primary, #FFFFFF)', textTransform: 'uppercase', margin: '0 0 0.65rem 0' }}>
            AI, SOFTWARE & AUTOMATION SERVICES.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#FFFFFF', maxWidth: 640, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
            Custom software, AI systems, and automation for manufacturers, engineering firms, and businesses that need to manage complex operations.
          </p>
        </div>

        {/* Services List */}
        <div className="services-list-container">
          {services.map((service, idx) => {
            const anchorId = (service.category?.toLowerCase().split(/[^a-z0-9]+/)[0] || service.name.toLowerCase().replace(/\s+/g, '-'));
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
            <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.68rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>KNOWLEDGE BASE</div>
            <h2 style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.02em' }}>
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
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>HAVE A SPECIFIC SYSTEM IN MIND?</h2>
          <p style={{ color: '#FFFFFF', marginBottom: '1.5rem', maxWidth: 500, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.55 }}>We design and deploy custom intelligent architectures tailored to your operational requirements.</p>
          <Link href="/contact" style={{ display: 'inline-block', padding: '0.75rem 1.75rem', backgroundColor: '#1677FF', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-d-din)', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
            START A PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}
