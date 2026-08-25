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
];

async function seedClients() {
  console.log('Seeding real Client Organizations into database...');

  // Clean old placeholder records to keep data pristine
  await prisma.client.deleteMany();

  for (const client of CLIENTS) {
    await prisma.client.create({
      data: client,
    });
    console.log(`Created client: ${client.name}`);
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
