import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_TESTIMONIALS = [
  {
    name: 'Muhammad Tariq',
    role: 'Director of Academic Operations',
    company: 'Eden School System',
    content: 'Quantum AI engineered our centralized school operations platform, eliminating manual attendance tracking and unifying our multi-branch administration into one real-time digital system.',
    rating: 5,
    photo: '',
    published: true,
    order: 1,
  },
  {
    name: 'Saad Al-Mansoor',
    role: 'Head of Automation',
    company: 'Inventra Design & Automation',
    content: 'The workflow automation and telemetry pipeline deployed by Quantum AI eliminated recurring administrative bottlenecks and reduced operational cycle times across all production lines.',
    rating: 5,
    photo: '',
    published: true,
    order: 2,
  },
  {
    name: 'Dr. Usman Farooq',
    role: 'VP of Systems Engineering',
    company: 'Emerge Technologies',
    content: 'Their deep technical understanding of semantic embeddings and PostgreSQL indexing allowed us to deploy an enterprise knowledge retrieval platform with sub-second response times.',
    rating: 5,
    photo: '',
    published: true,
    order: 3,
  },
  {
    name: 'Bilal Hashmi',
    role: 'Operations Lead',
    company: 'Nexus Industrial Logistics',
    content: 'The custom dispatch and inventory synchronization software transformed our daily operations. Fast, reliable, and built precisely around our team’s actual warehouse workflows.',
    rating: 5,
    photo: '',
    published: true,
    order: 4,
  },
  {
    name: 'Hamza Zubair',
    role: 'Founder & CTO',
    company: 'AeroDynamics Labs',
    content: 'Working with Quantum AI was seamless from system architecture to production rollout. The automated pipeline and telemetry systems they engineered exceeded our expectations.',
    rating: 5,
    photo: '',
    published: true,
    order: 5,
  },
  {
    name: 'Rashid Kamal',
    role: 'Managing Director',
    company: 'Crescent Financial Systems',
    content: 'Quantum AI built a dependable, secure API bridge between our legacy database and modern web portal. Our reporting cycle went from hours of manual collation to instant automated summaries.',
    rating: 5,
    photo: '',
    published: true,
    order: 6,
  },
  {
    name: 'Zubair Shah',
    role: 'Principal Administrator',
    company: 'Horizon Education Trust',
    content: 'Their team delivered an offline-first architecture that ensures our staff never lose access or administrative data even when regional internet connectivity drops.',
    rating: 5,
    photo: '',
    published: true,
    order: 7,
  },
  {
    name: 'Ayesha Siddiqui',
    role: 'Product Director',
    company: 'Apex Digital Solutions',
    content: 'A truly top-tier software engineering partner. Clean architecture, robust database models, thoughtful UX, and rapid communication throughout the development cycle.',
    rating: 5,
    photo: '',
    published: true,
    order: 8,
  },
];

async function seedTestimonials() {
  console.log('Seeding Sample Testimonials into database...');

  await prisma.testimonial.deleteMany();

  for (const item of DEMO_TESTIMONIALS) {
    await prisma.testimonial.create({
      data: item,
    });
    console.log(`Created testimonial from: ${item.name} (${item.company})`);
  }

  const all = await prisma.testimonial.findMany({ orderBy: { order: 'asc' } });
  console.log(`Seeding complete. Total testimonials in DB: ${all.length}`);
}

seedTestimonials()
  .catch((e) => {
    console.error('Error seeding testimonials:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
