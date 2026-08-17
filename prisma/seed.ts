import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // 1. Seed SUPER_ADMIN User
  const hashedPassword = await bcrypt.hash('Admin@123456', 10)
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })

  // 2. Seed SiteSettings
  const settings = [
    { key: 'QUANTUM_AI', value: 'QUANTUM_AI' },
    { key: 'company_tagline', value: 'One intelligence core. Many systems. Real products. Real results.' },
    { key: 'company_email', value: 'hello@company.com' },
    { key: 'company_location', value: 'Your City, Country' },
    { key: 'company_twitter', value: '' },
    { key: 'company_linkedin', value: '' },
    { key: 'company_github', value: '' },
    { key: 'meta_title', value: 'QUANTUM_AI — Intelligent Software' },
    { key: 'meta_description', value: 'One intelligence core. Many systems. Real products. Real results. We build AI systems and complete software products for businesses.' },
  ]
  for (const s of settings) {
    await prisma.siteSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    })
  }

  // 3. Seed Founders (use name as unique key via findFirst + upsert pattern)
  const founders = [
    {
      name: 'Fawadullah Imraj',
      role: 'Co-Founder & CEO',
      bio: '[Placeholder — edit this biography in the admin panel. Describe your background, expertise, and vision for the company.]',
      order: 1,
    },
    {
      name: 'Fahad Khan',
      role: 'Co-Founder & CTO',
      bio: '[Placeholder — edit this biography in the admin panel. Describe your technical background, expertise, and engineering philosophy.]',
      order: 2,
    },
  ]
  for (const f of founders) {
    const existing = await prisma.founder.findFirst({ where: { name: f.name } })
    if (!existing) {
      await prisma.founder.create({
        data: { ...f, published: true },
      })
    }
  }

  // 4. Seed Services
  const services = [
    { name: 'AI Systems', category: 'AI', description: 'End-to-end AI system design, development, and deployment for complex business problems.' },
    { name: 'AI Agents', category: 'AI', description: 'Intelligent autonomous agents that reason, plan, and act on behalf of your business.' },
    { name: 'Machine Learning', category: 'AI', description: 'Custom ML models trained on your data to produce measurable business outcomes.' },
    { name: 'Computer Vision', category: 'AI', description: 'Image and video analysis systems for automation, quality control, and insight extraction.' },
    { name: 'RAG Systems', category: 'AI', description: 'Retrieval-Augmented Generation for accurate, grounded AI responses from your knowledge base.' },
    { name: 'AI Automation', category: 'AI', description: 'Intelligent process automation that reduces manual work and increases operational efficiency.' },
    { name: 'AI Infrastructure', category: 'AI', description: 'Scalable infrastructure for deploying and managing AI workloads in production.' },
    { name: 'Custom Business Software', category: 'SOFTWARE', description: 'Bespoke software systems built precisely for your business processes and goals.' },
    { name: 'Web Applications', category: 'SOFTWARE', description: 'High-performance web applications from internal tools to customer-facing platforms.' },
    { name: 'Internal Business Platforms', category: 'SOFTWARE', description: 'ERP, CRM, dashboards, and internal tools that streamline your operations.' },
    { name: 'Business Automation', category: 'SOFTWARE', description: 'Workflow automation systems that connect your tools and eliminate repetitive tasks.' },
    { name: 'SaaS Products', category: 'PRODUCT', description: 'Complete SaaS product development from concept to launch and beyond.' },
    { name: 'Custom Digital Products', category: 'PRODUCT', description: 'Unique digital products built with a focus on user experience and business value.' },
  ]
  for (let i = 0; i < services.length; i++) {
    const s = services[i]
    const existing = await prisma.service.findFirst({ where: { name: s.name } })
    if (!existing) {
      await prisma.service.create({
        data: { ...s, order: i, published: true },
      })
    }
  }

  // 5. Seed Technologies
  const technologies = [
    { name: 'Python', category: 'Language', description: 'Primary language for AI, data science, and backend systems.', usage: 'AI development, data pipelines, FastAPI backends' },
    { name: 'TypeScript', category: 'Language', description: 'Strongly typed JavaScript for robust, maintainable web applications.', usage: 'Frontend and full-stack development' },
    { name: 'React', category: 'Frontend', description: 'Component-based UI library for building interactive interfaces.', usage: 'Web application frontends' },
    { name: 'Next.js', category: 'Frontend', description: 'Production-grade React framework with server-side rendering and API routes.', usage: 'Full-stack web applications, this website' },
    { name: 'FastAPI', category: 'Backend', description: 'Modern, high-performance Python web framework for building APIs.', usage: 'AI service APIs, data processing endpoints' },
    { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime for scalable server-side applications.', usage: 'Real-time applications, microservices' },
    { name: 'PostgreSQL', category: 'Database', description: 'Advanced open-source relational database for production workloads.', usage: 'Primary application database' },
    { name: 'Docker', category: 'Infrastructure', description: 'Containerisation platform for consistent development and deployment.', usage: 'Service containerisation, CI/CD' },
    { name: 'AWS', category: 'Cloud', description: 'Comprehensive cloud platform for scalable infrastructure.', usage: 'Cloud hosting, storage, compute' },
    { name: 'OpenAI API', category: 'AI/ML', description: 'GPT-4 and vision models for language understanding and generation.', usage: 'LLM integration, text and vision tasks' },
    { name: 'Anthropic API', category: 'AI/ML', description: 'Claude models optimised for safety, capability, and long context.', usage: 'LLM integration, complex reasoning tasks' },
    { name: 'LangChain', category: 'AI/ML', description: 'Framework for building LLM-powered applications and chains.', usage: 'AI agent orchestration, RAG pipelines' },
    { name: 'LangGraph', category: 'AI/ML', description: 'Graph-based framework for stateful multi-agent AI workflows.', usage: 'Complex AI agent systems' },
    { name: 'RAG', category: 'AI/ML', description: 'Retrieval-Augmented Generation for grounded, factual AI responses.', usage: 'Knowledge base integration, document Q&A' },
    { name: 'Vector Databases', category: 'Database', description: 'Databases optimised for semantic search and embedding storage.', usage: 'RAG systems, semantic search' },
    { name: 'MCP', category: 'AI/ML', description: 'Model Context Protocol for standardised AI tool and resource integration.', usage: 'AI agent tooling' },
    { name: 'Three.js', category: 'Frontend', description: 'JavaScript 3D graphics library for WebGL experiences.', usage: 'Website 3D intelligence core' },
    { name: 'React Three Fiber', category: 'Frontend', description: 'React renderer for Three.js enabling declarative 3D scenes.', usage: 'Website 3D intelligence core' },
  ]
  for (let i = 0; i < technologies.length; i++) {
    const t = technologies[i]
    const existing = await prisma.technology.findFirst({ where: { name: t.name } })
    if (!existing) {
      await prisma.technology.create({
        data: { ...t, order: i, published: true },
      })
    }
  }

  // 6. Seed Navigation Items
  const navItems = [
    { label: 'Work', href: '/work' },
    { label: 'Products', href: '/products' },
    { label: 'Technology', href: '/technology' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]
  for (let i = 0; i < navItems.length; i++) {
    const nav = navItems[i]
    const existing = await prisma.navigationItem.findFirst({ where: { href: nav.href } })
    if (!existing) {
      await prisma.navigationItem.create({
        data: { ...nav, order: i, external: false },
      })
    }
  }

  console.log('✓ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
