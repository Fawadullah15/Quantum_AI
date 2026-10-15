import prisma from '@/lib/db';
import CaseStudiesClient from '../case-studies/client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Projects Management | Quantum Admin',
};

export default async function ProjectsAdminPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    orderBy: { order: 'asc' },
  }).catch(() => []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
          PROJECTS &amp; PRODUCTS CATALOG
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
          Projects &amp; Works Management
        </h1>
        <p style={{ color: '#FFFFFF', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
          Manage your client projects, engineering prototypes, proprietary AI products, and case studies displayed on the public Work showcase.
        </p>
      </div>
      <CaseStudiesClient caseStudies={caseStudies as any} />
    </div>
  );
}
