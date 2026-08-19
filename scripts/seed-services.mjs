import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockServices = [
  {
    name: 'AI Systems',
    category: 'AI',
    description: 'Custom artificial intelligence systems, multi-agent workflows, retrieval-augmented generation (RAG), and neural architectures engineered for enterprise decision making.',
    icon: 'Brain',
    order: 1,
    published: true,
  },
  {
    name: 'Business Software',
    category: 'SOFTWARE',
    description: 'Scalable enterprise web applications, administrative dashboards, ERP systems, and internal operational platforms designed around real business processes.',
    icon: 'LayoutDashboard',
    order: 2,
    published: true,
  },
  {
    name: 'Automation',
    category: 'AUTOMATION',
    description: 'End-to-end workflow automation, event-driven pipelines, API integrations, and synchronization bots that eliminate repetitive manual operational tasks.',
    icon: 'Bot',
    order: 3,
    published: true,
  },
  {
    name: 'Digital Products',
    category: 'PRODUCT',
    description: 'Consumer-facing SaaS platforms, intelligent mobile-responsive tools, and full-stack software products built for high user concurrency and scale.',
    icon: 'Layers',
    order: 4,
    published: true,
  },
];

async function main() {
  console.log('Seeding mock services into database...');

  for (const service of mockServices) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name },
    });

    if (existing) {
      console.log(`Updating existing service: ${service.name}`);
      await prisma.service.update({
        where: { id: existing.id },
        data: service,
      });
    } else {
      console.log(`Creating new service: ${service.name}`);
      await prisma.service.create({
        data: service,
      });
    }
  }

  console.log('Successfully seeded all 4 mock services!');
}

main()
  .catch((e) => {
    console.error('Error seeding services:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
