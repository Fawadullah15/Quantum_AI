export interface ProjectMetric {
  label: string;
  value: string;
  description?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  client: string;
  industry: string;
  category: string;
  shortDescription: string;
  problem: string;
  solution: string;
  implementation: string;
  technologies: string[];
  results: string;
  year: number;
  services: string[];
  heroImage?: string;
  gallery?: string[];
  metrics: ProjectMetric[];
  featured?: boolean;
}

export const sampleProjects: ProjectItem[] = [
  {
    id: 'proj-01',
    title: 'Autonomous Logistics Routing Engine',
    slug: 'autonomous-logistics-routing-engine',
    client: 'Global Freight Networks',
    industry: 'Logistics & Supply Chain',
    category: 'AI Systems',
    shortDescription: 'Real-time multi-modal dispatch optimization powered by reinforcement learning.',
    problem: 'Manual fleet routing caused excessive fuel burn, 18% delayed deliveries, and inability to dynamically adapt to port bottlenecks.',
    solution: 'Designed and deployed an edge-aware neural routing engine that ingests dynamic traffic, weather, and vessel API telemetry to rebalance route graphs every 30 seconds.',
    implementation: 'Built with distributed Python microservices, Ray cluster for RL inference, Go routing engine, and Next.js operations dashboard.',
    technologies: ['PyTorch', 'Ray', 'Go', 'PostgreSQL', 'Redis', 'Docker'],
    results: '34% reduction in transit dispatch delays and $4.2M annualized fuel cost savings across 1,200 active vehicles.',
    year: 2024,
    services: ['AI Systems', 'Business Software', 'Cloud Architecture'],
    metrics: [
      { label: 'Dispatch Latency', value: '-34%', description: 'Reduction in transit bottlenecks' },
      { label: 'Fuel Efficiency', value: '+22%', description: 'Fleet-wide operational savings' },
      { label: 'Route Calculations', value: '4.8M/day', description: 'Real-time neural graph passes' },
    ],
    featured: true,
  },
  {
    id: 'proj-02',
    title: 'Clinical Document Intelligence & Triage',
    slug: 'clinical-document-intelligence-triage',
    client: 'Apex Health Systems',
    industry: 'Healthcare & Life Sciences',
    category: 'AI Systems',
    shortDescription: 'HIPAA-compliant document synthesis and multi-modal patient intake parsing.',
    problem: 'Clinicians spent 3.5 hours daily manually reviewing scanned medical charts, lab PDF reports, and legacy EHR records.',
    solution: 'Engineered an on-premise multi-modal intelligence pipeline with optical character recognition and domain-adapted LLMs that extracts structured clinical entities with 99.4% accuracy.',
    implementation: 'Zero-data-leakage pipeline using vLLM self-hosted models, Vector DB with hybrid BM25 search, and HL7/FHIR integrations.',
    technologies: ['Python', 'vLLM', 'FastAPI', 'Qdrant', 'Next.js', 'TypeScript'],
    results: 'Cut chart review time from 22 minutes to 90 seconds per patient encounter with zero HIPAA compliance violations.',
    year: 2024,
    services: ['AI Systems', 'Automation', 'Digital Products'],
    metrics: [
      { label: 'Review Time', value: '90 sec', description: 'Down from 22 minutes baseline' },
      { label: 'Extraction Accuracy', value: '99.4%', description: 'Validated against clinical audits' },
      { label: 'Records Ingested', value: '1.2M+', description: 'Processed in first 6 months' },
    ],
    featured: true,
  },
  {
    id: 'proj-03',
    title: 'Real-Time Financial Risk & Anomaly Detection',
    slug: 'real-time-financial-risk-anomaly-detection',
    client: 'Strata Capital Markets',
    industry: 'Financial Services',
    category: 'Business Software',
    shortDescription: 'Sub-millisecond trade stream verification and fraud risk classification.',
    problem: 'Legacy batch risk validation allowed fraudulent transactions and arbitrage drift to go undetected during high-volatility market windows.',
    solution: 'Built an event-driven stream processing pipeline executing low-latency anomaly inference against live FIX protocol financial streams.',
    implementation: 'Rust core computation engine connected to Apache Kafka, ClickHouse time-series store, and WebGL risk visualizer.',
    technologies: ['Rust', 'Apache Kafka', 'ClickHouse', 'TypeScript', 'WebSockets'],
    results: 'Sub-5ms end-to-end evaluation time across 45,000 transactions per second with 0 false-negative critical alerts.',
    year: 2023,
    services: ['Business Software', 'Cloud Architecture'],
    metrics: [
      { label: 'Latency', value: '<5ms', description: 'End-to-end inference pass' },
      { label: 'Throughput', value: '45k TPS', description: 'Sustained market hours load' },
      { label: 'Loss Prevention', value: '$8.7M', description: 'Prevented in first operational year' },
    ],
    featured: true,
  },
  {
    id: 'proj-04',
    title: 'Automated Industrial Quality Vision System',
    slug: 'automated-industrial-quality-vision-system',
    client: 'Vanguard Precision Manufacturing',
    industry: 'Manufacturing & Robotics',
    category: 'Automation',
    shortDescription: 'Edge-deployed computer vision defect detection on high-speed assembly lines.',
    problem: 'Micro-fractures and surface irregularities on precision turbine blades were missed by manual optical spot-checks.',
    solution: 'Constructed custom edge vision hardware clusters running quantized YOLO and transformer vision models at 120 FPS on active conveyor lines.',
    implementation: 'C++ inference engine with TensorRT optimization deployed on industrial Nvidia Jetson AGX units.',
    technologies: ['C++', 'TensorRT', 'CUDA', 'Python', 'WebRTC'],
    results: '99.8% defective component interception rate with 0 assembly line halts.',
    year: 2023,
    services: ['Automation', 'AI Systems'],
    metrics: [
      { label: 'Defect Catch Rate', value: '99.8%', description: 'Exceeding six-sigma requirements' },
      { label: 'Inspection Speed', value: '120 FPS', description: 'Real-time 4K image processing' },
      { label: 'Waste Reduction', value: '-41%', description: 'Material scrap minimization' },
    ],
    featured: true,
  },
];
