export interface CompanyPrinciple {
  number: string;
  title: string;
  description: string;
}

export interface CompanyStat {
  value: string;
  label: string;
  description?: string;
}

export interface CompanyInfo {
  name: string;
  legalName: string;
  tagline: string;
  shortDescription: string;
  email: string;
  routingEmail: string;
  location: string;
  foundedYear: number;
  stats: CompanyStat[];
  principles: CompanyPrinciple[];
}

export const companyData: CompanyInfo = {
  name: 'Quantum AI',
  legalName: 'Quantum AI Engineering Labs',
  tagline: 'We turn complex problems into intelligent, useful systems.',
  shortDescription: 'We combine artificial intelligence, thoughtful systems engineering, and custom software to build technology that solves real operational bottlenecks.',
  email: 'hello@quantumai.dev',
  routingEmail: 'contact@quantumai.dev',
  location: 'Global / Remote Operations',
  foundedYear: 2023,
  stats: [
    { value: '99.4%', label: 'Extraction & Accuracy SLA', description: 'Across production neural deployments' },
    { value: '<5ms', label: 'Inference Latency Target', description: 'On real-time distributed stream engines' },
    { value: '100%', label: 'IP & Code Ownership', description: 'Delivered directly to client repositories' },
    { value: '24/7', label: 'Engineered System Uptime', description: 'Backed by automated cloud recovery' },
  ],
  principles: [
    {
      number: '01',
      title: 'Understand First',
      description: 'Study the problem before building the solution. We avoid unnecessary complexity by addressing root operational friction.',
    },
    {
      number: '02',
      title: 'Build Smarter',
      description: 'Choose technology for value, not hype. Every architectural decision is intentional and justified by measurable impact.',
    },
    {
      number: '03',
      title: 'Keep it Human',
      description: 'Powerful systems should feel simple to use. Complex computational pipelines should yield clean, frictionless experiences.',
    },
    {
      number: '04',
      title: 'Create What Matters',
      description: 'Build technology with real purpose. We engineer systems that deliver measurable, lasting impact for real businesses.',
    },
  ],
};
