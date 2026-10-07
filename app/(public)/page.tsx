import prisma from '@/lib/db';
import HomeClient, { type HomeInitialData } from './HomeClient';

// Regenerated at most every 60s; admin actions also call revalidatePath('/').
export const revalidate = 60;

const TECH_DESC: Record<string, string> = {
  'AI & Machine Learning': 'Models, neural networks, retrieval platforms, and agentic workflows.',
  'Applications': 'Robust frontend rendering engines and high-throughput backend APIs.',
  'Data Systems': 'Transactional, document-store, cache, and vector memory instances.',
  'Infrastructure': 'Virtualization, cloud computation, secure configurations, and automation pipelines.',
};

// Plain JSON so Dates etc. serialize safely across the server/client boundary.
const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

async function getHomeData(): Promise<HomeInitialData> {
  const [leaders, caseStudies, services, tech] = await Promise.all([
    prisma.leadership.findMany({ orderBy: { displayOrder: 'asc' } }).catch(() => null),
    prisma.caseStudy.findMany({ where: { published: true }, include: { metrics: true }, orderBy: { order: 'asc' } }).catch(() => null),
    prisma.service.findMany({ where: { published: true }, orderBy: { order: 'asc' } }).catch(() => null),
    prisma.technology.findMany({ where: { published: true }, orderBy: { order: 'asc' } }).catch(() => null),
  ]);

  let techGroups: any[] | null = null;
  if (tech && tech.length > 0) {
    const grouped: Record<string, string[]> = {};
    tech.forEach((t: any) => {
      const cat = t.category || 'General';
      (grouped[cat] ||= []).push(t.name);
    });
    techGroups = Object.entries(grouped).map(([title, tags]) => ({
      title,
      desc: TECH_DESC[title] || `Engineering capabilities and stack for ${title}.`,
      tags,
    }));
  }

  return plain({
    leaders: leaders ? leaders.filter((m: any) => m.isActive !== false) : null,
    caseStudies: caseStudies ? caseStudies.slice(0, 4) : null,
    services,
    techGroups,
  });
}

export default async function HomePage() {
  const initialData = await getHomeData();
  return <HomeClient initialData={initialData} />;
}
