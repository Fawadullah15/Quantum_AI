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

export async function createCaseStudy(data: any) {
  await checkAuth();

  let slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : data.title.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

  if (!slug) slug = `case-study-${Date.now().toString(36)}`;

  // Duplicate slug check
  const existingSlug = await prisma.caseStudy.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const validMetrics = Array.isArray(data.metrics)
    ? data.metrics
        .filter((m: any) => m && m.label?.trim() && m.value?.trim())
        .map((m: any) => ({
          label: m.label.trim(),
          value: m.value.trim(),
          description: m.description?.trim() || null,
        }))
    : [];

  const galleryString = typeof data.gallery === 'string'
    ? data.gallery
    : JSON.stringify(Array.isArray(data.gallery) ? data.gallery.filter(Boolean) : []);

  const study = await prisma.caseStudy.create({
    data: {
      title: data.title.trim(),
      slug,
      client: data.client?.trim() || 'Enterprise Client',
      industry: data.industry?.trim() || 'Artificial Intelligence',
      problem: data.problem?.trim() || data.briefDescription?.trim() || '',
      solution: data.solution?.trim() || '',
      implementation: data.implementation?.trim() || '',
      technologies: data.technologies?.trim() || '',
      results: data.results?.trim() || '',
      year: parseInt(data.year, 10) || new Date().getFullYear(),
      services: data.services?.trim() || '',
      heroImage: data.heroImage || null,
      gallery: galleryString,
      externalUrl: data.externalUrl || data.url || null,
      published: data.published === 'true' || data.published === true || data.published === 'on',
      order: parseInt(data.order, 10) || 0,
      ...(validMetrics.length > 0 ? { metrics: { create: validMetrics } } : {}),
    },
  });

  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath(`/work/${study.slug}`);
  revalidatePath('/case-studies');
  revalidatePath(`/case-studies/${study.slug}`);
  revalidatePath('/admin/case-studies');
  return study;
}

export async function updateCaseStudy(id: string, data: any) {
  await checkAuth();

  let slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : undefined;

  if (slug) {
    const existing = await prisma.caseStudy.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  const galleryString = typeof data.gallery === 'string'
    ? data.gallery
    : Array.isArray(data.gallery)
    ? JSON.stringify(data.gallery.filter(Boolean))
    : undefined;

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (slug !== undefined) updateData.slug = slug;
  if (data.client !== undefined) updateData.client = data.client.trim();
  if (data.industry !== undefined) updateData.industry = data.industry.trim();
  if (data.problem !== undefined || data.briefDescription !== undefined) {
    updateData.problem = data.problem?.trim() || data.briefDescription?.trim() || '';
  }
  if (data.solution !== undefined) updateData.solution = data.solution.trim();
  if (data.implementation !== undefined) updateData.implementation = data.implementation.trim();
  if (data.technologies !== undefined) updateData.technologies = data.technologies.trim();
  if (data.results !== undefined) updateData.results = data.results.trim();
  if (data.year !== undefined) updateData.year = parseInt(data.year, 10) || new Date().getFullYear();
  if (data.services !== undefined) updateData.services = data.services.trim();
  if (data.heroImage !== undefined) updateData.heroImage = data.heroImage || null;
  if (galleryString !== undefined) updateData.gallery = galleryString;
  if (data.externalUrl !== undefined || data.url !== undefined) {
    updateData.externalUrl = data.externalUrl || data.url || null;
  }
  if (data.published !== undefined) {
    updateData.published = data.published === 'true' || data.published === true || data.published === 'on';
  }
  if (data.order !== undefined) updateData.order = parseInt(data.order, 10) || 0;

  if (Array.isArray(data.metrics)) {
    await prisma.caseStudyMetric.deleteMany({ where: { caseStudyId: id } });
    const validMetrics = data.metrics
      .filter((m: any) => m && m.label?.trim() && m.value?.trim())
      .map((m: any) => ({
        caseStudyId: id,
        label: m.label.trim(),
        value: m.value.trim(),
        description: m.description?.trim() || null,
      }));
    if (validMetrics.length > 0) {
      await prisma.caseStudyMetric.createMany({ data: validMetrics });
    }
  }

  const study = await prisma.caseStudy.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath(`/work/${study.slug}`);
  revalidatePath('/case-studies');
  revalidatePath(`/case-studies/${study.slug}`);
  revalidatePath('/admin/case-studies');
  return study;
}

export async function deleteCaseStudy(id: string) {
  await checkAuth();

  const study = await prisma.caseStudy.findUnique({ where: { id } });

  await prisma.caseStudy.delete({
    where: { id },
  });

  revalidatePath('/');
  revalidatePath('/work');
  if (study) {
    revalidatePath(`/work/${study.slug}`);
    revalidatePath(`/case-studies/${study.slug}`);
  }
  revalidatePath('/case-studies');
  revalidatePath('/admin/case-studies');
  return { success: true };
}

