"use server";

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface TestimonialInput {
  name: string;
  company?: string;
  role?: string;
  content: string;
  rating: number;
  photo?: string;
  published: boolean;
  order: number;
}

export async function createTestimonial(data: TestimonialInput) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const item = await prisma.testimonial.create({ data });
  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  return item;
}

export async function updateTestimonial(id: string, data: TestimonialInput) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const item = await prisma.testimonial.update({ where: { id }, data });
  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  return item;
}

export async function deleteTestimonial(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await prisma.testimonial.delete({ where: { id } });
  revalidatePath('/admin/testimonials');
  revalidatePath('/');
}
