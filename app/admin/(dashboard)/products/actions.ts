"use server";

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function createProduct(data: any) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const technologies = typeof data.technologies === 'string' ? data.technologies : (Array.isArray(data.technologies) ? data.technologies.join(', ') : '');

  const validFeatures = Array.isArray(data.features) 
    ? data.features.filter((f: any) => f && f.title?.trim()).map((f: any, idx: number) => ({
        title: f.title.trim(),
        description: f.description || '',
        order: idx,
      }))
    : [];

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description || '',
      category: data.category || 'AI Software',
      status: data.status || 'LIVE',
      heroImage: data.heroImage || null,
      demoUrl: data.demoUrl || null,
      docsUrl: data.docsUrl || null,
      technologies,
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order, 10) || 0,
      ...(validFeatures.length > 0 ? { features: { create: validFeatures } } : {}),
    }
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath(`/products/${slug}`);
  revalidatePath('/');
  return product;
}

export async function updateProduct(id: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const technologies = typeof data.technologies === 'string' ? data.technologies : (Array.isArray(data.technologies) ? data.technologies.join(', ') : '');

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description || '',
      category: data.category || 'AI Software',
      status: data.status || 'LIVE',
      heroImage: data.heroImage || null,
      demoUrl: data.demoUrl || null,
      docsUrl: data.docsUrl || null,
      technologies,
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order, 10) || 0,
    }
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath(`/products/${slug}`);
  revalidatePath('/');
  return product;
}

export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
}
