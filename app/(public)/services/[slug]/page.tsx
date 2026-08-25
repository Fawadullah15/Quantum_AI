import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { createPageMetadata, getServiceSchema, getFAQSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

interface ServiceData {
  slug: string;
  name: string;
  categoryTag: string;
  h1: string;
  lead: string;
  problems: { title: string; desc: string }[];
  capabilities: { title: string; desc: string }[];
  process: { step: string; title: string; desc: string }[];
  relevantCaseStudies: { title: string; slug: string; desc: string; tag: string }[];
  faqs: { question: string; answer: string }[];
}

const SERVICE_CATALOG: Record<string, ServiceData> = {
  'ai-development': {
    slug: 'ai-development',
    name: 'AI Development & Systems',
    categoryTag: 'SYS.01 / ARTIFICIAL INTELLIGENCE',
    h1: 'CUSTOM AI DEVELOPMENT & AGENTIC SYSTEMS.',
    lead: 'We architect production-grade artificial intelligence systems, multi-agent coordination frameworks, and retrieval-augmented generation (RAG) pipelines designed to solve high-value operational bottlenecks.',
    problems: [
      {
        title: 'Manual Cognitive Bottlenecks',
        desc: 'Teams spend hundreds of hours manually reviewing documents, routing inquiries, and synthesizing data that intelligent algorithms can process in seconds.',
      },
      {
        title: 'Unstructured Enterprise Knowledge',
        desc: 'Critical company knowledge is scattered across static PDFs, emails, and isolated databases where employees cannot search or extract answers reliably.',
      },
      {
        title: 'AI Hallucinations & Unreliability',
        desc: 'Standard AI models produce inconsistent outputs without deterministic guardrails, structured schemas, and domain-tuned retrieval systems.',
      },
    ],
    capabilities: [
      {
        title: 'Autonomous Multi-Agent Networks',
        desc: 'Coordinated AI agents executing sequential and parallel decision workflows, role delegation, and structured verification.',
      },
      {
        title: 'Enterprise RAG & Semantic Retrieval',
        desc: 'High-speed vector similarity indexing over proprietary document archives with sub-100ms response latency.',
      },
      {
        title: 'Deterministic AI Guardrails',
        desc: 'Strict output validation, schema enforcement, and hallucination filters ensuring 100% compliance with business logic.',
      },
      {
        title: 'Operational Copilots & Assistants',
        desc: 'Custom context-aware assistants embedded directly into internal ERPs, customer platforms, and administrative workflows.',
      },
    ],
    process: [
      { step: '01', title: 'Understand Workflow', desc: 'Identify cognitive bottlenecks, required data sources, and accuracy thresholds.' },
      { step: '02', title: 'Architect System', desc: 'Design model selection, vector indexing, retrieval pipeline, and deterministic safety loops.' },
      { step: '03', title: 'Engineered Integration', desc: 'Build backend APIs and connect model inference directly into your application interfaces.' },
      { step: '04', title: 'Testing & Validation', desc: 'Stress-test accuracy, latency, and edge cases across real business datasets.' },
      { step: '05', title: 'Continuous Monitoring', desc: 'Deploy with telemetry, response logging, and drift monitoring in production cloud containers.' },
    ],
    relevantCaseStudies: [
      {
        title: 'Vector Search Knowledge Base',
        slug: 'vector-search-knowledge-base',
        tag: 'Enterprise AI',
        desc: 'Semantic vector retrieval platform indexing thousands of documents for instant natural language query answering.',
      },
      {
        title: 'AI-Powered Customer Support Assistant',
        slug: 'ai-powered-customer-support-assistant',
        tag: 'Agentic AI',
        desc: 'Context-aware customer support engine automating repetitive inquiries and accelerating resolution workflows.',
      },
    ],
    faqs: [
      {
        question: 'What types of custom AI systems does Quantum AI build?',
        answer: 'We build domain-specific RAG knowledge search systems, multi-agent automation workflows, automated document synthesis engines, and intelligent copilots embedded into internal software.',
      },
      {
        question: 'How do you prevent AI hallucinations in business applications?',
        answer: 'We enforce strict deterministic guardrails, ground all outputs strictly in retrieved verified documents (RAG), and validate responses against structured JSON schemas before presentation.',
      },
      {
        question: 'Can you integrate custom AI into our existing software stack?',
        answer: 'Yes. We engineer lightweight REST and GraphQL APIs that connect our AI inference pipelines into your existing web, desktop, or mobile applications.',
      },
    ],
  },
  'custom-software-development': {
    slug: 'custom-software-development',
    name: 'Custom Software Development',
    categoryTag: 'SYS.02 / CUSTOM SOFTWARE',
    h1: 'CUSTOM SOFTWARE BUILT AROUND YOUR WORKFLOW.',
    lead: 'We construct tailored web applications, internal operations platforms, management portals, and desktop-ready systems designed to match your exact business model.',
    problems: [
      {
        title: 'Rigid Off-The-Shelf Limitations',
        desc: 'Generic SaaS tools force your team to adjust your operations to their software, creating friction and subscription bloat.',
      },
      {
        title: 'Fragmented Spreadsheets & Chaos',
        desc: 'Critical business records live in disconnected spreadsheets and paper files, leading to version confusion and lost revenue.',
      },
      {
        title: 'Poor Connectivity & Data Loss',
        desc: 'Businesses in areas with intermittent internet suffer downtime when cloud-only software freezes or loses in-progress transactions.',
      },
    ],
    capabilities: [
      {
        title: 'Enterprise Management Platforms',
        desc: 'Centralized platforms unifying operations, staff, customers, attendance, billing, and reporting into one unified interface.',
      },
      {
        title: 'Offline-First Desktop & Web Engines',
        desc: 'High-availability software capable of local transactional execution with automatic cloud synchronization when online.',
      },
      {
        title: 'Role-Based Administrative Portals',
        desc: 'Granular user permission models, audit logs, and customizable dashboard views tailored to specific job responsibilities.',
      },
      {
        title: 'High-Performance Database Architectures',
        desc: 'Normalized relational schemas and transactional integrity engineered for millions of operational records.',
      },
    ],
    process: [
      { step: '01', title: 'Operational Audit', desc: 'Map your existing manual workflows, user roles, data touchpoints, and business rules.' },
      { step: '02', title: 'Interface & Data Design', desc: 'Create frictionless UX wireframes and clean relational database schemas.' },
      { step: '03', title: 'Full-Stack Development', desc: 'Engineer robust frontend interfaces, secure backend APIs, and fast database queries.' },
      { step: '04', title: 'User Acceptance Testing', desc: 'Validate system usability directly with your operational staff in real scenarios.' },
      { step: '05', title: 'Deployment & Training', desc: 'Launch on isolated cloud infrastructure with staff onboarding and operational handover.' },
    ],
    relevantCaseStudies: [
      {
        title: 'School Operations Manager',
        slug: 'school-operations-manager',
        tag: 'Education ERP',
        desc: 'Centralized school management platform uniting student records, staff, attendance, fees, and administration.',
      },
      {
        title: 'Offline Shop Management System',
        slug: 'offline-shop-management-system',
        tag: 'Retail & POS',
        desc: 'Desktop-ready shop management system with local inventory tracking and sales processing independent of internet uptime.',
      },
    ],
    faqs: [
      {
        question: 'Why should a business build custom software instead of buying off-the-shelf SaaS?',
        answer: 'Custom software fits your exact operational workflows without expensive monthly seat fees, feature bloat, or vendor lock-in. You own your code, data, and system roadmap completely.',
      },
      {
        question: 'Can the software work offline?',
        answer: 'Yes. We specialize in offline-first architectures that process local transactions and automatically sync with central servers once an internet connection is re-established.',
      },
      {
        question: 'How do you ensure data security in custom business software?',
        answer: 'We deploy on isolated private cloud containers with role-based access control (RBAC), end-to-end TLS encryption, daily automated backups, and detailed audit logging.',
      },
    ],
  },
  'business-automation': {
    slug: 'business-automation',
    name: 'Business Workflow Automation',
    categoryTag: 'SYS.03 / AUTOMATION',
    h1: 'WORKFLOW AUTOMATION THAT ELIMINATES MANUAL WORK.',
    lead: 'We engineer automated event-driven pipelines, CRM routing engines, document processing bots, and notification loops that free your team from repetitive tasks.',
    problems: [
      {
        title: 'Repetitive Manual Tasks',
        desc: 'Staff wasting valuable time on manual data entry, copy-pasting between systems, and routine status updates.',
      },
      {
        title: 'Slow Response & Lead Leakage',
        desc: 'Delays in routing customer inquiries or processing approvals result in lost opportunities and frustrated clients.',
      },
      {
        title: 'Human Data-Entry Errors',
        desc: 'Manual data transfers across platforms inevitably cause typos, missed entries, and reconciliation discrepancies.',
      },
    ],
    capabilities: [
      {
        title: 'Automated CRM & Lead Routing',
        desc: 'Instant lead ingestion, enrichment, qualification scoring, and assignment to the right team members in seconds.',
      },
      {
        title: 'Event-Driven Data Pipelines',
        desc: 'Automated data transformations and synchronization triggers running 24/7 across multiple internal databases.',
      },
      {
        title: 'Automated Document & Invoice Parsing',
        desc: 'Extracting structured data from incoming receipts, PDFs, and invoices directly into financial ledgers.',
      },
      {
        title: 'Cross-Platform Notification Loops',
        desc: 'Automated alerts via email, SMS, and messaging channels triggered by milestone completions or threshold alerts.',
      },
    ],
    process: [
      { step: '01', title: 'Bottleneck Mapping', desc: 'Identify the repetitive operational processes consuming the most team hours.' },
      { step: '02', title: 'Pipeline Architecture', desc: 'Design trigger-action logic, API endpoints, error fallbacks, and verification gates.' },
      { step: '03', title: 'Bot & Pipeline Build', desc: 'Construct resilient webhook listeners, background job queues, and automated data transformers.' },
      { step: '04', title: 'Simulation Testing', desc: 'Run automated tests with thousands of mock events to ensure zero failure rate under load.' },
      { step: '05', title: 'Live Rollout', desc: 'Deploy with real-time health telemetry and automated retry mechanisms.' },
    ],
    relevantCaseStudies: [
      {
        title: 'Sales Pipeline Automation System',
        slug: 'sales-pipeline-automation-system',
        tag: 'CRM Automation',
        desc: 'Automated lead capture, qualification pipeline, and CRM synchronization eliminating manual sales entry.',
      },
    ],
    faqs: [
      {
        question: 'What business processes can Quantum AI automate?',
        answer: 'We automate lead routing, customer onboarding, invoice processing, CRM synchronization, inventory alerts, scheduled reporting, and cross-department approval chains.',
      },
      {
        question: 'What happens if a connected third-party API goes down?',
        answer: 'Our automation architectures use persistent message queues with automatic retry mechanisms, failure logging, and instant administrative alerts to ensure no data is lost.',
      },
      {
        question: 'Can automation connect with our existing tools?',
        answer: 'Yes. We connect with custom databases, REST APIs, webhooks, ERPs, CRMs, and communication tools.',
      },
    ],
  },
  'software-integration': {
    slug: 'software-integration',
    name: 'Software & API Integration',
    categoryTag: 'SYS.04 / INTEGRATION',
    h1: 'CONNECTING DISCONNECTED BUSINESS SYSTEMS.',
    lead: 'We build unified API connectors, bidirectional data pipelines, and middleware architectures that bridge isolated business tools into one cohesive digital ecosystem.',
    problems: [
      {
        title: 'Siloed Data & Fragmented Tools',
        desc: 'Sales, operations, and finance use different software tools that cannot communicate, leaving leadership without a unified view.',
      },
      {
        title: 'Double Data Entry',
        desc: 'Employees are forced to enter the same customer or order information into multiple separate portals.',
      },
      {
        title: 'Legacy Software Barriers',
        desc: 'Older core databases lack modern REST interfaces, making it difficult to connect modern mobile or web applications.',
      },
    ],
    capabilities: [
      {
        title: 'Custom API Middleware',
        desc: 'High-throughput translation layers transforming data formats between disparate legacy and modern platforms.',
      },
      {
        title: 'Bidirectional Database Sync',
        desc: 'Real-time synchronization keeping inventory, customer accounts, and transactions consistent across all platforms.',
      },
      {
        title: 'Third-Party Service Connectors',
        desc: 'Seamless integration with payment gateways, SMS/email providers, logistics platforms, and cloud services.',
      },
      {
        title: 'Webhook & Streaming Fabric',
        desc: 'Low-latency event streaming ensuring every sub-system reacts instantly when new records are created.',
      },
    ],
    process: [
      { step: '01', title: 'System Schema Audit', desc: 'Inspect database structures, existing API documentation, and data flow bottlenecks.' },
      { step: '02', title: 'Protocol Design', desc: 'Define synchronization intervals, conflict resolution rules, and security tokens.' },
      { step: '03', title: 'Middleware Engineering', desc: 'Build reliable API proxies, event listeners, and data validation layers.' },
      { step: '04', title: 'Integrity Verification', desc: 'Verify bidirectional consistency and test handling of network dropouts.' },
      { step: '05', title: 'Production Sync', desc: 'Enable live sync with logging dashboards and continuous health monitoring.' },
    ],
    relevantCaseStudies: [
      {
        title: 'Sales Pipeline Automation System',
        slug: 'sales-pipeline-automation-system',
        tag: 'CRM Sync',
        desc: 'Integrated lead capture mechanisms with central CRM databases and communication channels.',
      },
      {
        title: 'School Operations Manager',
        slug: 'school-operations-manager',
        tag: 'Portal Integration',
        desc: 'Unified attendance records, fee billing, and administrative reporting across multiple departments.',
      },
    ],
    faqs: [
      {
        question: 'Can you integrate legacy software that does not have modern APIs?',
        answer: 'Yes. We engineer custom database bridge scripts, scheduled ETL workers, and secure middleware adapters to extract and synchronize legacy data safely.',
      },
      {
        question: 'How do you handle data conflicts during synchronization?',
        answer: 'We implement deterministic conflict resolution rules (e.g., timestamp authority, master database priority) with detailed audit logs for edge cases.',
      },
    ],
  },
  'digital-products': {
    slug: 'digital-products',
    name: 'Digital Products & SaaS Platforms',
    categoryTag: 'SYS.05 / DIGITAL PRODUCTS',
    h1: 'SCALABLE DIGITAL PRODUCTS & SAAS PLATFORMS.',
    lead: 'We design and engineer customer-facing software applications, subscription SaaS platforms, and organizational portals built for high user concurrency and scale.',
    problems: [
      {
        title: 'Unscalable MVP Architecture',
        desc: 'Quickly built prototypes often crash under real user traffic or lack the modularity needed to add new features.',
      },
      {
        title: 'Poor User Experience & High Churn',
        desc: 'Clunky interfaces and slow page load times frustrate users and reduce adoption rates.',
      },
      {
        title: 'Security & Multi-Tenancy Risks',
        desc: 'Improper data isolation between business accounts can lead to privacy leaks and architectural rebuilds.',
      },
    ],
    capabilities: [
      {
        title: 'Multi-Tenant SaaS Architectures',
        desc: 'Secure tenant data isolation, subscription management, and role-based access for business customers.',
      },
      {
        title: 'Responsive High-Speed Web Portals',
        desc: 'Next.js and React frontend applications optimized for sub-second page loads and mobile usability.',
      },
      {
        title: 'Scalable Backend APIs',
        desc: 'Modular Node.js and FastAPI microservices designed to scale seamlessly with user growth.',
      },
      {
        title: 'Admin Control Panels & Analytics',
        desc: 'Centralized command centers with user metrics, subscription tiers, and system health telemetry.',
      },
    ],
    process: [
      { step: '01', title: 'Product Scoping', desc: 'Define target users, core MVP feature set, and technical architecture specifications.' },
      { step: '02', title: 'Design System & UI', desc: 'Craft clean, intuitive user interfaces and accessible component libraries.' },
      { step: '03', title: 'Full-Stack Development', desc: 'Build frontend web apps, backend APIs, authentication systems, and payment webhooks.' },
      { step: '04', title: 'Load & Security Testing', desc: 'Perform penetration audits and load tests simulating thousands of concurrent users.' },
      { step: '05', title: 'Production Launch', desc: 'Deploy to auto-scaling cloud infrastructure with CI/CD deployment pipelines.' },
    ],
    relevantCaseStudies: [
      {
        title: 'Quantum AI Corporate Website',
        slug: 'quantum-ai-corporate-website',
        tag: 'Web Platform',
        desc: 'Centralized corporate software platform presenting dynamic case studies, blog CMS, and interactive 3D UI.',
      },
      {
        title: 'Youth Development Program Website',
        slug: 'youth-development-program-website',
        tag: 'Portal System',
        desc: 'Organizational portal platform managing chapters, program updates, and leadership directories.',
      },
    ],
    faqs: [
      {
        question: 'What is the development process for a new digital product or SaaS?',
        answer: 'We move through discovery and technical scoping, UI/UX architecture, full-stack development, automated security testing, and production deployment on auto-scaling cloud platforms.',
      },
      {
        question: 'Who owns the intellectual property and source code?',
        answer: 'You own 100% of the proprietary source code, database architecture, and digital assets upon project completion.',
      },
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dbService = await prisma.service.findFirst({
    where: { published: true, name: { contains: slug, mode: 'insensitive' } },
  }).catch(() => null);

  const service = SERVICE_CATALOG[slug] || (dbService ? {
    slug,
    name: dbService.name,
    h1: `${dbService.name.toUpperCase()} SERVICES.`,
    lead: dbService.description,
  } : null);

  if (!service) return { title: 'Service | Quantum AI' };

  return createPageMetadata({
    title: `${service.name} — Quantum AI`,
    description: service.lead.slice(0, 160),
    path: `/services/${slug}`,
  });
}

export async function generateStaticParams() {
  return Object.keys(SERVICE_CATALOG).map((slug) => ({ slug }));
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = SERVICE_CATALOG[slug];

  if (!service) {
    notFound();
  }

  const serviceSchema = getServiceSchema({
    name: service.name,
    slug: service.slug,
    description: service.lead,
    category: service.categoryTag,
  });

  const faqSchema = getFAQSchema(service.faqs);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4.5rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      {/* Schema.org Service & FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <style>{`
        .svc-header-back {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #38BDF8;
          text-decoration: none;
          letter-spacing: 0.1em;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
          transition: color 0.2s;
        }
        .svc-header-back:hover {
          color: #1677FF;
        }
        .svc-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 1.25rem 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          transition: border-color 0.2s, transform 0.2s, background-color 0.2s;
          box-sizing: border-box;
        }
        .svc-card:hover {
          background-color: rgba(8, 28, 58, 0.8);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
        }
        .svc-card-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: #F8FAFC;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .svc-card-desc {
          color: #94A3B8;
          font-size: 0.86rem;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
        }

        .svc-step-row {
          display: grid;
          grid-template-columns: 45px 180px 1fr;
          align-items: start;
          gap: 1.25rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(30, 58, 138, 0.22);
        }
        @media (max-width: 768px) {
          .svc-step-row {
            grid-template-columns: 1fr;
            gap: 0.35rem;
          }
        }

        .svc-case-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 1.25rem 1.35rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.75rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .svc-case-card:hover {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Breadcrumb back */}
        <Link href="/services" className="svc-header-back">
          ← BACK TO ALL SERVICES
        </Link>

        {/* Hero Section */}
        <div style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
            {service.categoryTag}
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            {service.h1}
          </h1>
          <p style={{ fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: '#94A3B8', maxWidth: 720, lineHeight: 1.65, margin: '0 0 1.5rem 0', fontWeight: 300 }}>
            {service.lead}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link
              href="/contact"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.75rem',
                backgroundColor: '#1677FF',
                color: '#fff',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                fontSize: '0.8rem',
              }}
            >
              START A PROJECT →
            </Link>
            <Link
              href="/work"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(22, 119, 255, 0.08)',
                border: '1px solid rgba(22, 119, 255, 0.3)',
                color: '#38BDF8',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                fontSize: '0.8rem',
              }}
            >
              EXPLORE CASE STUDIES
            </Link>
          </div>
        </div>

        {/* ─── Problems We Solve ─── */}
        <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.25rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>CHALLENGES</div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)', color: '#F8FAFC', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1.25rem 0', letterSpacing: '-0.02em' }}>
            WHAT OPERATIONAL PROBLEMS WE SOLVE
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {service.problems.map((p, idx) => (
              <div key={idx} className="svc-card">
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#38BDF8', fontWeight: 600 }}>0{idx + 1} // PROBLEM</span>
                <h3 className="svc-card-title">{p.title}</h3>
                <p className="svc-card-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── What We Build / Capabilities ─── */}
        <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.25rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>CAPABILITIES</div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)', color: '#F8FAFC', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1.25rem 0', letterSpacing: '-0.02em' }}>
            WHAT QUANTUM AI BUILDS
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {service.capabilities.map((c, idx) => (
              <div key={idx} className="svc-card">
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#1677FF', fontWeight: 600 }}>MODULE 0{idx + 1}</span>
                <h3 className="svc-card-title">{c.title}</h3>
                <p className="svc-card-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Engineering Lifecycle / Process ─── */}
        <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.25rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>EXECUTION PROCESS</div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)', color: '#F8FAFC', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1.25rem 0', letterSpacing: '-0.02em' }}>
            HOW WE DELIVER
          </h2>

          <div>
            {service.process.map((step) => (
              <div key={step.step} className="svc-step-row">
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem', color: '#1677FF', fontWeight: 700 }}>
                  {step.step}
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#F8FAFC', textTransform: 'uppercase' }}>
                  {step.title}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.55, fontWeight: 300 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Relevant Case Studies ─── */}
        {service.relevantCaseStudies.length > 0 && (
          <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.25rem' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>PROOF OF EXECUTION</div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)', color: '#F8FAFC', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1.25rem 0', letterSpacing: '-0.02em' }}>
              RELEVANT DEPLOYMENTS
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {service.relevantCaseStudies.map((study) => (
                <Link key={study.slug} href={`/work/${study.slug}`} className="svc-case-card">
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {study.tag}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0.35rem 0 0.5rem 0', lineHeight: 1.3 }}>
                      {study.title}
                    </h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.5, margin: 0, fontWeight: 300 }}>
                      {study.desc}
                    </p>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', fontWeight: 600 }}>
                    VIEW CASE STUDY →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── Frequently Asked Questions ─── */}
        <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.25rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>KNOWLEDGE BASE</div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)', color: '#F8FAFC', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1.25rem 0', letterSpacing: '-0.02em' }}>
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {service.faqs.map((faq, fIdx) => (
              <div key={fIdx} className="svc-card">
                <h3 className="svc-card-title">{faq.question}</h3>
                <p className="svc-card-desc">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: '#F8FAFC', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
            READY TO ARCHITECT YOUR {service.name.toUpperCase()}?
          </h2>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem', maxWidth: 520, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
            Consult with our engineering team to review your technical requirements and build a production-ready roadmap.
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.75rem',
              backgroundColor: '#1677FF',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.08em',
              fontSize: '0.8rem',
            }}
          >
            DISCUSS YOUR PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}
