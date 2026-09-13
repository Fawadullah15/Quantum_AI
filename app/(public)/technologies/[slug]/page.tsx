import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

// Built-in core catalog for graceful fallback if database is cold/initializing
const FALLBACK_CATALOG: Record<string, any> = {
  'artificial-intelligence': {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    shortDescription: 'Enterprise AI architectures, agentic workflows, and domain-tuned intelligence models.',
    category: 'AI/ML',
    heroTitle: 'Artificial Intelligence Systems',
    heroDescription: 'Architecting custom multi-agent workflows, autonomous decision loops, and neural reasoning pipelines engineered for enterprise scale.',
    content: '<p>Our Artificial Intelligence engineering focuses on production-grade agentic systems and neural architectures designed to solve high-value operational bottlenecks. We build custom retrieval systems, multi-agent coordination frameworks, and deterministic execution wrappers that turn foundational models into reliable business engines.</p>',
    features: JSON.stringify([
      { title: 'Autonomous Multi-Agent Networks', description: 'Coordinated specialized agents executing sequential and parallel decision workflows.' },
      { title: 'Enterprise RAG Architectures', description: 'Hybrid sparse-dense retrieval over proprietary document stores with sub-100ms latency.' },
      { title: 'Deterministic Guardrails', description: 'Real-time schema enforcement, hallucination filters, and compliance validation pipelines.' },
      { title: 'Custom Model Fine-Tuning', description: 'Domain-specific LoRA and full-parameter fine-tuning for specialized industry vocabularies.' },
    ]),
    useCases: JSON.stringify([
      { title: 'Intelligent Operational Copilots', description: 'Context-aware assistants embedded into internal ERP and customer operations platforms.' },
      { title: 'Automated Document Intelligence', description: 'Extraction, synthesis, and structured verification across complex contracts and financial ledgers.' },
    ]),
    ctaTitle: 'Ready to Architect Next-Gen AI?',
    ctaText: 'START A PROJECT',
    ctaDescription: 'Connect with our engineering team to design, fine-tune, and deploy custom artificial intelligence systems for your business.',
    ctaLink: '/contact',
    published: true,
  },
  'machine-learning': {
    name: 'Machine Learning',
    slug: 'machine-learning',
    shortDescription: 'Predictive modeling, deep learning pipelines, and real-time inference infrastructure.',
    category: 'AI/ML',
    heroTitle: 'Machine Learning Infrastructure',
    heroDescription: 'From high-throughput data ingestion to low-latency edge and cloud inference pipelines.',
    content: '<p>We engineer end-to-end machine learning pipelines that continuously learn from streaming organizational data. Our focus is on mathematical rigor, data pipeline resilience, feature store architecture, and distributed GPU model training.</p>',
    features: JSON.stringify([
      { title: 'Predictive Analytics Engines', description: 'Time-series forecasting, demand estimation, and anomaly detection models.' },
      { title: 'Low-Latency Inference Engines', description: 'TensorRT, ONNX, and vLLM optimized model serving clusters with autoscaling.' },
      { title: 'Feature Store Engineering', description: 'Centralized feature registry ensuring training-serving skew elimination.' },
      { title: 'Continuous ML Operations (MLOps)', description: 'Automated retraining, drift monitoring, and zero-downtime model rollouts.' },
    ]),
    useCases: JSON.stringify([
      { title: 'Predictive Risk & Anomaly Detection', description: 'Real-time transaction scoring and hardware telemetry failure prediction.' },
      { title: 'Dynamic Pricing & Resource Optimization', description: 'Reinforcement learning algorithms balancing demand, inventory, and profit margins.' },
    ]),
    ctaTitle: 'Build Custom Machine Learning Pipelines',
    ctaText: 'SCHEDULE CONSULTATION',
    ctaDescription: 'Transform raw data into high-accuracy predictive intelligence with dedicated engineering support.',
    ctaLink: '/contact',
    published: true,
  },
  'cloud-systems': {
    name: 'Cloud Systems',
    slug: 'cloud-systems',
    shortDescription: 'Scalable cloud infrastructure, distributed microservices, and high-availability systems.',
    category: 'Infrastructure',
    heroTitle: 'Cloud Systems & Infrastructure',
    heroDescription: 'Resilient, secure, and distributed cloud computing environments engineered for 99.99% uptime.',
    content: '<p>We design cloud-native architectures that scale seamlessly under extreme traffic spikes while maintaining strict security boundaries and cost efficiency. Our infrastructure engineering leverages containerization, infrastructure-as-code, and multi-region failover.</p>',
    features: JSON.stringify([
      { title: 'Multi-Region High Availability', description: 'Active-active and active-passive deployment topologies across tier-1 cloud providers.' },
      { title: 'Kubernetes & Container Orchestration', description: 'Automated scaling, self-healing container pods, and service mesh management.' },
      { title: 'Infrastructure as Code (IaC)', description: 'Terraform and Pulumi defined environments for deterministic, reproducible deployments.' },
      { title: 'Zero-Trust Security & Compliance', description: 'End-to-end encryption, IAM role hardening, and continuous vulnerability scanning.' },
    ]),
    useCases: JSON.stringify([
      { title: 'Global Platform Modernization', description: 'Migrating legacy monoliths into distributed, autoscaling microservice clusters.' },
      { title: 'Disaster Recovery Architecture', description: 'Automated cross-region replication and instantaneous database failover systems.' },
    ]),
    ctaTitle: 'Scale Your Cloud Infrastructure',
    ctaText: 'ARCHITECT YOUR SYSTEM',
    ctaDescription: 'Let our cloud infrastructure architects review your workload requirements and build a high-performance roadmap.',
    ctaLink: '/contact',
    published: true,
  },
  'data-systems': {
    name: 'Data Systems',
    slug: 'data-systems',
    shortDescription: 'Structured data lakes, vector memory databases, and streaming ETL pipelines.',
    category: 'Database',
    heroTitle: 'Data Systems & Vector Memory',
    heroDescription: 'Enterprise data fabric supporting real-time transactional integrity, vector retrieval, and analytical scale.',
    content: '<p>High-performance software requires high-performance data architecture. We build hybrid transactional-analytical data stores, distributed vector search indexes, and real-time Kafka event streams that power modern intelligent applications.</p>',
    features: JSON.stringify([
      { title: 'Distributed Vector Databases', description: 'HNSW and IVF index structures for billion-scale similarity search with sub-20ms latency.' },
      { title: 'Real-Time Streaming Pipelines', description: 'Apache Kafka and Flink event streaming for instantaneous data transformations.' },
      { title: 'Transactional & Analytical Fabric', description: 'PostgreSQL, Redis, ClickHouse, and modern distributed storage layers.' },
      { title: 'Automated Data Governance', description: 'Schema registry, lineage tracking, and automated audit trails.' },
    ]),
    useCases: JSON.stringify([
      { title: 'Unified Enterprise Knowledge Base', description: 'Synchronizing structured CRM databases with unstructured vector embeddings.' },
      { title: 'High-Throughput Telemetry Ingestion', description: 'Processing millions of IoT and user event logs per second with zero message loss.' },
    ]),
    ctaTitle: 'Upgrade Your Data Architecture',
    ctaText: 'TALK TO AN ENGINEER',
    ctaDescription: 'Unlock real-time data streaming and lightning-fast vector memory retrieval for your software stack.',
    ctaLink: '/contact',
    published: true,
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dbTech = await prisma.technology.findUnique({ where: { slug } }).catch(() => null);
  const tech = dbTech || FALLBACK_CATALOG[slug];

  if (!tech) return { title: 'Technology Architecture | Quantum AI' };
  
  return createPageMetadata({
    title: `${tech.name} Architecture & Deployment — Quantum AI`,
    description: tech.heroDescription || tech.shortDescription || `Engineering specifications, feature breakdown, and production use cases for ${tech.name}.`,
    path: `/technologies/${slug}`,
    image: tech.heroImage || undefined,
  });
}

export default async function TechnologyDetailPage({ params }: Props) {
  const { slug } = await params;
  
  // 1. Fetch from database (CMS source of truth)
  const dbTech = await prisma.technology.findUnique({ where: { slug } }).catch(() => null);
  
  // 2. Fallback to core catalog if DB row not yet created
  const tech = dbTech || FALLBACK_CATALOG[slug];
  
  if (!tech || tech.published === false) {
    notFound();
  }

  // Parse features
  let features: any[] = [];
  try {
    features = typeof tech.features === 'string' ? JSON.parse(tech.features) : (tech.features || []);
    if (!Array.isArray(features)) features = [];
  } catch {
    features = [];
  }

  // Parse use cases
  let useCases: any[] = [];
  try {
    useCases = typeof tech.useCases === 'string' ? JSON.parse(tech.useCases) : (tech.useCases || []);
    if (!Array.isArray(useCases)) useCases = [];
  } catch {
    useCases = [];
  }

  // CTA dynamic configuration from database
  const ctaTitle = tech.ctaTitle?.trim() || `Ready to Build with ${tech.name}?`;
  const ctaDescription = tech.ctaDescription?.trim() || `Connect with Quantum AI engineers to design, build, and deploy custom ${tech.name.toLowerCase()} solutions.`;
  const ctaText = tech.ctaText?.trim() || 'START A PROJECT';
  const ctaLink = tech.ctaLink?.trim() || '/contact';
  const isExternalCta = ctaLink.startsWith('http://') || ctaLink.startsWith('https://');

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem', minHeight: '100vh' }}>
      {/* Hero Image if present */}
      {tech.heroImage && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          background: `linear-gradient(to bottom, rgba(2, 8, 23, 0.4), rgba(2, 8, 23, 0.95)), url(${tech.heroImage}) center/cover`,
          marginBottom: '2.5rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.15)'
        }} />
      )}

      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', paddingInline: 'clamp(1.25rem, 5vw, 3rem)' }}>
        {/* Breadcrumb Navigation */}
        <Link href="/technology" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#64748B',
          textDecoration: 'none',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '1.5rem',
          transition: 'color 0.2s',
        }}>
          ← ALL TECHNOLOGIES
        </Link>

        {/* Hero Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            color: '#38BDF8',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            padding: '0.2rem 0.65rem',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '999px',
          }}>
            <span>●</span> {tech.category}
          </div>

          <h1 style={{
            fontSize: 'clamp(1.85rem, 4.5vw, 3rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#F8FAFF',
            marginBottom: '1rem',
            textTransform: 'uppercase',
          }}>
            {tech.heroTitle || tech.name}
          </h1>

          <p style={{
            fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)',
            color: '#94A3B8',
            lineHeight: 1.65,
            maxWidth: '700px',
            fontWeight: 300,
            margin: 0,
          }}>
            {tech.heroDescription || tech.shortDescription}
          </p>
        </div>

        {/* Content Section */}
        {tech.content && (
          <div style={{
            marginBottom: '3rem',
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: '#CBD5E1',
            maxWidth: '780px',
            borderLeft: '2px solid rgba(22, 119, 255, 0.4)',
            paddingLeft: '1.25rem',
          }}>
            <div dangerouslySetInnerHTML={{ __html: tech.content }} />
          </div>
        )}

        {/* Key Capabilities / Features */}
        {features.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              SYS.CAPABILITIES
            </div>
            <h2 style={{
              fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
              fontWeight: 700,
              color: '#F8FAFF',
              marginBottom: '1.5rem',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              Core Architecture &amp; Features
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}>
              {features.map((feature: any, index: number) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  background: 'rgba(6, 21, 43, 0.65)',
                  border: '1px solid rgba(22, 119, 255, 0.15)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 20px -4px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', marginBottom: '0.5rem', fontWeight: 600 }}>
                    {String(index + 1).padStart(2, '0')} // FEATURE
                  </div>
                  <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: '#F8FAFC',
                    marginBottom: '0.4rem',
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Use Cases */}
        {useCases.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              SYS.DEPLOYMENTS
            </div>
            <h2 style={{
              fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
              fontWeight: 700,
              color: '#F8FAFF',
              marginBottom: '1.5rem',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              Enterprise Use Cases
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {useCases.map((useCase: any, index: number) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  background: 'rgba(6, 21, 43, 0.5)',
                  border: '1px solid rgba(22, 119, 255, 0.12)',
                  borderLeft: '3px solid #1677FF',
                  borderRadius: '0 10px 10px 0',
                }}>
                  <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: '#F8FAFC',
                    marginBottom: '0.35rem',
                  }}>
                    {useCase.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            DYNAMIC CTA SECTION (Connected directly to CMS / Database)
        ═══════════════════════════════════════════════════════════ */}
        <section
          style={{
            position: 'relative',
            padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
            background: 'linear-gradient(135deg, rgba(6, 21, 43, 0.92) 0%, rgba(10, 35, 71, 0.75) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.7), 0 0 30px -5px rgba(22, 119, 255, 0.25)',
            marginBottom: '4rem',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22, 119, 255, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              color: '#38BDF8',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              fontWeight: 600,
            }}>
              NEXT STEPS // SYSTEMS DEPLOYMENT
            </div>

            <h2 style={{
              fontSize: 'clamp(1.85rem, 4vw, 2.75rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#F8FAFF',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}>
              {ctaTitle}
            </h2>

            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: '#94A3B8',
              lineHeight: 1.7,
              maxWidth: '640px',
              margin: '0 auto 2.25rem',
              fontWeight: 300,
            }}>
              {ctaDescription}
            </p>

            <div style={{ display: 'inline-flex', justifyContent: 'center' }}>
              {isExternalCta ? (
                <a
                  href={ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2.25rem',
                    background: 'linear-gradient(135deg, #1677FF, #0050B3)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  {ctaText} ↗
                </a>
              ) : (
                <Link
                  href={ctaLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2.25rem',
                    background: 'linear-gradient(135deg, #1677FF, #0050B3)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  {ctaText} →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/technology" style={{
            color: '#64748B',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            ← VIEW ALL TECHNOLOGIES
          </Link>
          <Link href="/contact" style={{
            color: '#38BDF8',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            SCHEDULE CONSULTATION →
          </Link>
        </div>
      </div>
    </div>
  );
}
