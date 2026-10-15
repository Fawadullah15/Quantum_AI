'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { softDelete } from '@/lib/recovery';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export interface CaseStudyInput {
  title: string;
  slug?: string;
  client?: string;
  owner?: string;
  industry?: string;
  category?: string;
  problem?: string;
  shortDescription?: string;
  briefDescription?: string;
  solution?: string;
  implementation?: string;
  technologies?: string;
  results?: string;
  year?: number | string;
  services?: string;
  heroImage?: string | null;
  gallery?: string[] | string;
  externalUrl?: string | null;
  url?: string | null;
  published?: boolean | string;
  featured?: boolean | string;
  status?: string;
  fullDescription?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaUrl?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  order?: number | string;
  metrics?: Array<{ label: string; value: string; description?: string | null }>;
}

function sanitizeGallery(input: unknown): string {
  let list: unknown[] = [];
  if (Array.isArray(input)) {
    list = input;
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (typeof parsed === 'string') {
          list = [parsed];
        }
      } catch {
        list = [trimmed];
      }
    }
  }

  const sanitized: string[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    if (typeof item === 'string') {
      const trimmedUrl = item.trim();
      if (trimmedUrl.length > 0 && !seen.has(trimmedUrl)) {
        seen.add(trimmedUrl);
        sanitized.push(trimmedUrl);
      }
    }
  }

  return JSON.stringify(sanitized);
}

export async function createCaseStudy(data: CaseStudyInput) {
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

  const galleryString = sanitizeGallery(data.gallery);

  const study = await prisma.caseStudy.create({
    data: {
      title: data.title.trim(),
      slug,
      client: data.client?.trim() || data.owner?.trim() || 'Quantum AI',
      industry: data.industry?.trim() || data.category?.trim() || 'Artificial Intelligence',
      problem: data.problem?.trim() || data.shortDescription?.trim() || data.briefDescription?.trim() || '',
      solution: data.solution?.trim() || '',
      implementation: data.implementation?.trim() || '',
      technologies: data.technologies?.trim() || '',
      results: data.results?.trim() || '',
      year: parseInt(String(data.year), 10) || new Date().getFullYear(),
      services: data.services?.trim() || '',
      heroImage: data.heroImage || null,
      gallery: galleryString,
      externalUrl: data.externalUrl || data.url || null,
      published: data.published === 'true' || data.published === true || data.published === 'on',
      featured: data.featured === 'true' || data.featured === true || data.featured === 'on',
      status: data.status?.trim() || 'Completed',
      fullDescription: data.fullDescription?.trim() || null,
      primaryCtaLabel: data.primaryCtaLabel?.trim() || null,
      primaryCtaUrl: data.primaryCtaUrl?.trim() || null,
      secondaryCtaLabel: data.secondaryCtaLabel?.trim() || null,
      secondaryCtaUrl: data.secondaryCtaUrl?.trim() || null,
      seoTitle: data.seoTitle?.trim() || null,
      seoDescription: data.seoDescription?.trim() || null,
      order: parseInt(String(data.order), 10) || 0,
      ...(validMetrics.length > 0 ? { metrics: { create: validMetrics } } : {}),
    },
  });

  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath(`/work/${study.slug}`);
  revalidatePath('/case-studies');
  revalidatePath(`/case-studies/${study.slug}`);
  revalidatePath('/admin/case-studies');
  revalidatePath('/admin/projects');
  return study;
}

export async function updateCaseStudy(id: string, data: Partial<CaseStudyInput>) {
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

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (slug !== undefined) updateData.slug = slug;
  if (data.client !== undefined || data.owner !== undefined) {
    updateData.client = (data.client || data.owner || '').trim();
  }
  if (data.industry !== undefined || data.category !== undefined) {
    updateData.industry = (data.industry || data.category || '').trim();
  }
  if (data.problem !== undefined || data.shortDescription !== undefined || data.briefDescription !== undefined) {
    updateData.problem = data.problem?.trim() || data.shortDescription?.trim() || data.briefDescription?.trim() || '';
  }
  if (data.solution !== undefined) updateData.solution = data.solution.trim();
  if (data.implementation !== undefined) updateData.implementation = data.implementation.trim();
  if (data.technologies !== undefined) updateData.technologies = data.technologies.trim();
  if (data.results !== undefined) updateData.results = data.results.trim();
  if (data.year !== undefined) updateData.year = parseInt(String(data.year), 10) || new Date().getFullYear();
  if (data.services !== undefined) updateData.services = data.services.trim();
  if (data.heroImage !== undefined) updateData.heroImage = data.heroImage || null;
  if (data.gallery !== undefined) updateData.gallery = sanitizeGallery(data.gallery);
  if (data.externalUrl !== undefined || data.url !== undefined) {
    updateData.externalUrl = data.externalUrl || data.url || null;
  }
  if (data.published !== undefined) {
    updateData.published = data.published === 'true' || data.published === true || data.published === 'on';
  }
  if (data.featured !== undefined) {
    updateData.featured = data.featured === 'true' || data.featured === true || data.featured === 'on';
  }
  if (data.status !== undefined) {
    updateData.status = data.status.trim() || 'Completed';
  }
  if (data.fullDescription !== undefined) {
    updateData.fullDescription = data.fullDescription?.trim() || null;
  }
  if (data.primaryCtaLabel !== undefined) {
    updateData.primaryCtaLabel = data.primaryCtaLabel?.trim() || null;
  }
  if (data.primaryCtaUrl !== undefined) {
    updateData.primaryCtaUrl = data.primaryCtaUrl?.trim() || null;
  }
  if (data.secondaryCtaLabel !== undefined) {
    updateData.secondaryCtaLabel = data.secondaryCtaLabel?.trim() || null;
  }
  if (data.secondaryCtaUrl !== undefined) {
    updateData.secondaryCtaUrl = data.secondaryCtaUrl?.trim() || null;
  }
  if (data.seoTitle !== undefined) {
    updateData.seoTitle = data.seoTitle?.trim() || null;
  }
  if (data.seoDescription !== undefined) {
    updateData.seoDescription = data.seoDescription?.trim() || null;
  }
  if (data.order !== undefined) updateData.order = parseInt(String(data.order), 10) || 0;

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

  let targetId = id;
  let targetStudy = await prisma.caseStudy.findFirst({
    where: { OR: [{ id }, { slug: id }, { slug: 'mechanical-engineering-design-copilot' }] },
  });
  if (targetStudy) {
    targetId = targetStudy.id;
  } else if (id.includes('mechanical-engineering-design-copilot')) {
    const { ensureMechanicalCopilotInDb } = await import('@/lib/default-projects');
    targetStudy = await ensureMechanicalCopilotInDb();
    if (targetStudy) {
      targetId = targetStudy.id;
    }
  }

  const study = await prisma.caseStudy.update({
    where: { id: targetId },
    data: updateData,
  });

  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath(`/work/${study.slug}`);
  revalidatePath('/case-studies');
  revalidatePath(`/case-studies/${study.slug}`);
  revalidatePath('/admin/case-studies');
  revalidatePath('/admin/projects');
  return study;
}

export async function togglePublishCaseStudy(id: string, published: boolean) {
  await checkAuth();
  let targetStudy = await prisma.caseStudy.findFirst({
    where: { OR: [{ id }, { slug: id }, { slug: 'mechanical-engineering-design-copilot' }] },
  });

  if (!targetStudy && id.includes('mechanical-engineering-design-copilot')) {
    const { ensureMechanicalCopilotInDb } = await import('@/lib/default-projects');
    targetStudy = await ensureMechanicalCopilotInDb();
  }

  const study = await prisma.caseStudy.update({
    where: { id: targetStudy ? targetStudy.id : id },
    data: { published },
  });

  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath(`/work/${study.slug}`);
  revalidatePath('/case-studies');
  revalidatePath(`/case-studies/${study.slug}`);
  revalidatePath('/admin/case-studies');
  revalidatePath('/admin/projects');
  return study;
}

export async function toggleFeaturedCaseStudy(id: string, featured: boolean) {
  await checkAuth();
  let targetStudy = await prisma.caseStudy.findFirst({
    where: { OR: [{ id }, { slug: id }, { slug: 'mechanical-engineering-design-copilot' }] },
  });

  if (!targetStudy && id.includes('mechanical-engineering-design-copilot')) {
    const { ensureMechanicalCopilotInDb } = await import('@/lib/default-projects');
    targetStudy = await ensureMechanicalCopilotInDb();
  }

  const study = await prisma.caseStudy.update({
    where: { id: targetStudy ? targetStudy.id : id },
    data: { featured },
  });

  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath(`/work/${study.slug}`);
  revalidatePath('/admin/case-studies');
  revalidatePath('/admin/projects');
  return study;
}

export async function deleteCaseStudy(id: string) {
  const session = await checkAuth();
  const user = session.user as any;

  let targetId = id;
  const targetStudy = await prisma.caseStudy.findFirst({
    where: { OR: [{ id }, { slug: id }, { slug: 'mechanical-engineering-design-copilot' }] },
  });
  if (targetStudy) {
    targetId = targetStudy.id;
  }

  await softDelete({
    entityType: 'CASE_STUDY',
    id: targetId,
    adminUser: { id: user?.id, name: user?.name, email: user?.email },
  });

  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath('/admin/case-studies');
  revalidatePath('/admin/projects');
  return { success: true };
}

