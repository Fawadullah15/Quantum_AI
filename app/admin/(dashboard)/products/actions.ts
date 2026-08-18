"use server";

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createProduct(data: any) {
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const technologies = typeof data.technologies === 'string' ? data.technologies : (Array.isArray(data.technologies) ? data.technologies.join(', ') : '');

  await prisma.product.create({
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
  revalidatePath('/');
}

export async function updateProduct(id: string, data: any) {
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const technologies = typeof data.technologies === 'string' ? data.technologies : (Array.isArray(data.technologies) ? data.technologies.join(', ') : '');

  await prisma.product.update({
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
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
}
