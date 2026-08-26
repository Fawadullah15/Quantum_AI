export interface LeaderItem {
  id: string;
  publicId: string;
  slug: string;
  name: string;
  position: string;
  department: string;
  shortBio: string;
  fullBio?: string;
  photo?: string;
  email?: string;
  linkedin?: string;
  github?: string;
  displayOrder: number;
}

export const sampleLeadership: LeaderItem[] = [
  {
    id: 'lead-01',
    publicId: 'QA-001',
    slug: 'fawadullah-imraj',
    name: 'Fawadullah Imraj',
    position: 'Chief Executive Officer',
    department: 'Executive Leadership',
    shortBio: 'Leading technology strategy and architecture at Quantum AI. Focused on building high-performance AI systems and custom business software.',
    fullBio: 'Fawadullah guides the architectural vision and engineering standards at Quantum AI, partnering with enterprise leaders to transform complex operational bottlenecks into intelligent, scalable software systems.',
    email: 'fawadimraj@gmail.com',
    linkedin: 'https://linkedin.com',
    displayOrder: 1,
  },
  {
    id: 'lead-02',
    publicId: 'QA-002',
    slug: 'fahad-khan',
    name: 'Fahad Khan',
    position: 'Chief Technology Officer',
    department: 'Engineering & Research',
    shortBio: 'Directing systems engineering and infrastructure scalability across all deployment environments.',
    fullBio: 'Fahad oversees distributed systems design, cloud topology, and technical reliability across Quantum AI client platforms, ensuring enterprise-grade security and zero-downtime execution.',
    email: 'fahad@quantumai.dev',
    linkedin: 'https://linkedin.com',
    displayOrder: 2,
  },
];
