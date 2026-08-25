import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENTS = [
  {
    name: 'School Operations Manager',
    slug: 'school-operations-manager',
    industry: 'Education / Institution',
    description: 'Centralized school management platform bringing academic, attendance, and administrative workflows into one digital system.',
    website: '/work/school-operations-manager',
    featured: true,
    published: true,
    order: 1,
  },
  {
    name: 'Sales Pipeline System',
    slug: 'sales-pipeline-system',
    industry: 'Sales / Business Automation',
    description: 'Centralized CRM and opportunity tracking engine with automated lead routing and CRM synchronization pipelines.',
    website: '/work/sales-pipeline-automation-system',
    featured: true,
    published: true,
    order: 2,
  },
  {
    name: 'Vector Search Knowledge Base',
    slug: 'vector-search-knowledge-base',
    industry: 'AI / Knowledge Management',
    description: 'Enterprise semantic search over knowledge sources and document archives powered by embeddings and vector indexing.',
    website: '/work/vector-search-knowledge-base',
    featured: true,
    published: true,
    order: 3,
  },
  {
    name: 'AI Support Assistant',
    slug: 'ai-support-assistant',
    industry: 'AI / Customer Support',
    description: 'Context-aware customer support system automating frequent inquiries and accelerating team response workflows.',
    website: '/work/ai-powered-customer-support-assistant',
    featured: true,
    published: true,
    order: 4,
  },
];

async function seedClients() {
  console.log('Seeding Clients & Organizations into database...');

  for (const client of CLIENTS) {
    const existing = await prisma.client.findFirst({
      where: {
        OR: [{ slug: client.slug }, { name: client.name }],
      },
    });

    if (!existing) {
      await prisma.client.create({
        data: client,
      });
      console.log(`Created client: ${client.name}`);
    } else {
      await prisma.client.update({
        where: { id: existing.id },
        data: client,
      });
      console.log(`Updated client: ${client.name}`);
    }
  }

  const allClients = await prisma.client.findMany();
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
