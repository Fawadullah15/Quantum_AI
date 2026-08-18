import prisma from '@/lib/db';
import CaseStudiesClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Works & Case Studies | Quantum Admin',
};

export default async function CaseStudiesPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    orderBy: { order: 'asc' },
  }).catch(() => []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Works & Case Studies</h1>
        <p style={{ color: '#64748B', fontSize: '0.825rem', marginTop: '0.25rem' }}>
          Manage your client projects, portfolio deployments, and detailed case studies shown on the public Works page.
        </p>
      </div>
      <CaseStudiesClient caseStudies={caseStudies} />
    </div>
  );
}
