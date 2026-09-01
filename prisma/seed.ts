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
      name: 'Muhammad Murtaza',
      role: 'Co-Founder & CEO',
      bio: '[Placeholder — edit this biography in the admin panel. Describe your background, expertise, and vision for the company.]',
      order: 1,
    },
    {
      name: 'Fahad Khan',
      role: 'Co-Founder & Executive chairman',
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
    { name: 'Python', slug: 'python', category: 'Language', shortDescription: 'Primary language for AI, data science, and backend systems.', usage: 'AI development, data pipelines, FastAPI backends' },
    { name: 'TypeScript', slug: 'typescript', category: 'Language', shortDescription: 'Strongly typed JavaScript for robust, maintainable web applications.', usage: 'Frontend and full-stack development' },
    { name: 'React', slug: 'react', category: 'Frontend', shortDescription: 'Component-based UI library for building interactive interfaces.', usage: 'Web application frontends' },
    { name: 'Next.js', slug: 'nextjs', category: 'Frontend', shortDescription: 'Production-grade React framework with server-side rendering and API routes.', usage: 'Full-stack web applications, this website' },
    { name: 'FastAPI', slug: 'fastapi', category: 'Backend', shortDescription: 'Modern, high-performance Python web framework for building APIs.', usage: 'AI service APIs, data processing endpoints' },
    { name: 'Node.js', slug: 'nodejs', category: 'Backend', shortDescription: 'JavaScript runtime for scalable server-side applications.', usage: 'Real-time applications, microservices' },
    { name: 'PostgreSQL', slug: 'postgresql', category: 'Database', shortDescription: 'Advanced open-source relational database for production workloads.', usage: 'Primary application database' },
    { name: 'Docker', slug: 'docker', category: 'Infrastructure', shortDescription: 'Containerisation platform for consistent development and deployment.', usage: 'Service containerisation, CI/CD' },
    { name: 'AWS', slug: 'aws', category: 'Cloud', shortDescription: 'Comprehensive cloud platform for scalable infrastructure.', usage: 'Cloud hosting, storage, compute' },
    { name: 'OpenAI API', slug: 'openai-api', category: 'AI/ML', shortDescription: 'GPT-4 and vision models for language understanding and generation.', usage: 'LLM integration, text and vision tasks' },
    { name: 'Anthropic API', slug: 'anthropic-api', category: 'AI/ML', shortDescription: 'Claude models optimised for safety, capability, and long context.', usage: 'LLM integration, complex reasoning tasks' },
    { name: 'LangChain', slug: 'langchain', category: 'AI/ML', shortDescription: 'Framework for building LLM-powered applications and chains.', usage: 'AI agent orchestration, RAG pipelines' },
    { name: 'LangGraph', slug: 'langgraph', category: 'AI/ML', shortDescription: 'Graph-based framework for stateful multi-agent AI workflows.', usage: 'Complex AI agent systems' },
    { name: 'RAG', slug: 'rag', category: 'AI/ML', shortDescription: 'Retrieval-Augmented Generation for grounded, factual AI responses.', usage: 'Knowledge base integration, document Q&A' },
    { name: 'Vector Databases', slug: 'vector-databases', category: 'Database', shortDescription: 'Databases optimised for semantic search and embedding storage.', usage: 'RAG systems, semantic search' },
    { name: 'MCP', slug: 'mcp', category: 'AI/ML', shortDescription: 'Model Context Protocol for standardised AI tool and resource integration.', usage: 'AI agent tooling' },
    { name: 'Three.js', slug: 'threejs', category: 'Frontend', shortDescription: 'JavaScript 3D graphics library for WebGL experiences.', usage: 'Website 3D intelligence core' },
    { name: 'React Three Fiber', slug: 'react-three-fiber', category: 'Frontend', shortDescription: 'React renderer for Three.js enabling declarative 3D scenes.', usage: 'Website 3D intelligence core' },
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


  // 6. Seed Case Studies / Works
  const caseStudyRecords = [
    {
      title: 'School Operations Manager',
      slug: 'school-operations-manager',
      client: 'Eden School System.',
      industry: 'Education / School Management',
      year: 2026,
      order: 1,
      problem: 'A centralized school management platform designed to bring academic, administrative, student, staff, attendance, communication, and operational workflows into one digital system. The goal is to reduce fragmented processes and provide schools with a single platform for managing day-to-day operations.',
      solution: 'A full-stack school management system with a modular architecture, role-based access, centralized data management, administrative workflows, and separate interfaces for different users. The system is designed so school operations can be managed through a unified digital platform.',
      implementation: 'Designed as an enterprise-level school management platform with modular features that can be expanded as the institution grows. The system structure supports management of students, staff, academic operations, attendance, communication, administration, and other school workflows.',
      results: 'Provides a centralized digital foundation for managing school operations and reducing reliance on disconnected manual workflows.',
      technologies: 'Next.js, React, TypeScript, Tailwind CSS, Node.js, Prisma, PostgreSQL',
      services: 'Business Software, Custom Software Development, UI/UX Development, Database Systems',
      published: true,
    },
    {
      title: 'Sales Pipeline Automation System',
      slug: 'sales-pipeline-automation-system',
      client: '',
      industry: 'Sales / Business Automation',
      year: 2026,
      order: 2,
      problem: 'A sales workflow system designed to organize leads, opportunities, follow-ups, and customer interactions in one centralized platform. The system helps businesses move away from scattered sales processes and provides a structured way to manage the sales pipeline.',
      solution: 'A web-based business application with centralized customer and pipeline data, structured sales stages, workflow management, and automation capabilities. The architecture is designed to support scalable sales operations and future integrations.',
      implementation: 'Built around a structured sales pipeline where leads and opportunities can move through defined stages. The platform can support automated workflows, data management, sales tracking, and business process improvements.',
      results: 'Creates a centralized sales workflow that gives teams clearer visibility into leads, opportunities, and follow-up activities.',
      technologies: 'Next.js, React, TypeScript, Node.js, FastAPI, PostgreSQL, REST APIs',
      services: 'Business Automation, Custom Software Development, AI Systems, Business Software',
      published: true,
    },
    {
      title: 'Vector Search Knowledge Base',
      slug: 'vector-search-knowledge-base',
      client: '',
      industry: 'Artificial Intelligence / Knowledge Management',
      year: 2026,
      order: 3,
      problem: 'An AI-powered knowledge retrieval system designed to make large collections of information easier to search and use. Instead of relying only on traditional keyword search, the system uses vector-based retrieval to find information according to semantic meaning.',
      solution: 'A retrieval system based on embeddings, vector search, document processing, and AI-powered retrieval workflows. Documents are processed into searchable representations, allowing relevant information to be retrieved based on meaning and context.',
      implementation: 'The system uses a retrieval pipeline that can process documents, generate embeddings, store vector representations, and retrieve relevant information for downstream AI applications. The architecture can support RAG-based applications and AI assistants that need access to private knowledge.',
      results: 'Provides semantic search over knowledge sources and creates a foundation for retrieval-augmented AI applications.',
      technologies: 'Python, LangChain, RAG, Vector Search, Embeddings, LLMs, FastAPI, PostgreSQL',
      services: 'AI Systems, RAG Development, AI Engineering, Custom Software Development',
      published: true,
    },
    {
      title: 'AI-Powered Customer Support Assistant',
      slug: 'ai-powered-customer-support-assistant',
      client: 'Internal / Quantum AI',
      industry: 'Artificial Intelligence / Customer Support',
      year: 2026,
      order: 4,
      problem: 'An AI customer support system designed to handle common customer questions, provide contextual answers, and assist support teams with faster information retrieval.',
      solution: 'An AI assistant connected to a structured knowledge source and conversational interface. The system can use language models and retrieval techniques to provide relevant responses based on available business information.',
      implementation: 'Built around conversational AI, knowledge retrieval, prompt workflows, and backend APIs. The architecture can be extended with business documents, frequently asked questions, support records, and external data sources.',
      results: 'Creates an AI-assisted support workflow that can provide faster access to business information and reduce repetitive support work.',
      technologies: 'Python, FastAPI, LangChain, LLMs, RAG, APIs',
      services: 'AI Development, Conversational AI, Automation, Custom Software Development',
      published: true,
    },
    {
      title: 'Offline Shop Management System',
      slug: 'offline-shop-management-system',
      client: 'Internal / Custom Client Project',
      industry: 'Retail / Business Management',
      year: 2026,
      order: 5,
      problem: 'A desktop-ready shop management system designed for businesses that need product, inventory, sales, and operational management without depending entirely on an internet connection.',
      solution: 'A local application architecture using a Python backend, relational database, and modern web interface. The system is structured to run locally and manage business records through an integrated interface.',
      implementation: 'The system uses FastAPI for backend services, SQLAlchemy for database access, SQLite for local storage, and a React + Vite frontend. The application was also prepared for offline desktop packaging.',
      results: 'Provides a local-first management system for shops that need core business operations available without continuous internet access.',
      technologies: 'Python, FastAPI, SQLAlchemy, SQLite, React, Vite, JavaScript',
      services: 'Business Software, Retail Software, Offline Systems, Custom Software Development',
      published: true,
    },
    {
      title: 'Quantum AI Corporate Website',
      slug: 'quantum-ai-corporate-website',
      client: 'Quantum AI',
      industry: 'Technology / Corporate Website',
      year: 2026,
      order: 6,
      problem: "A modern corporate website created to present Quantum AI's services, products, technology capabilities, leadership, case studies, testimonials, blog content, and business identity through a centralized digital platform.",
      solution: 'A full-stack web platform with a public website and protected Admin Panel. Content is managed through a database-backed CMS so administrators can control major public-facing sections without editing source code.',
      implementation: 'Built with Next.js, React, TypeScript, Tailwind CSS, Prisma, authentication, database-backed content management, and interactive 3D visual elements. The platform includes administrative management for leadership, team members, products, case studies, blog posts, testimonials, media, site settings, and contact submissions.',
      results: "Creates a centralized digital presence and content management system for presenting Quantum AI's services, technology, products, and work.",
      technologies: 'Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth, Three.js, React Three Fiber, Framer Motion',
      services: 'Web Development, UI/UX Development, CMS Development, 3D Web Development, Branding',
      published: true,
    },
    {
      title: 'Youth Development Program Website',
      slug: 'youth-development-program-website',
      client: 'Youth Development Program',
      industry: 'Nonprofit / Organization',
      year: 2026,
      order: 7,
      problem: 'A structured organizational website designed to present leadership, chapters, activities, news, updates, and organizational information through a centralized online platform.',
      solution: 'A public website connected to an administrative content management system, allowing authorized users to manage leadership information, chapters, articles, and other organizational content.',
      implementation: 'Designed with a public-facing experience and backend administration. The system supports structured organizational content, leadership profiles, news and updates, and chapter-based information.',
      results: "Provides an organized digital platform for presenting the program's leadership, activities, chapters, and public information.",
      technologies: 'Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL',
      services: 'Web Development, CMS Development, UI/UX Development',
      published: true,
    },
    {
      title: 'AI Document Intelligence Platform',
      slug: 'ai-document-intelligence-platform',
      client: 'Internal / Quantum AI',
      industry: 'Artificial Intelligence / Document Processing',
      year: 2026,
      order: 8,
      problem: 'An AI document processing concept focused on turning unstructured documents into searchable, organized, machine-readable information for use in business and AI workflows.',
      solution: 'A document ingestion and processing pipeline combining file handling, text extraction, chunking, embeddings, vector storage, and language model based retrieval.',
      implementation: 'The system architecture supports document ingestion, content processing, semantic indexing, retrieval, and AI-assisted question answering. It can serve as a foundation for enterprise knowledge systems and RAG applications.',
      results: 'Creates a foundation for turning business documents into searchable knowledge that can be used by AI applications.',
      technologies: 'Python, LangChain, RAG, Embeddings, Vector Search, LLMs, FastAPI',
      services: 'AI Engineering, Document AI, RAG Development, Knowledge Systems',
      published: true,
    },
    {
      title: 'AI Workflow Automation Platform',
      slug: 'ai-workflow-automation-platform',
      client: 'Internal / Quantum AI',
      industry: 'Artificial Intelligence / Automation',
      year: 2026,
      order: 9,
      problem: 'An automation platform concept focused on connecting business processes, AI models, APIs, data sources, and workflow steps into repeatable automated processes.',
      solution: 'A workflow-based architecture where events trigger automated actions, AI processing, API calls, data transformations, and downstream business tasks.',
      implementation: 'The platform can integrate AI agents, workflow automation, external APIs, databases, and internal business systems to automate repetitive processes and create structured AI workflows.',
      results: 'Provides a foundation for connecting AI capabilities with repeatable business workflows and automated processes.',
      technologies: 'Python, Node.js, APIs, n8n, LangChain, LangGraph, LLMs',
      services: 'AI Automation, Workflow Automation, AI Engineering, API Integration',
      published: true,
    },
    {
      title: 'AI Knowledge Assistant',
      slug: 'ai-knowledge-assistant',
      client: 'Internal / Quantum AI',
      industry: 'Artificial Intelligence / Enterprise Software',
      year: 2026,
      order: 10,
      problem: 'An AI knowledge assistant designed to help users interact with organizational information through natural language rather than manually searching through large collections of documents and records.',
      solution: 'A conversational AI layer connected to document retrieval, vector search, embeddings, and language models. User questions are transformed into relevant searches and the retrieved information is used to generate contextual responses.',
      implementation: 'The system follows a retrieval-augmented generation approach and can connect private organizational knowledge with AI models. It is suitable for internal knowledge bases, support systems, documentation assistants, and information retrieval tools.',
      results: 'Provides a natural-language interface for accessing structured and unstructured organizational knowledge.',
      technologies: 'Python, LangChain, RAG, Vector Search, Embeddings, LLMs, FastAPI',
      services: 'AI Development, RAG Development, Knowledge Management, Custom AI Software',
      published: true,
    },
    {
      title: 'AI Sales Intelligence System',
      slug: 'ai-sales-intelligence-system',
      client: 'Internal / Quantum AI',
      industry: 'Artificial Intelligence / Sales',
      year: 2026,
      order: 11,
      problem: 'An AI-focused sales system designed to help organize customer data, sales opportunities, follow-ups, and business intelligence within a single workflow.',
      solution: 'A business application architecture combining sales data, automated workflows, AI-assisted analysis, and structured customer information.',
      implementation: 'The system is designed around sales records and workflow automation, with AI capabilities that can assist with customer analysis, lead processing, follow-up workflows, and business decision support.',
      results: 'Creates a structured base for combining sales operations with AI-assisted business workflows.',
      technologies: 'Next.js, React, Python, FastAPI, PostgreSQL, LLMs, APIs',
      services: 'AI Development, Sales Automation, Business Software, Data Systems',
      published: true,
    },
    {
      title: 'Quantum AI Content Management System',
      slug: 'quantum-ai-content-management-system',
      client: 'Quantum AI',
      industry: 'Software / Content Management',
      year: 2026,
      order: 12,
      problem: 'A centralized content management system created to allow administrators to control website content, public pages, leadership information, products, case studies, testimonials, blog posts, media, and contact data from one protected interface.',
      solution: 'A database-backed CMS with authentication, administrative CRUD operations, public data retrieval, role-aware management, and reusable content models.',
      implementation: 'The system uses Prisma for database access and protected admin routes for managing public website content. Public pages retrieve content dynamically from the database rather than relying only on hardcoded content.',
      results: 'Provides centralized control over website content and keeps the public website connected to structured administrative data.',
      technologies: 'Next.js, React, TypeScript, Prisma, PostgreSQL, NextAuth, Tailwind CSS',
      services: 'CMS Development, Full-Stack Development, Admin Dashboard Development, Database Systems',
      published: true,
    },
  ];

  for (const cs of caseStudyRecords) {
    await prisma.caseStudy.upsert({
      where: { slug: cs.slug },
      update: {
        title: cs.title,
        client: cs.client,
        industry: cs.industry,
        year: cs.year,
        order: cs.order,
        problem: cs.problem,
        solution: cs.solution,
        implementation: cs.implementation,
        results: cs.results,
        technologies: cs.technologies,
        services: cs.services,
        published: cs.published,
      },
      create: cs,
    });
  }

  // 7. Seed Navigation Items
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
