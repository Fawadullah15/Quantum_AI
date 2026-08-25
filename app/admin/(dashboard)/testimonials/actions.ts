'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function createTestimonial(data: {
  name: string;
  company?: string | null;
  role?: string | null;
  content: string;
  rating?: number;
  photo?: string | null;
  published?: boolean;
  order?: number;
}) {
  await checkAuth();

  const item = await prisma.testimonial.create({
    data: {
      name: data.name.trim(),
      company: data.company?.trim() || null,
      role: data.role?.trim() || null,
      content: data.content.trim(),
      rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
      photo: data.photo || null,
      published: data.published ?? true,
      order: Number(data.order) || 0,
    },
  });

  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  return item;
}

export async function updateTestimonial(
  id: string,
  data: {
    name?: string;
    company?: string | null;
    role?: string | null;
    content?: string;
    rating?: number;
    photo?: string | null;
    published?: boolean;
    order?: number;
  }
) {
  await checkAuth();

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.company !== undefined) updateData.company = data.company?.trim() || null;
  if (data.role !== undefined) updateData.role = data.role?.trim() || null;
  if (data.content !== undefined) updateData.content = data.content.trim();
  if (data.rating !== undefined) updateData.rating = Math.min(5, Math.max(1, Number(data.rating) || 5));
  if (data.photo !== undefined) updateData.photo = data.photo || null;
  if (data.published !== undefined) updateData.published = Boolean(data.published);
  if (data.order !== undefined) updateData.order = Number(data.order) || 0;

  const item = await prisma.testimonial.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  return item;
}

export async function deleteTestimonial(id: string) {
  await checkAuth();

  await prisma.testimonial.delete({ where: { id } });

  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  return { success: true };
}
