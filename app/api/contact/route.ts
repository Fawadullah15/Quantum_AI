import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendEmail, getContactAdminEmailHtml, ADMIN_NOTIFICATION_EMAIL } from '@/lib/email';

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

    const submission = await prisma.contactSubmission.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        company: cleanCompany,
        phone: phone ? String(phone).trim() : null,
        projectType: cleanProjectType,
        budget: budget ? String(budget).trim() : null,
        status: 'NEW',
      },
    });

    // Send automated email notification to fawadimraj@gmail.com
    const emailHtml = getContactAdminEmailHtml({
      name: cleanName,
      email: cleanEmail,
      company: cleanCompany,
      projectType: cleanProjectType,
      message: cleanMessage,
    });

    await sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `[Quantum AI Contact] New Project Inquiry from ${cleanName}`,
      html: emailHtml,
    }).catch((err) => console.error('[Contact Email Dispatch Error]:', err));

    revalidatePath('/admin/messages');
    revalidatePath('/admin');
    revalidatePath('/api/admin/notifications');

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error in contact submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
