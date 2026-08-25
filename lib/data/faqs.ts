export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Engineering' | 'Process' | 'Security';
}

export const sampleFaqs: FaqItem[] = [
  {
    id: 'faq-01',
    category: 'General',
    question: 'What types of projects does Quantum AI take on?',
    answer: 'We specialize in custom AI systems (fine-tuned models, RAG pipelines, agentic workflows), high-performance business software, process automation engines, and scalable SaaS digital products.',
  },
  {
    id: 'faq-02',
    category: 'Engineering',
    question: 'How do you ensure data privacy when building AI systems?',
    answer: 'We prioritize zero-data-retention architectures and self-hosted open-weights models (via vLLM/Ollama on your private VPC or dedicated hardware). Your proprietary enterprise data is never used for external model training.',
  },
  {
    id: 'faq-03',
    category: 'Process',
    question: 'What does a typical project engagement look like?',
    answer: 'We work in five structured phases: (1) Problem Discovery & Architecture Definition, (2) Technical Specification & Prototyping, (3) Core Engineering Sprints, (4) Validation Benchmarking & Hardening, and (5) Production Deployment with Full Source Handover.',
  },
  {
    id: 'faq-04',
    category: 'Security',
    question: 'Who owns the intellectual property and code?',
    answer: 'You retain 100% intellectual property ownership of all custom software, models, datasets, and architecture created during the engagement upon completion.',
  },
];
