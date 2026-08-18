import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message, company, phone, projectType, budget } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        company: company ? String(company).trim() : null,
        phone: phone ? String(phone).trim() : null,
        projectType: projectType ? String(projectType).trim() : null,
        budget: budget ? String(budget).trim() : null,
        status: 'NEW',
      },
    });

    revalidatePath('/admin/messages');
    revalidatePath('/admin');
    revalidatePath('/api/admin/notifications');

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error in contact submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
