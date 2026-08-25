export interface ServiceCapability {
  title: string;
  description: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  category: 'AI' | 'SOFTWARE' | 'AUTOMATION' | 'PRODUCTS';
  shortDescription: string;
  description: string;
  capabilities: string[];
  deliverables: string[];
  icon?: string;
  order: number;
}

export const sampleServices: ServiceItem[] = [
  {
    id: 'srv-01',
    slug: 'ai-systems',
    name: 'AI Systems & Neural Engineering',
    category: 'AI',
    shortDescription: 'Production-ready LLM pipelines, domain-adapted models, and agentic reasoning architectures.',
    description: 'We engineer secure, private, and deterministic artificial intelligence systems designed to solve concrete business bottlenecks without hallucination or data leakage.',
    capabilities: [
      'Custom LLM Fine-Tuning & Quantization',
      'Retrieval-Augmented Generation (RAG) Architecture',
      'Autonomous Multi-Agent Task Orchestration',
      'Computer Vision & Real-Time Object Classification',
      'Zero-Trust Local & On-Prem Model Deployments',
    ],
    deliverables: [
      'Self-hosted inference pipelines',
      'Evaluation benchmarks & guardrail test suites',
      'Developer APIs & telemetry dashboards',
    ],
    order: 1,
  },
  {
    id: 'srv-02',
    slug: 'business-software',
    name: 'Custom Business Software',
    category: 'SOFTWARE',
    shortDescription: 'High-performance core platforms, operational dashboards, and resilient enterprise applications.',
    description: 'Custom software engineered from first principles to match your exact business logic, eliminating the limits and recurring costs of generic SaaS tools.',
    capabilities: [
      'Enterprise Web & Mobile Applications',
      'High-Throughput Distributed Microservices',
      'Legacy System Modernization & Data Migration',
      'Real-Time Collaboration & Operational Portals',
      'Role-Based Access & Strict Multi-Tenant Security',
    ],
    deliverables: [
      'Production-grade cloud codebase',
      'Comprehensive automated test coverage',
      'Architecture documentation & CI/CD deployment pipelines',
    ],
    order: 2,
  },
  {
    id: 'srv-03',
    slug: 'automation',
    name: 'Process & Workflow Automation',
    category: 'AUTOMATION',
    shortDescription: 'Intelligent process automation eliminating repetitive manual toil and operational drag.',
    description: 'We connect disparate enterprise tools, legacy databases, and modern APIs into automated event-driven workflows that execute reliably 24/7.',
    capabilities: [
      'Document Parsing & Automated Data Entry',
      'Multi-System API Integration & Data Sync',
      'Automated Quality Assurance & Risk Auditing',
      'Scheduled Extraction & Intelligence Summarization',
      'Exception Handling & Human-in-the-Loop Triage',
    ],
    deliverables: [
      'Resilient webhook & queue consumers',
      'Automated error-recovery pipelines',
      'Executive observability and alert dashboards',
    ],
    order: 3,
  },
  {
    id: 'srv-04',
    slug: 'digital-products',
    name: 'Digital Products & SaaS Architecture',
    category: 'PRODUCTS',
    shortDescription: 'End-to-end product engineering from initial architecture to multi-tenant market deployment.',
    description: 'Turn ambitious technical ideas into scalable, polished software products designed for user retention, security, and sustained commercial performance.',
    capabilities: [
      'Technical Architecture & System Design',
      'Product UI/UX Design & Interactive Prototypes',
      'Scalable Multi-Tenant Database Architecture',
      'Billing, Stripe & Subscription Management',
      'Telemetry, Analytics & Retention Funnel Tracking',
    ],
    deliverables: [
      'Market-ready MVP or enterprise product',
      'Integrated billing and authentication engine',
      'Full source code and infrastructure ownership',
    ],
    order: 4,
  },
];
