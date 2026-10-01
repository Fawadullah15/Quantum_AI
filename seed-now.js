const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

async function main() {
  console.log('=== Seeding Admin User + Technology Records ===\n');

  // 1. Create admin user
  const existingUser = await db.user.findUnique({ where: { email: 'admin@quantumai.dev' } });
  if (!existingUser) {
    const hash = await bcrypt.hash('QuantumAI@2024!', 12);
    const user = await db.user.create({
      data: {
        email: 'admin@quantumai.dev',
        password: hash,
        name: 'Quantum Admin',
        role: 'ADMIN',
      }
    });
    console.log('✓ Admin user created:', user.email);
    console.log('  Password: QuantumAI@2024!');
  } else {
    console.log('✓ Admin user already exists:', existingUser.email);
  }

  // 2. Seed the 4 canonical technology slugs that nav links to
  const canonicalTechs = [
    {
      slug: 'artificial-intelligence',
      name: 'Artificial Intelligence',
      shortDescription: 'Custom AI systems, LLM integrations, and intelligent agents built for real business workflows.',
      category: 'AI/ML',
      heroTitle: 'Artificial Intelligence',
      heroDescription: 'We build production-ready AI systems that solve real problems — from custom language model integrations to intelligent agents that automate complex business workflows.',
      content: '<p>Quantum AI specialises in building AI systems that actually work in production. We integrate leading language models, build custom training pipelines, and deploy intelligent agents tailored to your specific use case.</p><p>Our AI systems are designed for reliability, observability, and continuous improvement — not just demos.</p>',
      features: JSON.stringify([
        { title: 'LLM Integration', description: 'GPT-4, Claude, Gemini, and custom model integrations for your workflows.' },
        { title: 'AI Agents', description: 'Autonomous agents that complete multi-step tasks with human oversight.' },
        { title: 'RAG Systems', description: 'Retrieval-augmented generation for grounded, factual AI responses.' },
        { title: 'Fine-Tuning', description: 'Custom model training on your proprietary data.' },
      ]),
      useCases: JSON.stringify([
        { title: 'Document Intelligence', description: 'Extract, classify, and analyse large document sets automatically.' },
        { title: 'Customer Support AI', description: 'Intelligent support systems that resolve queries without human escalation.' },
        { title: 'Decision Automation', description: 'Automate complex decision processes with auditable AI reasoning.' },
      ]),
      ctaTitle: 'Build Your AI System',
      ctaDescription: 'Tell us about your use case and we will design an AI system that fits your workflow.',
      ctaText: 'Start a Project',
      ctaLink: '/contact',
      order: 0,
      published: true,
    },
    {
      slug: 'machine-learning',
      name: 'Machine Learning',
      shortDescription: 'Predictive models, recommendation systems, and data-driven intelligence built from your data.',
      category: 'AI/ML',
      heroTitle: 'Machine Learning',
      heroDescription: 'We design and deploy machine learning systems that learn from your data and improve continuously over time.',
      content: '<p>Machine learning enables systems to improve automatically from experience. We build everything from simple predictive models to complex neural networks — always focused on your business outcomes, not just model metrics.</p>',
      features: JSON.stringify([
        { title: 'Predictive Analytics', description: 'Forecast outcomes before they happen using historical patterns.' },
        { title: 'Recommendation Engines', description: 'Surface the right content, product, or action at the right time.' },
        { title: 'Anomaly Detection', description: 'Catch unusual patterns in real-time before they become problems.' },
        { title: 'Classification Systems', description: 'Automatically categorise data, images, and documents at scale.' },
      ]),
      useCases: JSON.stringify([
        { title: 'Sales Forecasting', description: 'Predict revenue and demand with high accuracy.' },
        { title: 'Fraud Detection', description: 'Identify fraudulent transactions in real-time.' },
        { title: 'Personalisation', description: 'Tailor user experiences to individual behaviour.' },
      ]),
      ctaTitle: 'Apply Machine Learning',
      ctaDescription: 'We help you identify where ML can have the biggest impact in your business.',
      ctaText: 'Start a Project',
      ctaLink: '/contact',
      order: 1,
      published: true,
    },
    {
      slug: 'cloud-systems',
      name: 'Cloud Systems',
      shortDescription: 'Scalable cloud infrastructure, serverless architectures, and deployment pipelines for modern software.',
      category: 'Infrastructure',
      heroTitle: 'Cloud Systems',
      heroDescription: 'We design and build cloud infrastructure that scales reliably, deploys consistently, and costs what it should.',
      content: '<p>Modern software requires modern infrastructure. We build on AWS, GCP, and Azure — designing systems that scale automatically, recover from failures, and give your team full observability.</p>',
      features: JSON.stringify([
        { title: 'Serverless Architecture', description: 'Build and scale without managing servers.' },
        { title: 'Container Orchestration', description: 'Docker and Kubernetes for consistent deployments.' },
        { title: 'CI/CD Pipelines', description: 'Automated testing and deployment for every code change.' },
        { title: 'Infrastructure as Code', description: 'Reproducible, auditable infrastructure with Terraform.' },
      ]),
      useCases: JSON.stringify([
        { title: 'API Backends', description: 'High-performance, globally distributed API infrastructure.' },
        { title: 'Data Pipelines', description: 'Reliable ETL and streaming data infrastructure.' },
        { title: 'Multi-Region Deployment', description: 'Deploy globally with automatic failover.' },
      ]),
      ctaTitle: 'Build Better Infrastructure',
      ctaDescription: 'Let us design a cloud architecture that fits your scale and budget.',
      ctaText: 'Start a Project',
      ctaLink: '/contact',
      order: 2,
      published: true,
    },
    {
      slug: 'data-systems',
      name: 'Data Systems',
      shortDescription: 'Databases, data warehouses, real-time pipelines, and analytics platforms that handle data at scale.',
      category: 'Database',
      heroTitle: 'Data Systems',
      heroDescription: 'We design data architectures that store, process, and surface your data reliably at any scale.',
      content: '<p>Data is the foundation of every AI system and business intelligence tool. We design databases, warehouses, and streaming systems that give you reliable, fast access to your data — and the infrastructure to act on it.</p>',
      features: JSON.stringify([
        { title: 'Database Design', description: 'Relational and non-relational databases designed for your access patterns.' },
        { title: 'Data Warehousing', description: 'Centralised analytics with BigQuery, Snowflake, or custom warehouses.' },
        { title: 'Real-Time Streaming', description: 'Kafka and streaming systems for real-time data processing.' },
        { title: 'Vector Databases', description: 'Semantic search and embedding storage for AI systems.' },
      ]),
      useCases: JSON.stringify([
        { title: 'Analytics Platforms', description: 'Self-serve analytics for non-technical business users.' },
        { title: 'AI Feature Stores', description: 'Structured data pipelines that feed machine learning models.' },
        { title: 'Operational Databases', description: 'High-throughput transactional databases for production applications.' },
      ]),
      ctaTitle: 'Design Your Data Architecture',
      ctaDescription: 'Tell us your data challenges and we will design a system that solves them.',
      ctaText: 'Start a Project',
      ctaLink: '/contact',
      order: 3,
      published: true,
    },
  ];

  for (const tech of canonicalTechs) {
    const existing = await db.technology.findUnique({ where: { slug: tech.slug } });
    if (!existing) {
      await db.technology.create({ data: tech });
      console.log(`✓ Technology created: ${tech.name} (/${tech.slug})`);
    } else {
      // Update to ensure published=true and has all fields
      await db.technology.update({ where: { slug: tech.slug }, data: { published: true, ...tech } });
      console.log(`✓ Technology updated: ${tech.name} (/${tech.slug})`);
    }
  }

  console.log('\n=== Done! ===');
  console.log('Admin login: admin@quantumai.dev / QuantumAI@2024!');
  console.log('Technology routes are now live:');
  console.log('  /technologies/artificial-intelligence');
  console.log('  /technologies/machine-learning');
  console.log('  /technologies/cloud-systems');
  console.log('  /technologies/data-systems');
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => db.$disconnect());
