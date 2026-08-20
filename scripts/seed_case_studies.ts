import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const projects = [
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

async function seedCaseStudies() {
  console.log('Seeding 12 Case Studies into Prisma PostgreSQL database...');

  // Check and clean up legacy / outdated test records if any
  const existingStudies = await prisma.caseStudy.findMany();
  console.log(`Found ${existingStudies.length} existing records in CaseStudy table.`);
  for (const s of existingStudies) {
    console.log(`- Existing: [Order ${s.order}] ${s.title} (slug: ${s.slug})`);
  }

  // Remove any obsolete test record that does not match our official 12 slugs
  const validSlugs = new Set(projects.map((p) => p.slug));
  for (const s of existingStudies) {
    if (!validSlugs.has(s.slug)) {
      console.log(`Removing obsolete/test record: "${s.title}" (${s.slug})`);
      await prisma.caseStudy.delete({ where: { id: s.id } });
    }
  }

  for (const project of projects) {
    const existing = await prisma.caseStudy.findUnique({
      where: { slug: project.slug },
    });

    if (existing) {
      console.log(`Updating existing record: "${project.title}" (slug: ${project.slug})`);
      await prisma.caseStudy.update({
        where: { slug: project.slug },
        data: {
          title: project.title,
          client: project.client,
          industry: project.industry,
          year: project.year,
          order: project.order,
          problem: project.problem,
          solution: project.solution,
          implementation: project.implementation,
          results: project.results,
          technologies: project.technologies,
          services: project.services,
          published: project.published,
        },
      });
    } else {
      console.log(`Creating new record: "${project.title}" (slug: ${project.slug})`);
      await prisma.caseStudy.create({
        data: {
          title: project.title,
          slug: project.slug,
          client: project.client,
          industry: project.industry,
          year: project.year,
          order: project.order,
          problem: project.problem,
          solution: project.solution,
          implementation: project.implementation,
          results: project.results,
          technologies: project.technologies,
          services: project.services,
          published: project.published,
        },
      });
    }
  }

  const finalCount = await prisma.caseStudy.count();
  console.log(`✓ Seeding finished. Total CaseStudy records in DB: ${finalCount}`);
  
  const allFinal = await prisma.caseStudy.findMany({ orderBy: { order: 'asc' } });
  for (const item of allFinal) {
    console.log(`[Order ${item.order}] "${item.title}" | slug: ${item.slug} | published: ${item.published}`);
  }
}

seedCaseStudies()
  .catch((e) => {
    console.error('Error seeding case studies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
