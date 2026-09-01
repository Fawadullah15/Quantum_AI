import prisma from '@/lib/db';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Selected Deployments & Client Case Studies — Quantum AI',
  description: 'Explore production deployments, operational software platforms, and custom AI systems engineered for enterprise clients.',
  path: '/work',
});

interface WorkPageProps {
  searchParams?: Promise<{ category?: string }>;
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams?.category || 'ALL';

  const allCaseStudies = await prisma.caseStudy.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => []);

  const categories = [
    'ALL',
    'CLIENT PROJECTS',
    'INTERNAL PRODUCTS',
    'R&D / CONCEPTS',
    'EDUCATION',
    'RETAIL',
    'ARTIFICIAL INTELLIGENCE',
  ];

  const filteredCaseStudies = activeCategory === 'ALL'
    ? allCaseStudies
    : allCaseStudies.filter((study) => {
        const ind = (study.industry || '').toUpperCase();
        const clientStr = (study.client || '').trim().toLowerCase();
        
        if (activeCategory === 'CLIENT PROJECTS') {
          return clientStr.includes('eden school') || clientStr.includes('youth development') || (clientStr && !clientStr.includes('internal') && !clientStr.includes('quantum ai'));
        }
        if (activeCategory === 'INTERNAL PRODUCTS') {
          return clientStr.includes('product') || clientStr.includes('platform') || clientStr.includes('internal / custom') || study.title.includes('Offline Shop') || study.title.includes('Quantum AI');
        }
        if (activeCategory === 'R&D / CONCEPTS') {
          return clientStr.includes('internal / quantum ai') || study.title.includes('Intelligence') || study.title.includes('Automation Platform');
        }
        if (activeCategory === 'EDUCATION') return ind.includes('EDUCATION') || ind.includes('SCHOOL');
        if (activeCategory === 'RETAIL') return ind.includes('RETAIL') || ind.includes('SHOP');
        if (activeCategory === 'ARTIFICIAL INTELLIGENCE') return ind.includes('ARTIFICIAL INTELLIGENCE') || ind.includes('AI');
        return true;
      });

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '5rem', paddingInline: 'clamp(1rem, 4vw, 3rem)', minHeight: '100vh', background: 'var(--color-void, #030712)' }}>
      <style>{`
        .work-page-container {
          max-width: 1160px;
          margin: 0 auto;
        }
        .work-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .work-filter-btn {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid rgba(22, 119, 255, 0.18);
          background: rgba(6, 21, 43, 0.5);
          color: #94A3B8;
        }
        .work-filter-btn:hover {
          color: #F8FAFC;
          border-color: rgba(56, 189, 248, 0.4);
          background: rgba(8, 28, 58, 0.8);
        }
        .work-filter-btn.active {
          background: rgba(22, 119, 255, 0.2);
          border-color: #38BDF8;
          color: #38BDF8;
          font-weight: 600;
        }
        .works-grid-container {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
        }
        .work-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.16);
          border-radius: 12px;
          padding: 1.25rem clamp(1rem, 2.5vw, 1.75rem);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s, background-color 0.25s;
          box-sizing: border-box;
          width: 100%;
          text-decoration: none;
          outline: none;
        }
        .work-card:hover {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.2);
        }
        .work-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4);
        }
        .work-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(22, 119, 255, 0.12);
          padding-bottom: 0.75rem;
        }
        .work-num {
          font-family: var(--font-mono, monospace);
          font-size: 1.1rem;
          font-weight: 700;
          color: #38BDF8;
        }
        .work-client {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #94A3B8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .work-category-badge {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #38BDF8;
          background-color: rgba(22, 119, 255, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .work-year {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #64748B;
        }
        .work-title {
          font-size: clamp(1.15rem, 2vw, 1.4rem);
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.015em;
          text-transform: none;
          line-height: 1.25;
          margin: 0;
          transition: color 0.2s;
        }
        .work-card:hover .work-title {
          color: #38BDF8;
        }
        .work-desc {
          color: #94A3B8;
          font-size: 0.88rem;
          line-height: 1.6;
          max-width: 860px;
          margin: 0;
          font-weight: 300;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .work-tech-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .work-tech-tag {
          font-size: 0.72rem;
          font-family: var(--font-mono, monospace);
          padding: 0.2rem 0.55rem;
          background-color: rgba(22, 119, 255, 0.08);
          border: 1px solid rgba(22, 119, 255, 0.16);
          border-radius: 4px;
          color: #55D6FF;
        }
        .work-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.25rem;
          font-family: var(--font-mono, monospace);
        }
        .work-action-text {
          font-size: 0.75rem;
          color: #1677FF;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: color 0.2s, transform 0.2s;
        }
        .work-card:hover .work-action-text {
          color: #38BDF8;
          transform: translateX(3px);
        }

        @media (max-width: 767px) {
          .works-grid-container {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
          }
          .work-card {
            padding: 0.75rem;
            gap: 0.6rem;
            border-radius: 10px;
          }
          .work-title {
            font-size: 1rem !important;
          }
          .work-desc {
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
            -webkit-line-clamp: 2 !important;
          }
          .work-tech-tag {
            font-size: 0.65rem !important;
            padding: 0.15rem 0.45rem !important;
          }
          .work-action-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>

      <div className="work-page-container">
        {/* Header */}
        <div style={{ marginBottom: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', letterSpacing: '0.25em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
            [04 — OUR WORK]
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em', color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            SELECTED DEPLOYMENTS &amp; CASE STUDIES.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#94A3B8', maxWidth: 640, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
            Production software platforms, enterprise automation engines, and custom AI systems delivered by Quantum AI.
          </p>
        </div>

        {/* Category Filters */}
        <div className="work-filters">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const href = cat === 'ALL' ? '/work' : `/work?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`work-filter-btn ${isActive ? 'active' : ''}`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCaseStudies.length === 0 ? (
          <div style={{
            background: 'rgba(6, 21, 43, 0.4)',
            border: '1px dashed rgba(22, 119, 255, 0.25)',
            borderRadius: 14,
            padding: '4rem 2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', color: '#1677FF', marginBottom: '0.75rem', fontWeight: 600 }}>
              NO MATCHING DEPLOYMENTS
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.5rem' }}>
              No Case Studies Found in This Category
            </h2>
            <p style={{ color: '#94A3B8', maxWidth: 440, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Explore all case studies or reach out to discuss how we can build custom intelligence for your organization.
            </p>
            <Link
              href="/work"
              style={{
                display: 'inline-flex',
                padding: '0.65rem 1.5rem',
                backgroundColor: '#1677FF',
                borderRadius: 6,
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              VIEW ALL WORK →
            </Link>
          </div>
        ) : (
          <div className="works-grid-container">
            {filteredCaseStudies.map((study, index) => {
              const techList = study.technologies
                ? study.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
                : [];

              const clientStr = (study.client || '').trim().toLowerCase();
              let originBadge = { label: 'CLIENT PROJECT', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', displayOrg: study.client };
              if (clientStr.includes('internal / quantum ai') || study.title.includes('Intelligence') || study.title.includes('Automation Platform')) {
                originBadge = { label: 'R&D / CONCEPT', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)', displayOrg: 'Concept / R&D' };
              } else if (clientStr.includes('quantum ai') || clientStr.includes('internal')) {
                originBadge = { label: 'INTERNAL PRODUCT', color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', displayOrg: 'Built by Quantum AI' };
              }

              return (
                <Link key={study.id} href={`/work/${study.slug}`} className="work-card">
                  <div className="work-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span className="work-num">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="work-client">
                        {originBadge.displayOrg}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.65rem',
                          color: originBadge.color,
                          backgroundColor: originBadge.bg,
                          border: `1px solid ${originBadge.color}33`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {originBadge.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="work-category-badge">
                        {study.industry ? study.industry.split('/')[0].trim() : 'Technology'}
                      </span>
                      <span className="work-year">
                        {study.year || new Date().getFullYear()}
                      </span>
                    </div>
                  </div>

                  <h2 className="work-title">
                    {study.title}
                  </h2>

                  <p className="work-desc">
                    {study.problem || study.solution}
                  </p>

                  <div className="work-action-row">
                    {techList.length > 0 ? (
                      <div className="work-tech-container">
                        {techList.slice(0, 5).map((t: string) => (
                          <span key={t} className="work-tech-tag">
                            {t}
                          </span>
                        ))}
                        {techList.length > 5 && (
                          <span className="work-tech-tag">+{techList.length - 5}</span>
                        )}
                      </div>
                    ) : (
                      <div />
                    )}

                    <span className="work-action-text">
                      VIEW CASE STUDY →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
