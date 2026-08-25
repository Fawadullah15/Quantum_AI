import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENTS = [
  {
    name: 'Inventra Design & Automation',
    slug: 'inventra-design-automation',
    logo: '/uploads/clients/inventra-logo.png',
    industry: 'Design & Automation',
    description: 'Industrial design and process automation platforms engineered for scalable precision.',
    website: '/work/sales-pipeline-automation-system',
    featured: true,
    published: true,
    order: 1,
  },
  {
    name: 'Eden School System',
    slug: 'eden-school-system',
    logo: '/uploads/clients/eden-school-logo.png',
    industry: 'Education & Institutional Management',
    description: 'Centralized school operations manager bringing academic, attendance, and administrative workflows into one digital system.',
    website: '/work/school-operations-manager',
    featured: true,
    published: true,
    order: 2,
  },
  {
    name: 'Emerge Technologies',
    slug: 'emerge-technologies',
    logo: '/uploads/clients/emerge-tech-logo.png',
    industry: 'Enterprise Software & Systems',
    description: 'Scalable data architecture and modern operational platforms.',
    website: '/work/vector-search-knowledge-base',
    featured: true,
    published: true,
    order: 3,
  },
  {
    name: 'Inventra Robotics & AI',
    slug: 'inventra-robotics-ai',
    logo: '/uploads/clients/inventra-logo.png',
    industry: 'Industrial Robotics & Vision',
    description: 'Autonomous robotics vision engines and automated quality inspection pipelines.',
    website: '/work/sales-pipeline-automation-system',
    featured: true,
    published: true,
    order: 4,
  },
  {
    name: 'Eden Higher Secondary Academy',
    slug: 'eden-higher-secondary-academy',
    logo: '/uploads/clients/eden-school-logo.png',
    industry: 'Academic Administration',
    description: 'Cloud-native grading, parent portal, and automated fee reconciliation platform.',
    website: '/work/school-operations-manager',
    featured: true,
    published: true,
    order: 5,
  },
  {
    name: 'Emerge Cloud Infrastructure',
    slug: 'emerge-cloud-infrastructure',
    logo: '/uploads/clients/emerge-tech-logo.png',
    industry: 'Cloud Architecture & DevOps',
    description: 'Distributed Kubernetes clusters and high-availability database replication.',
    website: '/work/vector-search-knowledge-base',
    featured: true,
    published: true,
    order: 6,
  },
  {
    name: 'Inventra Manufacturing Systems',
    slug: 'inventra-manufacturing-systems',
    logo: '/uploads/clients/inventra-logo.png',
    industry: 'Manufacturing Operations',
    description: 'Real-time telemetry and predictive maintenance telemetry systems.',
    website: '/work/sales-pipeline-automation-system',
    featured: true,
    published: true,
    order: 7,
  },
  {
    name: 'Eden Educational Foundation',
    slug: 'eden-educational-foundation',
    logo: '/uploads/clients/eden-school-logo.png',
    industry: 'Education Non-Profit',
    description: 'Scholarship management, multi-branch student tracking, and donor reporting portal.',
    website: '/work/school-operations-manager',
    featured: true,
    published: true,
    order: 8,
  },
  {
    name: 'Emerge AI Labs',
    slug: 'emerge-ai-labs',
    logo: '/uploads/clients/emerge-tech-logo.png',
    industry: 'Applied Neural Research',
    description: 'Custom fine-tuned LLM inference engines and semantic vector indexing.',
    website: '/work/vector-search-knowledge-base',
    featured: true,
    published: true,
    order: 9,
  },
  {
    name: 'Inventra Process Dynamics',
    slug: 'inventra-process-dynamics',
    logo: '/uploads/clients/inventra-logo.png',
    industry: 'Workflow Optimization',
    description: 'Event-driven workflow engines replacing manual enterprise spreadsheets.',
    website: '/work/sales-pipeline-automation-system',
    featured: true,
    published: true,
    order: 10,
  },
  {
    name: 'Eden Digital Learning',
    slug: 'eden-digital-learning',
    logo: '/uploads/clients/eden-school-logo.png',
    industry: 'EdTech & Online Portals',
    description: 'Interactive course material distribution and automated assessment dashboards.',
    website: '/work/school-operations-manager',
    featured: true,
    published: true,
    order: 11,
  },
  {
    name: 'Emerge Data Analytics',
    slug: 'emerge-data-analytics',
    logo: '/uploads/clients/emerge-tech-logo.png',
    industry: 'Enterprise Business Intelligence',
    description: 'Executive dashboards integrating multiple operational databases into single pane of glass.',
    website: '/work/vector-search-knowledge-base',
    featured: true,
    published: true,
    order: 12,
  },
];

async function seedClients() {
  console.log('Seeding 12 Client Organizations into NeonDB...');

  await prisma.client.deleteMany();

  for (const client of CLIENTS) {
    const { logo_path, ...data } = client as any;
    await prisma.client.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo || logo_path || '/uploads/clients/emerge-tech-logo.png',
        industry: data.industry,
        description: data.description,
        website: data.website,
        featured: data.featured,
        published: data.published,
        order: data.order,
      },
    });
    console.log(`Created client: ${data.name}`);
  }

  const allClients = await prisma.client.findMany({ orderBy: { order: 'asc' } });
  console.log(`Seeding complete. Total clients in DB: ${allClients.length}`);
}

seedClients()
  .catch((e) => {
    console.error('Error seeding clients:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
