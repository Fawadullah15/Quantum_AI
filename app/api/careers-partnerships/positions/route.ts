import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_POSITIONS = [
  { id: 'pos-1', title: 'Senior AI / Machine Learning Engineer', department: 'AI Engineering', workType: 'Full Time' },
  { id: 'pos-2', title: 'Neural Systems & Agent Architect', department: 'AI Engineering', workType: 'Full Time' },
  { id: 'pos-3', title: 'Full-Stack Software Engineer (Next.js / TypeScript)', department: 'Software', workType: 'Full Time' },
  { id: 'pos-4', title: 'Cloud Systems & Distributed Infrastructure Engineer', department: 'Infrastructure', workType: 'Full Time' },
  { id: 'pos-5', title: 'AI Research Scientist (LoRA / Multi-Modal)', department: 'Research', workType: 'Full Time' },
  { id: 'pos-6', title: 'AI Engineering Intern (Summer / Winter)', department: 'AI Engineering', workType: 'Internship' },
  { id: 'pos-7', title: 'Freelance Specialized AI Consultant', department: 'Operations', workType: 'Freelance' },
  { id: 'pos-8', title: 'General Application (Future Openings)', department: 'Operations', workType: 'Remote' },
];

export async function GET() {
  try {
    const dbPositions = await prisma.careerPosition.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }).catch(() => []);

    const positions = dbPositions.length > 0 ? dbPositions : DEFAULT_POSITIONS;
    return NextResponse.json(positions);
  } catch (error) {
    return NextResponse.json(DEFAULT_POSITIONS);
  }
}
