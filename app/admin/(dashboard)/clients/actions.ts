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

export async function createClient(data: {
  name: string;
  logo?: string | null;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  featured?: boolean;
  published?: boolean;
  order?: number;
}) {
  await checkAuth();

  const slugBase = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const client = await prisma.client.create({
    data: {
      name: data.name.trim(),
      slug,
      logo: data.logo || null,
      website: data.website || null,
      industry: data.industry || 'Enterprise',
      description: data.description || null,
      featured: data.featured ?? true,
      published: data.published ?? true,
      order: Number(data.order) || 0,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin/clients');
  return client;
}

export async function updateClient(
  id: string,
  data: {
    name?: string;
    logo?: string | null;
    website?: string | null;
    industry?: string | null;
    description?: string | null;
    featured?: boolean;
    published?: boolean;
    order?: number;
  }
) {
  await checkAuth();

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.logo !== undefined) updateData.logo = data.logo || null;
  if (data.website !== undefined) updateData.website = data.website || null;
  if (data.industry !== undefined) updateData.industry = data.industry || null;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.featured !== undefined) updateData.featured = Boolean(data.featured);
  if (data.published !== undefined) updateData.published = Boolean(data.published);
  if (data.order !== undefined) updateData.order = Number(data.order) || 0;

  const client = await prisma.client.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/');
  revalidatePath('/admin/clients');
  return client;
}

export async function deleteClient(id: string) {
  await checkAuth();

  await prisma.client.delete({
    where: { id },
  });

  revalidatePath('/');
  revalidatePath('/admin/clients');
  return { success: true };
}
