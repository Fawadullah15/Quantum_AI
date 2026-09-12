import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createAdminNotification } from '@/lib/notifications';

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

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();
    const cleanCompany = company ? String(company).trim() : null;
    const cleanProjectType = projectType ? String(projectType).trim() : null;

    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanBudget = budget ? String(budget).trim() : null;

    const submission = await prisma.contactSubmission.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        company: cleanCompany,
        phone: cleanPhone,
        projectType: cleanProjectType,
        budget: cleanBudget,
        status: 'NEW',
      },
    });

    // Centralized Admin Notification & Email Dispatch to quantumai.cmp@gmail.com
    await createAdminNotification({
      type: cleanProjectType ? 'PROJECT_INQUIRY' : 'CONTACT',
      title: cleanProjectType ? `New ${cleanProjectType} Inquiry` : `New Contact Message from ${cleanName}`,
      subtitle: cleanCompany ? `${cleanCompany} • ${cleanProjectType || cleanEmail}` : (cleanProjectType || cleanEmail),
      senderName: cleanName,
      senderEmail: cleanEmail,
      preview: cleanMessage.length > 120 ? cleanMessage.slice(0, 120) + '...' : cleanMessage,
      link: `/admin/messages/${submission.id}`,
      details: {
        id: submission.id,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        company: cleanCompany,
        projectType: cleanProjectType,
        budget: cleanBudget,
        message: cleanMessage,
        createdAt: submission.createdAt,
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
