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
  logo?: string;
  website?: string;
  industry?: string;
  description?: string;
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
    name: string;
    logo?: string;
    website?: string;
    industry?: string;
    description?: string;
    featured?: boolean;
    published?: boolean;
    order?: number;
  }
) {
  await checkAuth();

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name.trim(),
      logo: data.logo || null,
      website: data.website || null,
      industry: data.industry || null,
      description: data.description || null,
      featured: Boolean(data.featured),
      published: Boolean(data.published),
      order: Number(data.order) || 0,
    },
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
