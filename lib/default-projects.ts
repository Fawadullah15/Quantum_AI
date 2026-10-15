import prisma from '@/lib/db';

export const COPILOT_CASE_STUDY = {
  id: 'mechanical-engineering-design-copilot',
  title: 'Mechanical Engineering Design Copilot',
  slug: 'mechanical-engineering-design-copilot',
  client: 'Quantum AI',
  industry: 'AI Product / Engineering Software',
  year: 2026,
  order: 0,
  heroImage: '/uploads/mechanical-engineering-design-copilot.png',
  gallery: JSON.stringify(['/uploads/mechanical-engineering-design-copilot.png']),
  featured: true,
  status: 'Prototype in Development',
  shortDescription: 'An AI powered engineering copilot designed to assist with mechanical component design, technical calculations, constraint analysis, material evaluation, and engineering recommendations.',
  fullDescription: `Mechanical Engineering Design Copilot

Overview
Mechanical Engineering Design Copilot is an AI assisted engineering system developed by Quantum AI to help engineers work through mechanical design problems with greater clarity, structured calculations, and technical reasoning.

Traditional mechanical design requires engineers to move between equations, material data, component specifications, engineering references, and repeated calculations. Our goal is to bring these activities into a unified workspace where engineering requirements can be translated into structured analysis and practical design recommendations.

The system is being developed as an engineering reasoning tool, not merely a general purpose chatbot.

The Problem
Mechanical engineers often need to perform multiple calculations, compare design options, evaluate component dimensions, check safety factors, and document their decisions. These tasks can require considerable time, repeated manual work, and careful cross checking.

A single incorrect assumption or calculation can affect the entire design process.

Our Solution
We are developing an AI powered copilot that accepts mechanical engineering requirements and helps organize the process into clear engineering steps. It aims to connect user requirements with relevant equations, design parameters, engineering constraints, component evaluations, and technical recommendations.

The engineer remains responsible for reviewing calculations, confirming applicable standards, and validating the final design.

Planned Core Capabilities
1. Engineering Calculations and Sizing
Assists with calculations for standard mechanical components such as shafts, keys, bearings, gears, fasteners, and simple structural elements.

2. Material Selection Support
Provides structured comparisons between candidate materials based on yield strength, tensile strength, fatigue considerations, weight, operating conditions, and availability.

3. Constraint and Safety Factor Evaluation
Helps engineers analyze design margins, determine appropriate factors of safety, and identify potential stress concentrations or failure modes.

4. Engineering Reasoning and Recommendations
Suggests practical design adjustments, standard commercial sizes, manufacturing considerations, and potential design alternatives.

5. Technical Documentation and Calculation Summaries
Generates clear, step by step calculation reports that engineers can review, export, verify, and include in project documentation.

Example Engineering Use Case
Shaft and Key Sizing for Power Transmission
An engineer needs to design a drive shaft connecting an electric motor to an industrial gearbox.

Inputs
Power: 15 kW
Rotational speed: 1450 RPM
Applied torque: Approximately 98.8 N·m
Material: AISI 1045 steel
Design factor: 2.0

Copilot Actions
Calculates required shaft diameter based on torsional shear stress.
Evaluates standard shaft diameters available from suppliers.
Recommends compatible key and keyway dimensions according to engineering standards.
Presents the full formula, intermediate values, and final engineering checks for human review.

Development Approach
We are approaching this project with engineering rigor:
• Grounding in engineering fundamentals
• Clear formulas and visible calculation steps
• Support for standard mechanical engineering practices
• Human engineer oversight for every critical output
• Focus on practical utility for engineering workflows

Vision
Our long term goal is to build an intelligent design companion that reduces routine engineering friction, accelerates preliminary design cycles, and helps engineering teams explore better technical solutions with confidence.`,
  problem: 'Mechanical engineers often need to perform multiple calculations, compare design options, evaluate component dimensions, check safety factors, and document their decisions. These tasks can require considerable time, repeated manual work, and careful cross checking. A single incorrect assumption or calculation can affect the entire design process.',
  solution: 'We are developing an AI powered copilot that accepts mechanical engineering requirements and helps organize the process into clear engineering steps. It aims to connect user requirements with relevant equations, design parameters, engineering constraints, component evaluations, and technical recommendations.',
  implementation: 'Built around engineering reasoning, deterministic formula engines, parametric verification models, and CAD/design reference datasets. The system integrates standard component databases, material properties, and stress-strain calculations into an interactive engineering copilot workspace.',
  results: 'Reduces routine engineering friction, accelerates preliminary component sizing cycles, and provides auditable step-by-step calculation reports.',
  technologies: 'Artificial Intelligence, Mechanical Design, Engineering Analysis, Product Development, Python, CAD Integration, Fast Computational Solvers',
  services: 'AI Product, Engineering Software, Internal Product, Research and Development',
  primaryCtaLabel: 'Request Technical Demo',
  primaryCtaUrl: '/contact?project=mechanical-engineering-copilot',
  secondaryCtaLabel: 'View Research Scope',
  secondaryCtaUrl: '#capabilities',
  seoTitle: 'Mechanical Engineering Design Copilot — AI Engineering Tool | Quantum AI',
  seoDescription: 'An AI powered engineering copilot designed by Quantum AI to assist with mechanical component design, technical calculations, constraint analysis, and material evaluation.',
  published: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function ensureMechanicalCopilotInDb() {
  try {
    const existing = await prisma.caseStudy.findFirst({
      where: {
        OR: [
          { slug: 'mechanical-engineering-design-copilot' },
          { id: 'mechanical-engineering-design-copilot' },
        ],
      },
    });

    if (!existing) {
      const created = await prisma.caseStudy.create({
        data: {
          title: COPILOT_CASE_STUDY.title,
          slug: COPILOT_CASE_STUDY.slug,
          client: COPILOT_CASE_STUDY.client,
          industry: COPILOT_CASE_STUDY.industry,
          year: COPILOT_CASE_STUDY.year,
          order: COPILOT_CASE_STUDY.order,
          heroImage: COPILOT_CASE_STUDY.heroImage,
          gallery: COPILOT_CASE_STUDY.gallery,
          featured: COPILOT_CASE_STUDY.featured,
          status: COPILOT_CASE_STUDY.status,
          fullDescription: COPILOT_CASE_STUDY.fullDescription,
          problem: COPILOT_CASE_STUDY.problem,
          solution: COPILOT_CASE_STUDY.solution,
          implementation: COPILOT_CASE_STUDY.implementation,
          results: COPILOT_CASE_STUDY.results,
          technologies: COPILOT_CASE_STUDY.technologies,
          services: COPILOT_CASE_STUDY.services,
          primaryCtaLabel: COPILOT_CASE_STUDY.primaryCtaLabel,
          primaryCtaUrl: COPILOT_CASE_STUDY.primaryCtaUrl,
          secondaryCtaLabel: COPILOT_CASE_STUDY.secondaryCtaLabel,
          secondaryCtaUrl: COPILOT_CASE_STUDY.secondaryCtaUrl,
          seoTitle: COPILOT_CASE_STUDY.seoTitle,
          seoDescription: COPILOT_CASE_STUDY.seoDescription,
          published: COPILOT_CASE_STUDY.published,
        },
      });
      return created;
    }
    return existing;
  } catch (err) {
    // Database might be connecting or offline
    return null;
  }
}

export async function getEnsuredAdminCaseStudies() {
  // 1. Attempt to auto-sync into database
  await ensureMechanicalCopilotInDb();

  // 2. Fetch all from database
  let studies: any[] = [];
  try {
    studies = await prisma.caseStudy.findMany({
      orderBy: { order: 'asc' },
    });
  } catch (err) {
    studies = [];
  }

  // 3. Fallback safeguard: if database query failed or hasn't returned copilot, prepend it
  if (!studies.some((s) => s.slug === 'mechanical-engineering-design-copilot')) {
    studies = [COPILOT_CASE_STUDY, ...studies];
  }

  return studies;
}
