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

export async function createProduct(data: {
  name: string;
  slug?: string;
  description: string;
  category?: string;
  status?: string;
  heroImage?: string | null;
  demoUrl?: string | null;
  docsUrl?: string | null;
  technologies?: string;
  published?: boolean;
  order?: number;
  features?: { title: string; description: string }[];
}) {
  await checkAuth();

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : data.name.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

  const validFeatures = Array.isArray(data.features)
    ? data.features
        .filter((f) => f && f.title?.trim())
        .map((f, idx) => ({
          title: f.title.trim(),
          description: f.description?.trim() || '',
          order: idx,
        }))
    : [];

  const product = await prisma.product.create({
    data: {
      name: data.name.trim(),
      slug: slug || `product-${Date.now().toString(36)}`,
      description: data.description.trim(),
      category: data.category?.trim() || 'AI Software',
      status: data.status || 'LIVE',
      heroImage: data.heroImage || null,
      demoUrl: data.demoUrl || null,
      docsUrl: data.docsUrl || null,
      technologies: data.technologies || '',
      published: data.published ?? true,
      order: Number(data.order) || 0,
      ...(validFeatures.length > 0 ? { features: { create: validFeatures } } : {}),
    },
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath(`/products/${product.slug}`);
  revalidatePath('/');
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    category?: string;
    status?: string;
    heroImage?: string | null;
    demoUrl?: string | null;
    docsUrl?: string | null;
    technologies?: string;
    published?: boolean;
    order?: number;
    features?: { title: string; description: string }[];
  }
) {
  await checkAuth();

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : undefined;

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (slug !== undefined) updateData.slug = slug;
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.status !== undefined) updateData.status = data.status;
  if (data.heroImage !== undefined) updateData.heroImage = data.heroImage || null;
  if (data.demoUrl !== undefined) updateData.demoUrl = data.demoUrl || null;
  if (data.docsUrl !== undefined) updateData.docsUrl = data.docsUrl || null;
  if (data.technologies !== undefined) updateData.technologies = data.technologies.trim();
  if (data.published !== undefined) updateData.published = Boolean(data.published);
  if (data.order !== undefined) updateData.order = Number(data.order) || 0;

  if (Array.isArray(data.features)) {
    await prisma.productFeature.deleteMany({ where: { productId: id } });
    const validFeatures = data.features
      .filter((f) => f && f.title?.trim())
      .map((f, idx) => ({
        title: f.title.trim(),
        description: f.description?.trim() || '',
        order: idx,
        productId: id,
      }));
    if (validFeatures.length > 0) {
      await prisma.productFeature.createMany({ data: validFeatures });
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath(`/products/${product.slug}`);
  revalidatePath('/');
  return product;
}

export async function deleteProduct(id: string) {
  await checkAuth();

  await prisma.product.delete({ where: { id } });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  return { success: true };
}
