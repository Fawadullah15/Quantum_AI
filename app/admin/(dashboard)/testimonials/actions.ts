"use server";

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
  await prisma.testimonial.create({ data });
  revalidatePath('/admin/testimonials');
}

export async function updateTestimonial(id: any, data: TestimonialInput) {
  await prisma.testimonial.update({ where: { id }, data });
  revalidatePath('/admin/testimonials');
}

export async function deleteTestimonial(id: any) {
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath('/admin/testimonials');
}
