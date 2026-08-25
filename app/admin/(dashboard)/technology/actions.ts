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

export async function createTechnology(data: {
  name: string;
  slug?: string;
  shortDescription: string;
  category?: string;
  heroTitle?: string | null;
  heroDescription?: string | null;
  heroImage?: string | null;
  content?: string | null;
  features?: string | any[];
  useCases?: string | any[];
  ctaTitle?: string | null;
  ctaDescription?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  usage?: string | null;
  projects?: string | null;
  icon?: string | null;
  order?: number;
  published?: boolean;
}) {
  await checkAuth();

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : data.name.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

  const featuresString = typeof data.features === 'string'
    ? data.features
    : JSON.stringify(Array.isArray(data.features) ? data.features : []);

  const useCasesString = typeof data.useCases === 'string'
    ? data.useCases
    : JSON.stringify(Array.isArray(data.useCases) ? data.useCases : []);

  const tech = await prisma.technology.create({
    data: {
      name: data.name.trim(),
      slug: slug || `tech-${Date.now().toString(36)}`,
      shortDescription: data.shortDescription?.trim() || '',
      category: data.category?.trim() || 'AI & Machine Learning',
      heroTitle: data.heroTitle?.trim() || null,
      heroDescription: data.heroDescription?.trim() || null,
      heroImage: data.heroImage || null,
      content: data.content || null,
      features: featuresString,
      useCases: useCasesString,
      ctaTitle: data.ctaTitle?.trim() || null,
      ctaDescription: data.ctaDescription?.trim() || null,
      ctaText: data.ctaText?.trim() || null,
      ctaLink: data.ctaLink?.trim() || null,
      usage: data.usage?.trim() || null,
      projects: data.projects?.trim() || null,
      icon: data.icon || '⚡',
      order: Number(data.order) || 0,
      published: data.published ?? true,
    },
  });

  revalidatePath('/admin/technology');
  revalidatePath('/technology');
  revalidatePath(`/technologies/${tech.slug}`);
  revalidatePath('/');
  return tech;
}

export async function updateTechnology(
  id: string,
  data: {
    name?: string;
    slug?: string;
    shortDescription?: string;
    category?: string;
    heroTitle?: string | null;
    heroDescription?: string | null;
    heroImage?: string | null;
    content?: string | null;
    features?: string | any[];
    useCases?: string | any[];
    ctaTitle?: string | null;
    ctaDescription?: string | null;
    ctaText?: string | null;
    ctaLink?: string | null;
    usage?: string | null;
    projects?: string | null;
    icon?: string | null;
    order?: number;
    published?: boolean;
  }
) {
  await checkAuth();

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : undefined;

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (slug !== undefined) updateData.slug = slug;
  if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription.trim();
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.heroTitle !== undefined) updateData.heroTitle = data.heroTitle?.trim() || null;
  if (data.heroDescription !== undefined) updateData.heroDescription = data.heroDescription?.trim() || null;
  if (data.heroImage !== undefined) updateData.heroImage = data.heroImage || null;
  if (data.content !== undefined) updateData.content = data.content || null;
  if (data.features !== undefined) {
    updateData.features = typeof data.features === 'string' ? data.features : JSON.stringify(data.features);
  }
  if (data.useCases !== undefined) {
    updateData.useCases = typeof data.useCases === 'string' ? data.useCases : JSON.stringify(data.useCases);
  }
  if (data.ctaTitle !== undefined) updateData.ctaTitle = data.ctaTitle?.trim() || null;
  if (data.ctaDescription !== undefined) updateData.ctaDescription = data.ctaDescription?.trim() || null;
  if (data.ctaText !== undefined) updateData.ctaText = data.ctaText?.trim() || null;
  if (data.ctaLink !== undefined) updateData.ctaLink = data.ctaLink?.trim() || null;
  if (data.usage !== undefined) updateData.usage = data.usage?.trim() || null;
  if (data.projects !== undefined) updateData.projects = data.projects?.trim() || null;
  if (data.icon !== undefined) updateData.icon = data.icon || null;
  if (data.order !== undefined) updateData.order = Number(data.order) || 0;
  if (data.published !== undefined) updateData.published = Boolean(data.published);

  const tech = await prisma.technology.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/technology');
  revalidatePath('/technology');
  revalidatePath(`/technologies/${tech.slug}`);
  revalidatePath('/');
  return tech;
}

export async function deleteTechnology(id: string) {
  await checkAuth();

  await prisma.technology.delete({ where: { id } });

  revalidatePath('/admin/technology');
  revalidatePath('/technology');
  revalidatePath('/');
  return { success: true };
}
