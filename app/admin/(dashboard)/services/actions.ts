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

export async function createService(data: {
  name: string;
  category?: string;
  description: string;
  icon?: string | null;
  order?: number;
  published?: boolean;
}) {
  await checkAuth();

  const service = await prisma.service.create({
    data: {
      name: data.name.trim(),
      category: data.category?.trim() || 'AI',
      description: data.description.trim(),
      icon: data.icon || 'Brain',
      order: Number(data.order) || 0,
      published: data.published ?? true,
    },
  });

  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/systems');
  revalidatePath('/');
  return service;
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    category?: string;
    description?: string;
    icon?: string | null;
    order?: number;
    published?: boolean;
  }
) {
  await checkAuth();

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.icon !== undefined) updateData.icon = data.icon || null;
  if (data.order !== undefined) updateData.order = Number(data.order) || 0;
  if (data.published !== undefined) updateData.published = Boolean(data.published);

  const service = await prisma.service.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/systems');
  revalidatePath('/');
  return service;
}

export async function deleteService(id: string) {
  await checkAuth();

  await prisma.service.delete({ where: { id } });

  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/systems');
  revalidatePath('/');
  return { success: true };
}
