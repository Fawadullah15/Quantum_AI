export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  photo?: string;
  order: number;
}

export const sampleTestimonials: TestimonialItem[] = [
  {
    id: 'test-01',
    name: 'Marcus Vance',
    role: 'VP of Engineering',
    company: 'Nexus Supply Chain Systems',
    content: 'Quantum AI engineered an autonomous routing engine that exceeded our internal performance targets within 90 days. Their engineering rigor and communication were exceptional.',
    rating: 5,
    order: 1,
  },
  {
    id: 'test-02',
    name: 'Dr. Elena Rostova',
    role: 'Chief Medical Officer',
    company: 'Apex Health Systems',
    content: 'The clinical document intelligence pipeline Quantum AI delivered drastically reduced our chart review friction while maintaining absolute data privacy and HIPAA compliance.',
    rating: 5,
    order: 2,
  },
  {
    id: 'test-03',
    name: 'David Sterling',
    role: 'Managing Director',
    company: 'Strata Capital Markets',
    content: 'Sub-millisecond anomaly detection was a non-negotiable requirement for our trade flow. Quantum AI designed a Rust-powered architecture that operates with flawless precision.',
    rating: 5,
    order: 3,
  },
];
