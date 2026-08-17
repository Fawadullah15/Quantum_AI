import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message, company, phone, projectType, budget } = body;

    // Rate limiting (simple log for now)
    console.log(`[RATE LIMIT CHECK] Contact submission from IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`);

    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json({ error: 'Name is required and must be at least 2 characters' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.length < 10) {
      return NextResponse.json({ error: 'Message is required and must be at least 10 characters' }, { status: 400 });
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        message,
        company,
        phone,
        projectType,
        budget,
        status: 'NEW',
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error in contact submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
