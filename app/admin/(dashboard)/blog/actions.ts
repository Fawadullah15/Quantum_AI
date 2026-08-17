"use server";

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createBlogPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  tags: string;
  author: string;
  published: boolean;
}) {
  const post = await prisma.blogPost.create({
    data: {
      ...data,
      publishedAt: data.published ? new Date() : null,
    },
  });
  revalidatePath('/admin/blog');
  return post;
}

export async function updateBlogPost(id: string, data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  tags: string;
  author: string;
  published: boolean;
}) {
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
      ...data,
      publishedAt,
    },
  });
  revalidatePath('/admin/blog');
  return post;
}

export async function deleteBlogPost(id: string) {
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath('/admin/blog');
}
