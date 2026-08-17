import prisma from '@/lib/db';
import CaseStudiesClient from './client';

export const metadata = {
  title: 'Case Studies Management | Admin',
};

export default async function CaseStudiesPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Case Studies</h1>
        <p className="text-gray-400 text-sm mt-1">Manage case studies and success stories.</p>
      </div>
      <CaseStudiesClient caseStudies={caseStudies} />
    </div>
  );
}
