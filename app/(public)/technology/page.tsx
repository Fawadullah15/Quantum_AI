import prisma from '@/lib/db';
import Link from 'next/link';
import TrustSection from '@/components/sections/TrustSection';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Core Technology Stack & Architecture — Quantum AI',
  description: 'AI & machine learning architectures, application engineering, transactional data systems, and resilient cloud infrastructure engineered by Quantum AI.',
  path: '/technology',
});

const TECH_PILLARS: Record<string, { desc: string; order: number }> = {
  'AI & Machine Learning': {
    desc: 'Intelligent agent frameworks, document AI, and neural retrieval pipelines that automate decision making and information processing.',
    order: 1,
  },
  'Application Engineering': {
    desc: 'High-performance web platforms, resilient APIs, and operational software that give staff and customers fast, reliable digital tools.',
    order: 2,
  },
  'Data Systems': {
    desc: 'Transactional relational databases, in-memory caches, and vector stores engineered for data integrity and high-concurrency querying.',
    order: 3,
  },
  'Infrastructure': {
    desc: 'Cloud compute instances, containerized deployments, and automated pipelines ensuring security, high uptime, and global availability.',
    order: 4,
  },
};

const DEFAULT_TECHS = [
  {
    id: 'ai-sys',
    name: 'Artificial Intelligence & Agents',
    slug: 'artificial-intelligence',
    category: 'AI & Machine Learning',
    shortDescription: 'Multi-agent coordination, document intelligence models, and domain-tuned retrieval systems.',
    usage: 'Multi-Agent Automation & Neural Reasoning',
    icon: '⚡',
  },
  {
    id: 'ml-sys',
    name: 'Machine Learning & Embeddings',
    slug: 'machine-learning',
    category: 'AI & Machine Learning',
    shortDescription: 'Vector search embeddings, predictive models, and real-time inference microservices.',
    usage: 'Semantic Vector Retrieval & Inference',
    icon: '◈',
  },
  {
    id: 'app-web',
    name: 'Full-Stack Web Architecture',
    slug: 'application-engineering',
    category: 'Application Engineering',
    shortDescription: 'Modern server-rendered web applications, reactive client portals, and typed API backends.',
    usage: 'Next.js, TypeScript, React & FastAPI',
    icon: '⬡',
  },
  {
    id: 'data-sys',
    name: 'Transactional & Vector Data',
    slug: 'data-systems',
    category: 'Data Systems',
    shortDescription: 'PostgreSQL relational schemas, Redis real-time caching, and vector memory instances.',
    usage: 'PostgreSQL, Prisma, Redis & SQLite',
    icon: '⬢',
  },
  {
    id: 'cloud-sys',
    name: 'Cloud & Container Systems',
    slug: 'cloud-systems',
    category: 'Infrastructure',
    shortDescription: 'Docker containerization, automated CI/CD deployment pipelines, and secure cloud environments.',
    usage: 'Docker, Linux, AWS & Vercel Edge',
    icon: '☁',
  },
];

export default async function TechnologyPage() {
  const dbTechs = await prisma.technology.findMany({
    where: { published: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  }).catch(() => []);

  const technologies = dbTechs.length > 0 ? dbTechs : DEFAULT_TECHS;

  // Group by standard 4 categories
  const grouped = technologies.reduce((acc, tech) => {
    let cat = tech.category || 'Application Engineering';
    if (cat.includes('AI') || cat.includes('Machine Learning') || cat.includes('ML')) cat = 'AI & Machine Learning';
    else if (cat.includes('Cloud') || cat.includes('Infrastructure') || cat.includes('DevOps')) cat = 'Infrastructure';
    else if (cat.includes('Data') || cat.includes('Database')) cat = 'Data Systems';
    else cat = 'Application Engineering';

    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tech);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort groups by predefined pillar order
  const sortedGroups = Object.entries(grouped).sort(([catA], [catB]) => {
    const orderA = TECH_PILLARS[catA]?.order ?? 99;
    const orderB = TECH_PILLARS[catB]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container">
      <div style={{ maxWidth: 'var(--max-width, 1000px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.02 / ARCHITECTURE</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            CORE TECHNOLOGY.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#94A3B8', lineHeight: 1.6, marginTop: '0.65rem', maxWidth: 620, fontWeight: 300 }}>
            We choose technology for long-term business reliability, maintainability, and operational value — structured across four core engineering pillars.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {sortedGroups.map(([category, techs], groupIndex) => (
            <div key={category} style={{ borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgba(56, 189, 248, 0.4)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.35rem' }}>
                    {String(groupIndex + 1).padStart(2, '0')}
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.55rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                    {category}
                  </h2>
                  <p style={{ color: '#94A3B8', fontSize: '0.86rem', lineHeight: 1.55, margin: 0, fontWeight: 300 }}>
                    {TECH_PILLARS[category]?.desc || 'Engineering capabilities and technology foundations.'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: 'span 2' }}>
                  {techs.map(tech => (
                    <div key={tech.id || tech.slug} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid var(--color-border-2, rgba(30,58,138,0.2))', paddingBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <Link href={`/technologies/${tech.slug}`} style={{ textDecoration: 'none' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', textTransform: 'uppercase', margin: 0, transition: 'color 0.2s' }}>
                            {tech.name} ↗
                          </h3>
                        </Link>
                        {tech.icon && <span style={{ fontSize: '1.1rem' }}>{tech.icon}</span>}
                      </div>
                      <p style={{ color: 'var(--color-text-secondary, #94A3B8)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                        {tech.shortDescription || tech.description}
                      </p>
                      {tech.usage && (
                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.08em', marginTop: '0.25rem' }}>
                          DEPLOYMENT // {tech.usage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Security Section */}
      <div style={{ marginTop: '4rem' }}>
        <TrustSection />
      </div>
    </div>
  );
}
