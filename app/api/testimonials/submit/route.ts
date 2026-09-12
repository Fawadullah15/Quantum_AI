import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createAdminNotification } from '@/lib/notifications';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, company, role, content, rating, photo } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Review content is required' }, { status: 400 });
    }

    // Save as unpublished (pending admin approval)
    const newTestimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        company: company ? String(company).trim() : null,
        role: role ? String(role).trim() : null,
        content: content.trim(),
        rating: typeof rating === 'number' && rating >= 1 && rating <= 5 ? rating : 5,
        photo: photo && typeof photo === 'string' ? photo.trim() : null,
        published: false, // Default false until admin approves
        order: 999, // Placed at end until sorted by admin
      },
    });

    revalidatePath('/admin/testimonials');
    revalidatePath('/admin');

    // Centralized Admin Notification & Email Copy to quantumai.cmp@gmail.com
    await createAdminNotification({
      type: 'TESTIMONIAL',
      title: `New Client Review from ${name.trim()}`,
      subtitle: `${company ? String(company).trim() + ' • ' : ''}${rating || 5} Stars Rating`,
      senderName: name.trim(),
      preview: content.trim().length > 120 ? content.trim().slice(0, 120) + '...' : content.trim(),
      link: '/admin/testimonials',
      details: {
        id: newTestimonial.id,
        name: name.trim(),
        company: company ? String(company).trim() : null,
        role: role ? String(role).trim() : null,
        rating: typeof rating === 'number' ? rating : 5,
        content: content.trim(),
        photo: photo ? String(photo).trim() : null,
        createdAt: newTestimonial.createdAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your testimonial has been submitted for review.',
        data: newTestimonial,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting client review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
