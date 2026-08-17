"use server";

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createProduct(data: any) {
  await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      category: data.category,
      status: data.status,
      heroImage: data.heroImage,
      demoUrl: data.demoUrl,
      docsUrl: data.docsUrl,
      technologies: data.technologies ? data.technologies.split(',').map((t: string) => t.trim()) : [],
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order) || 0,
    }
  });
  revalidatePath('/admin/products');
}

export async function updateProduct(id: string, data: any) {
  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      category: data.category,
      status: data.status,
      heroImage: data.heroImage,
      demoUrl: data.demoUrl,
      docsUrl: data.docsUrl,
      technologies: data.technologies ? (typeof data.technologies === 'string' ? data.technologies.split(',').map((t: string) => t.trim()) : data.technologies) : [],
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order) || 0,
    }
  });
  revalidatePath('/admin/products');
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/products');
}
