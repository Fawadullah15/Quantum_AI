"use server";

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function createBlogPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  tags?: string;
  author: string;
  published: boolean;
  metaTitle?: string | null;
  metaDesc?: string | null;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage || null,
      category: data.category || 'General',
      tags: data.tags || '[]',
      author: data.author,
      published: data.published,
      metaTitle: data.metaTitle || null,
      metaDesc: data.metaDesc || null,
      publishedAt: data.published ? new Date() : null,
    },
  });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/insights');
  revalidatePath('/');
  return post;
}

export async function updateBlogPost(id: string, data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  tags?: string;
  author: string;
  published: boolean;
  metaTitle?: string | null;
  metaDesc?: string | null;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  
  let publishedAt = existing?.publishedAt;
  if (data.published && !existing?.published) {
    publishedAt = new Date();
  } else if (!data.published) {
    publishedAt = null;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage || null,
      category: data.category || 'General',
      tags: data.tags || '[]',
      author: data.author,
      published: data.published,
      metaTitle: data.metaTitle || null,
      metaDesc: data.metaDesc || null,
      publishedAt,
    },
  });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/insights');
  revalidatePath('/');
  return post;
}

export async function deleteBlogPost(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await prisma.blogPost.delete({ where: { id } });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath('/insights');
  revalidatePath('/');
}
