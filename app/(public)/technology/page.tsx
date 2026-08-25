import prisma from '@/lib/db';
import Link from 'next/link';
import TrustSection from '@/components/sections/TrustSection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Core Technology & Engineering Architecture — Quantum AI',
  description: 'The computational foundations, machine learning models, and infrastructure powering Quantum AI systems.',
};

const DEFAULT_TECHS = [
  {
    id: 'ai-sys',
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    category: 'AI & Machine Learning',
    shortDescription: 'Enterprise AI architectures, agentic workflows, and domain-tuned intelligence models.',
    usage: 'Multi-Agent Automation & Neural Reasoning',
    icon: '⚡',
  },
  {
    id: 'ml-sys',
    name: 'Machine Learning',
    slug: 'machine-learning',
    category: 'AI & Machine Learning',
    shortDescription: 'Predictive modeling, deep learning pipelines, and real-time inference infrastructure.',
    usage: 'Predictive Analytics & Tensor Processing',
    icon: '◈',
  },
  {
    id: 'cloud-sys',
    name: 'Cloud Systems',
    slug: 'cloud-systems',
    category: 'Infrastructure',
    shortDescription: 'Scalable cloud infrastructure, distributed microservices, and high-availability systems.',
    usage: 'Multi-Region Kubernetes Topologies',
    icon: '☁',
  },
  {
    id: 'data-sys',
    name: 'Data Systems',
    slug: 'data-systems',
    category: 'Data Architecture',
    shortDescription: 'Structured data lakes, vector memory databases, and streaming ETL pipelines.',
    usage: 'Vector Similarity Indexing & Event Fabric',
    icon: '⬡',
  },
];

export default async function TechnologyPage() {
  const dbTechs = await prisma.technology.findMany({
    where: { published: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  }).catch(() => []);

  const technologies = dbTechs.length > 0 ? dbTechs : DEFAULT_TECHS;

  // Group by category
  const grouped = technologies.reduce((acc, tech) => {
    const cat = tech.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tech);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container">
      <div style={{ maxWidth: 'var(--max-width, 1000px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.02 / ARCHITECTURE</div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            CORE TECHNOLOGY.
          </h1>
          <p style={{ fontSize: 'clamp(0.88rem, 1.3vw, 0.98rem)', color: '#94A3B8', lineHeight: 1.6, marginTop: '0.5rem', maxWidth: 580, fontWeight: 300 }}>
            Computational foundations, machine learning models, and secure cloud infrastructure.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {Object.entries(grouped).map(([category, techs], groupIndex) => (
            <div key={category} style={{ borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'rgba(56, 189, 248, 0.4)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.35rem' }}>
                    {String(groupIndex + 1).padStart(2, '0')}
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
                    {category}
                  </h2>
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
                      <p style={{ color: 'var(--color-text-secondary, #94A3B8)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                        {tech.shortDescription || tech.description}
                      </p>
                      {tech.usage && (
                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
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

      {/* Trust & Security Section Moved to Technology Page */}
      <div style={{ marginTop: '4rem' }}>
        <TrustSection />
      </div>
    </div>
  );
}
