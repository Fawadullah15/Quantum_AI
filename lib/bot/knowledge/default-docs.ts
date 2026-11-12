import { COPILOT_CASE_STUDY } from '@/lib/default-projects';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { KnowledgeDocument } from './types';

/**
 * Verified baseline Knowledge Documents sourced strictly from the live
 * Quantum AI public website pages, published specifications, and settings.
 *
 * IMPORTANT: Never add unverified customers, partnerships, achievements,
 * fixed pricing tiers, certifications, or unverified team members.
 */
const VERIFIED_BASELINE_DATE = '2026-11-12T00:00:00.000Z';

export const DEFAULT_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'qa-company-profile',
    title: 'Quantum AI — Company Profile & Operating Focus',
    category: 'company_profile',
    source: 'https://quantumaitech.org/about',
    path: '/about',
    url: 'https://quantumaitech.org/about',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['quantum ai', 'company profile', 'about', 'peshawar', 'pakistan', 'quantumaitech'],
    content: `Company Name: ${DEFAULT_SETTINGS.company_name} (Legal entity: ${DEFAULT_SETTINGS.company_legal_name})
Website: https://quantumaitech.org
Primary Contact Email: ${DEFAULT_SETTINGS.company_email}
Tagline: ${DEFAULT_SETTINGS.company_tagline}
Summary: ${DEFAULT_SETTINGS.company_description}
Operating Base: Operates from Peshawar, Khyber Pakhtunkhwa, Pakistan, working with local businesses and international organizations that need reliable custom software, automation, and AI systems.
Target Sectors:
1. Manufacturing & Industrial Companies (manufacturing management, production monitoring, inventory and warehouse management, quality control, industrial process automation)
2. Engineering & Technical Companies (engineering software, AI-powered engineering tools, technical data management, engineering workflow automation)
3. Business & Enterprise Operations (enterprise management software, ERP and CRM systems, business intelligence dashboards, business process automation)
4. Technology & Software Companies (SaaS development, AI agent integration, custom applications, cloud software, API and backend development)
5. Retail & Inventory Operations (including offline-capable shop and POS workflows)`,
  },
  {
    id: 'qa-mission-vision',
    title: 'Quantum AI — Mission, Vision & Engineering Principles',
    category: 'mission_vision',
    source: 'https://quantumaitech.org/philosophy',
    path: '/philosophy',
    url: 'https://quantumaitech.org/philosophy',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['mission', 'vision', 'philosophy', 'principles', 'how we work', 'oversight'],
    content: `Core Engineering Principles at Quantum AI:
01. Understand First — Study how a client's actual operations work before writing any code so the software is direct, practical, and free of unnecessary complexity.
02. Build Smarter — Choose technology for measurable business value, not hype. Every database, integration, and AI workflow has a clear operational purpose.
03. Keep It Usable — Complex business and technical rules must translate into clean, clear interfaces that everyday staff can use accurately.
04. Create What Lasts — Engineer maintainable systems that grow with the organization, from engineering tools and offline POS systems to AI-driven workflows.

Design & Thinking Pillars (/philosophy):
- Simple and Useful: Clear screens built strictly for utility rather than decoration.
- Clear Information: Plain structured layouts that help teams locate facts and act accurately.
- Connected Systems: Systems that communicate directly with existing tools so data is never re-entered manually.

Long-Term Product Vision:
Build reliable, transparent software and intelligent engineering companions (such as the Mechanical Engineering Design Copilot and QuantumBot) that reduce routine operational friction while preserving explicit human engineer and business oversight over critical outputs.`,
  },
  {
    id: 'qa-services-overview',
    title: 'Quantum AI — Core Services & Delivery Lifecycle',
    category: 'services',
    source: 'https://quantumaitech.org/services',
    path: '/services',
    url: 'https://quantumaitech.org/services',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['services', 'ai systems', 'custom software', 'automation', 'integration', 'saas', 'process'],
    content: `Quantum AI delivers five core verified services (/services):
1. AI Systems & Agentic Workflows (/services/ai-development): AI assistants and multi-agent workflows that search verified company documents/data, answer questions, summarize records, and support day-to-day operational decisions with safety and format checks.
2. Custom Business Software (/services/custom-software-development): Custom manufacturing, production, inventory, ERP, CRM, and operational management platforms (web and offline-capable desktop systems) tailored to real business processes.
3. Business Workflow Automation (/services/business-automation): Automated CRM & lead routing, 24/7 data syncing, automated document/invoice parsing, approval workflows, and notifications that remove repetitive manual entry.
4. Software & API Integration (/services/software-integration): Custom middleware, legacy database bridges, two-way synchronization, and third-party service connectors so disconnected tools share accurate data.
5. Digital Products & SaaS Platforms (/services/digital-products): Multi-customer SaaS platforms, fast Next.js/React web portals, scalable Node.js/FastAPI backend APIs, and admin analytics portals.

Standard Five-Stage Delivery Process:
01. Understand your business problem & operational workflow
02. Define system requirements, data schemas & scope
03. Design architecture, interfaces & human-review checkpoints
04. Build and test across realistic scenarios & edge cases
05. Deploy and support with monitoring and staff onboarding

Note on Pricing: Quantum AI does not publish fixed package prices or flat public pricing tiers. Project pricing and timelines are scoped individually after reviewing technical requirements via /contact or support@quantumaitech.org.`,
  },
  {
    id: 'qa-ai-capabilities',
    title: 'Quantum AI — AI Development Capabilities & Applied Research',
    category: 'ai_capabilities',
    source: 'https://quantumaitech.org/research',
    path: '/research',
    url: 'https://quantumaitech.org/research',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['ai development', 'rag', 'ai agents', 'llm', 'multimodal', 'vision', 'hallucination'],
    content: `AI Development Capabilities & Applied Research Focus (/services/ai-development & /research):
- Multi-Agent Workflows: AI agents coordinating multi-step operational tasks with defined roles and human-review gates where critical.
- Company Knowledge Search (RAG): Semantic vector retrieval over verified company documents, PDFs, and databases so staff get grounded answers with source clarity.
- Multimodal Document & Image Understanding: Inspecting text documents, spreadsheets, engineering specs, screenshots, and images.
- AI Safety & Structured Output Checks: Enforcing schemas, business validation rules, and strict grounding against verified data to minimize hallucinations.
- AI Technology Stack (/technology): Python, PyTorch, TensorFlow, LangChain, Vector Search / Embeddings, LLM orchestration (Google Gemini, OpenAI API, Anthropic Claude, open-weight models), deterministic calculation & tool pipelines.`,
  },
  {
    id: 'qa-software-development',
    title: 'Quantum AI — Custom Software Engineering & Technical Stack',
    category: 'software_development',
    source: 'https://quantumaitech.org/services/custom-software-development',
    path: '/services/custom-software-development',
    url: 'https://quantumaitech.org/services/custom-software-development',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['software development', 'nextjs', 'typescript', 'offline', 'erp', 'crm', 'postgresql', 'ip ownership'],
    content: `Software Engineering Capabilities (/services/custom-software-development & /technology):
- Management & ERP/CRM Platforms: Centralized dashboards uniting student/staff/attendance/billing, manufacturing inventory, customer accounts, and reporting.
- Offline-Capable Architecture: Desktop and local-first retail/shop POS applications that execute transactions reliably without internet connectivity and synchronize automatically when reconnected.
- Role-Based Access & Security: Granular role-based access control (RBAC), audit logging, TLS encryption, private file storage, and isolated deployment environments.
- Engineering Stack: Next.js, React, TypeScript, Tailwind CSS, Node.js, FastAPI, Python, Prisma ORM, PostgreSQL, MySQL, MongoDB, Redis, Docker, Linux, AWS, and Vercel.
- Intellectual Property Ownership: Clients retain 100% ownership of proprietary source code, database schemas, and custom digital assets upon project completion.`,
  },
  {
    id: 'qa-business-automation',
    title: 'Quantum AI — Business Workflow Automation & System Integration',
    category: 'business_automation',
    source: 'https://quantumaitech.org/services/business-automation',
    path: '/services/business-automation',
    url: 'https://quantumaitech.org/services/business-automation',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['business automation', 'crm routing', 'invoice parsing', 'etl', 'webhooks', 'legacy sync'],
    content: `Business Automation & Integration Capabilities (/services/business-automation & /services/software-integration):
- Automated CRM & Lead Routing: Instant lead capture, enrichment, scoring, and team assignment pipelines.
- Automated Document & Invoice Parsing: Extracting structured transaction fields from incoming receipts, invoices, and PDFs directly into accounting or operations systems.
- Resilient Event & Queue Processing: Persistent message queues with automatic retry mechanisms, deterministic conflict resolution rules, failure logging, and admin alerts so no records drop if an upstream third-party API goes down.
- Legacy System Bridges: Custom database connectors and scheduled ETL workers connecting older databases lacking modern REST APIs to modern web/mobile tools via two-way data sync.
- Multi-Channel Notifications: Automated threshold alerts and milestone updates via email, SMS, and messaging channels.`,
  },
  {
    id: 'qa-projects-catalog',
    title: 'Quantum AI — Published Projects, Internal Products & R&D Initiatives',
    category: 'projects',
    source: 'https://quantumaitech.org/work',
    path: '/work',
    url: 'https://quantumaitech.org/work',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['projects', 'case studies', 'work', 'quantumbot', 'school operations', 'offline shop', 'sales pipeline', 'vector search'],
    content: `Published Projects & Portfolio Initiatives (/work):
1. Mechanical Engineering Design Copilot (/work/mechanical-engineering-design-copilot) — Status: Prototype in Development (Internal AI Product / Engineering Software, 2026). AI-assisted engineering design companion for mechanical component sizing, material comparisons, safety factor evaluation, and step-by-step calculation documentation.
2. QuantumBot (/quantumbot) — Built-in multimodal AI assistant on the Quantum AI website featuring floating website launcher, expandable panel, full-screen chat workspace, multi-provider AI gateway, document/image intelligence, tool calling, web research toggle, and verified Quantum AI knowledge retrieval.
3. School Operations Manager (/work/school-operations-manager) — Education ERP uniting academic, student, staff, attendance, fee billing, communication, and administrative workflows.
4. Offline Shop Management System (/work/offline-shop-management-system) — Desktop-ready retail & POS management platform supporting local inventory tracking and sales processing independent of internet uptime.
5. Sales Pipeline Automation System (/work/sales-pipeline-automation-system) — Centralized CRM & automated lead follow-up workflow (Next.js, React, TypeScript, Node.js, FastAPI, PostgreSQL, REST APIs).
6. Vector Search Knowledge Base (/work/vector-search-knowledge-base) — Concept / R&D semantic vector retrieval system indexing organizational information using Python, LangChain, RAG, embeddings, LLMs, FastAPI, and PostgreSQL.
7. AI-Powered Customer Support Assistant (/work/ai-powered-customer-support-assistant) — Concept / R&D contextual customer support engine built with Python, FastAPI, LangChain, RAG, and APIs.
8. Quantum AI Corporate Website & Youth Development Program Website — Web platforms managing dynamic case studies, editorial publishing, and organizational directories.

Accuracy Note: Projects explicitly listed above as "Prototype in Development" or "Concept / R&D" must be described accurately by their published status — do NOT represent prototypes or R&D concepts as third-party enterprise deployments.`,
  },
  {
    id: 'qa-mechanical-copilot',
    title: `Mechanical Engineering Design Copilot — ${COPILOT_CASE_STUDY.status}`,
    category: 'mechanical_copilot',
    source: `https://quantumaitech.org/work/${COPILOT_CASE_STUDY.slug}`,
    path: `/work/${COPILOT_CASE_STUDY.slug}`,
    url: `https://quantumaitech.org/work/${COPILOT_CASE_STUDY.slug}`,
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['mechanical engineering design copilot', 'shaft sizing', 'material selection', 'safety factor', 'engineering copilot'],
    content: `Project: ${COPILOT_CASE_STUDY.title}
Status: ${COPILOT_CASE_STUDY.status} (${COPILOT_CASE_STUDY.year})
Origin / Client: ${COPILOT_CASE_STUDY.client} (${COPILOT_CASE_STUDY.industry})
Overview: An AI-assisted engineering reasoning tool developed by Quantum AI — explicitly built as an engineering analysis system rather than merely a general-purpose chatbot. It brings requirements, engineering equations, material properties, component specifications, and safety checks into one structured workspace.
Human Oversight Principle: The human engineer always remains responsible for reviewing calculations, confirming applicable engineering standards, and validating the final design.

Five Planned Core Capabilities:
1. Engineering Calculations and Sizing: Assists with shafts, keys, bearings, gears, fasteners, and simple structural elements.
2. Material Selection Support: Compares candidate materials by yield strength, tensile strength, fatigue considerations, weight, operating conditions, and availability.
3. Constraint and Safety Factor Evaluation: Analyzes design margins, factors of safety, potential stress concentrations, and failure modes.
4. Engineering Reasoning and Recommendations: Suggests practical design adjustments, standard commercial supplier sizes, manufacturing considerations, and alternatives.
5. Technical Documentation & Calculation Summaries: Generates step-by-step calculation reports for human review and export.

Published Example Use Case (Shaft & Key Sizing):
- Inputs: 15 kW power, 1450 RPM, ~98.8 N·m torque, AISI 1045 steel, design factor 2.0.
- Copilot Actions: Computes required shaft diameter from torsional shear stress, evaluates commercial supplier shaft sizes, recommends standard key/keyway dimensions, and outputs complete intermediate steps for engineer sign-off.
Technologies: ${COPILOT_CASE_STUDY.technologies}.`,
  },
  {
    id: 'qa-team-leadership',
    title: 'Quantum AI — Leadership & Engineering Team',
    category: 'team',
    source: 'https://quantumaitech.org/leadership',
    path: '/leadership',
    url: 'https://quantumaitech.org/leadership',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['team', 'leadership', 'founders', 'founder', 'founded', 'co-founder', 'co-founders', 'ceo', 'fawadullah imraj', 'fahad khan', 'abdullah mahmood', 'anisa safdar', 'waqas ali khan'],
    content: `Verified Quantum AI Leadership & Founders Directory (/leadership):
Quantum AI was co-founded by Fawadullah Imraj (Co-Founder & CEO) and Fahad Khan (Co-Founder & Engineering Strategy Lead).
1. Fawadullah Imraj (QA-001) — Co-Founder & Chief Executive Officer (Executive Leadership, Global / Hybrid). Directs proprietary AI systems engineering, autonomous workflow architectures, and enterprise software products.
2. Fahad Khan (QA-002) — Co-Founder & Engineering Strategy Lead (Executive Leadership, Peshawar). Guides technical architecture, engineering strategy, and scalable systems development.
3. Abdullah Mahmood (QA-003) — Lead Software Engineer (Software Development, Peshawar). Focuses on reliable modern web applications, scalable backends, and full-stack operational platforms.
4. Hafizah Anisa Safdar (QA-004) — Business Development Partner (Business Development, Pk/Remote). Builds client relationships, strategic partnerships, and enterprise market expansion.
5. Waqas Ali Khan (QA-005) — Digital Marketing & Strategic Growth Partner (Business Development, Peshawar). Focuses on strategic partnerships, digital reach, and sustainable business growth.

Verification Note: Only share team members and roles listed in the verified leadership/team directory or database. Do not invent additional executives, board members, or staff.`,
  },
  {
    id: 'qa-contact-careers',
    title: 'Quantum AI — Contact Information, Inquiries & Careers/Partnerships',
    category: 'contact',
    source: 'https://quantumaitech.org/contact',
    path: '/contact',
    url: 'https://quantumaitech.org/contact',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['contact', 'email', 'support@quantumaitech.org', 'inquiry', 'careers', 'partnerships', 'location'],
    content: `Verified Contact & Collaboration Channels:
- Official Contact & Support Email: ${DEFAULT_SETTINGS.company_email}
- Privacy / Data Protection Email: ${DEFAULT_SETTINGS.privacy_email}
- Project Inquiry Form: /contact (https://quantumaitech.org/contact)
- Typical Response Window: ${DEFAULT_SETTINGS.response_time_text}
- Operating Location: Peshawar, Khyber Pakhtunkhwa, Pakistan (serving local businesses and international clients; site metadata also references San Francisco & Islamabad / Global Hybrid collaboration).
- Careers & Business Partnerships: /careers-partnerships (https://quantumaitech.org/careers-partnerships) — handles open positions/applications (careers tab) and business/technology partnership proposals.
- Phone Number: No public phone number is published on the website; inquiries are handled via support@quantumaitech.org or the web forms.
- In-Chat Inquiry Submission: Visitors can ask QuantumBot to help submit a project inquiry directly through its confirmation-guarded inquiry action.`,
  },
  {
    id: 'qa-faq',
    title: 'Quantum AI — Frequently Asked Questions (Verified)',
    category: 'faq',
    source: 'https://quantumaitech.org/services#faq',
    path: '/services',
    url: 'https://quantumaitech.org/services',
    verificationStatus: 'verified',
    lastUpdated: VERIFIED_BASELINE_DATE,
    origin: 'builtin',
    tags: ['faq', 'questions', 'offline', 'hallucinations', 'source code', 'integration', 'quantumbot'],
    content: `Verified Frequently Asked Questions:
Q: What does Quantum AI build?
A: Quantum AI builds AI systems and multi-step AI agents, custom business and industrial software, workflow automation, system/API integrations, and SaaS digital products.

Q: Can Quantum AI integrate AI and automation into existing systems?
A: Yes. We integrate new AI features, automation pipelines, and middleware into existing ERPs, CRMs, web/desktop platforms, and legacy databases (including databases without modern APIs via custom database bridges and ETL workers).

Q: Can custom business software work offline?
A: Yes. Quantum AI engineers offline-first software architectures (such as retail POS and shop systems) that record local transactions reliably during connectivity outages and synchronize automatically once back online.

Q: How does Quantum AI reduce AI hallucinations in business systems?
A: By grounding answers in verified company documents and databases, applying deterministic business rules, and validating outputs against structured schemas.

Q: Who owns the source code for custom software built by Quantum AI?
A: The client owns 100% of the proprietary custom source code, database schemas, and digital assets upon project completion.

Q: What happens if a third-party API fails in an automation pipeline?
A: Quantum AI automation pipelines use persistent queues with automatic retry logic, deterministic conflict resolution, failure logging, and admin alerts to prevent data loss.

Q: What is QuantumBot?
A: QuantumBot is an AI assistant by Quantum AI built into the Quantum AI website (floating launcher and /quantumbot workspace). Its capabilities (such as vision, context window, calculations, optional live web search, and company knowledge lookup) depend on the selected AI model and enabled tools.`,
  },
];
