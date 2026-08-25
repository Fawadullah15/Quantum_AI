export interface TechnologyItem {
  id: string;
  slug: string;
  name: string;
  category: 'AI/ML' | 'Frontend' | 'Backend' | 'Database' | 'Infrastructure' | 'DevOps';
  shortDescription: string;
  description: string;
  tags: string[];
  useCases: string[];
  order: number;
}

export const sampleTechnologies: TechnologyItem[] = [
  {
    id: 'tech-01',
    slug: 'artificial-intelligence',
    name: 'AI & Machine Learning',
    category: 'AI/ML',
    shortDescription: 'Modern foundational models, custom embeddings, and quantized local inference engines.',
    description: 'We deploy open-weights and proprietary neural architectures tuned for domain-specific accuracy and high throughput.',
    tags: ['PyTorch', 'TensorFlow', 'vLLM', 'Ollama', 'HuggingFace', 'LangChain', 'LlamaIndex'],
    useCases: [
      'Private enterprise knowledge retrieval',
      'Autonomous decision agents',
      'Real-time streaming classification',
    ],
    order: 1,
  },
  {
    id: 'tech-02',
    slug: 'cloud-backend',
    name: 'Backend & Distributed Systems',
    category: 'Backend',
    shortDescription: 'High-throughput event-driven microservices engineered in Go, Rust, Python, and Node.js.',
    description: 'Built for sub-millisecond response times, zero-loss message processing, and seamless horizontal elasticity.',
    tags: ['Go', 'Rust', 'Python', 'Node.js', 'FastAPI', 'gRPC', 'Apache Kafka'],
    useCases: [
      'High-frequency financial transaction processing',
      'Multi-tenant enterprise SaaS backends',
      'Real-time streaming telemetry',
    ],
    order: 2,
  },
  {
    id: 'tech-03',
    slug: 'database-systems',
    name: 'Databases & Vector Storage',
    category: 'Database',
    shortDescription: 'ACID-compliant relational engines, distributed key-value stores, and ultra-fast vector indices.',
    description: 'Optimized schemas and vector search topologies designed for millions of embeddings and rigorous query latency SLAs.',
    tags: ['PostgreSQL', 'Qdrant', 'Pinecone', 'Redis', 'ClickHouse', 'Prisma'],
    useCases: [
      'Hybrid semantic vector search',
      'Time-series metrics and analytics',
      'High-concurrency transactional storage',
    ],
    order: 3,
  },
  {
    id: 'tech-04',
    slug: 'infrastructure-cloud',
    name: 'Cloud & Edge Infrastructure',
    category: 'Infrastructure',
    shortDescription: 'Immutable infrastructure-as-code, zero-trust security perimeters, and automated Kubernetes orchestration.',
    description: 'Automated CI/CD pipelines and hardened cloud topologies delivering 99.99% system availability.',
    tags: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform', 'Cloudflare', 'Vercel'],
    useCases: [
      'Multi-region high-availability deployments',
      'Automated zero-downtime blue/green releases',
      'Edge CDN acceleration and DDoS protection',
    ],
    order: 4,
  },
];
