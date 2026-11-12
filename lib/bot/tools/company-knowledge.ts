import { BotToolImplementation } from './types';
import { COPILOT_CASE_STUDY } from '@/lib/default-projects';
import { DEFAULT_SETTINGS } from '@/lib/settings';

const COMPANY_KNOWLEDGE_BASE = [
  {
    topic: 'overview',
    title: 'Quantum AI — Company Overview & Mission',
    content: `Quantum AI is an advanced software engineering and AI systems company founded by Fawadullah Imraj and Muhammad Murtaza.
The company specializes in custom enterprise software, workflow automation pipelines, industrial engineering AI systems, and scalable digital products for manufacturers, engineering firms, and businesses with complex operations.
Headquarters: Hybrid / Global.
Contact: support@quantumaitech.org
Website: https://quantumaitech.org`,
  },
  {
    topic: 'copilot',
    title: 'Flagship Product — Mechanical Engineering Design Copilot',
    content: `Mechanical Engineering Design Copilot is a specialized engineering intelligence copilot developed by Quantum AI.
Purpose: Assists mechanical engineers with component sizing, mathematical design calculations (shafts, keys, bearings, gears, fasteners), material evaluation (yield strength, tensile, fatigue, weight), safety factor analysis, and technical report generation.
Philosophy: Designed as an engineering reasoning workspace, not merely a chatbot. The engineer reviews and validates final designs.`,
  },
  {
    topic: 'services',
    title: 'Core Services & Capabilities',
    content: `Quantum AI provides 4 primary service categories:
1. AI Systems Engineering: Neural workflows, predictive modeling, machine learning pipelines, LLM agent integration, computer vision.
2. Business & Industrial Software: Custom ERPs, manufacturing telemetry, high-throughput backend APIs, inventory management.
3. Automation: Robotic process automation, data pipeline orchestrators, event-driven microservices.
4. Digital Products: Production-ready SaaS platforms, responsive web applications, and intuitive enterprise UI.`,
  },
  {
    topic: 'leadership',
    title: 'Executive Leadership & Founders',
    content: `Executive Leadership:
- Fawadullah Imraj: Co-Founder & Chief Executive Officer. Directs overall technology roadmap, enterprise digital solutions, and systems engineering.
- Muhammad Murtaza: Co-Founder & Chief Executive Officer. Focuses on neural systems, workflow automation pipelines, and high-concurrency architectures.
Contact for leadership: support@quantumaitech.org`,
  },
  {
    topic: 'technologies',
    title: 'Engineering Technology Stack',
    content: `Core Technology Stack utilized by Quantum AI:
- Artificial Intelligence & ML: PyTorch, TensorFlow, Google Gen AI (Gemini), OpenAI API, Hugging Face, Scikit-learn.
- Full-Stack & Frontend: Next.js 16 (Turbopack, App Router), React 19, TypeScript, Three.js / React Three Fiber (3D graphics), Tailwind CSS.
- Cloud & Infrastructure: Vercel Serverless & Edge, AWS, Docker, Kubernetes, PostgreSQL, Redis, Neon Database.
- Security & Standards: Zero-trust architecture, OAuth 2.0 / JWT NextAuth, automated CI/CD pipelines.`,
  },
];

export const companyKnowledgeTool: BotToolImplementation = {
  declaration: {
    name: 'query_quantum_ai_knowledge',
    description: 'Retrieve verified, detailed information about Quantum AI — including company services, the Mechanical Copilot, leadership, technologies, case studies, and contact options.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query or keyword regarding Quantum AI (e.g. "Mechanical Copilot", "services", "founders", "leadership", "contact", "tech stack").',
        },
      },
      required: ['query'],
    },
  },
  execute: async (args: Record<string, any>) => {
    const q = (args?.query || '').toLowerCase().trim();
    if (!q) {
      return { matches: COMPANY_KNOWLEDGE_BASE };
    }

    // Keyword & semantic relevance ranking
    const matches = COMPANY_KNOWLEDGE_BASE.filter((entry) => {
      const matchTopic = entry.topic.includes(q);
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchContent = entry.content.toLowerCase().includes(q);
      return matchTopic || matchTitle || matchContent;
    });

    if (matches.length > 0) {
      return {
        query: args.query,
        count: matches.length,
        results: matches,
      };
    }

    // Default fallback return general overview
    return {
      query: args.query,
      count: 1,
      results: [COMPANY_KNOWLEDGE_BASE[0]],
      note: 'No exact keyword match found. Providing general Quantum AI overview.',
    };
  },
};
