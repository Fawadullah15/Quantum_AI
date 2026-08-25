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

export async function createBlogPost(data: {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  tags?: string;
  author?: string;
  published?: boolean;
  metaTitle?: string | null;
  metaDesc?: string | null;
}) {
  await checkAuth();

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : data.title.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

  const tagsArray = typeof data.tags === 'string'
    ? data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const post = await prisma.blogPost.create({
    data: {
      title: data.title.trim(),
      slug: slug || `article-${Date.now().toString(36)}`,
      excerpt: data.excerpt.trim(),
      content: data.content.trim(),
      coverImage: data.coverImage || null,
      category: data.category?.trim() || 'Artificial Intelligence',
      tags: JSON.stringify(tagsArray),
      author: data.author?.trim() || 'Quantum AI Research',
      published: data.published ?? true,
      publishedAt: data.published ? new Date() : null,
      metaTitle: data.metaTitle?.trim() || null,
      metaDesc: data.metaDesc?.trim() || null,
    },
  });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath('/insights');
  revalidatePath('/');
  return post;
}

export async function updateBlogPost(
  id: string,
  data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    coverImage?: string | null;
    category?: string | null;
    tags?: string;
    author?: string;
    published?: boolean;
    metaTitle?: string | null;
    metaDesc?: string | null;
  }
) {
  await checkAuth();

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new Error('Blog post not found');

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : undefined;

  let publishedAt = existing.publishedAt;
  if (data.published !== undefined) {
    if (data.published && !existing.published) {
      publishedAt = new Date();
    } else if (!data.published) {
      publishedAt = null;
    }
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (slug !== undefined) updateData.slug = slug;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt.trim();
  if (data.content !== undefined) updateData.content = data.content.trim();
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
  if (data.category !== undefined) updateData.category = data.category?.trim() || 'Artificial Intelligence';
  if (data.tags !== undefined) {
    const tagsArray = typeof data.tags === 'string'
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    updateData.tags = JSON.stringify(tagsArray);
  }
  if (data.author !== undefined) updateData.author = data.author?.trim() || 'Quantum AI Research';
  if (data.published !== undefined) updateData.published = Boolean(data.published);
  updateData.publishedAt = publishedAt;
  if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle?.trim() || null;
  if (data.metaDesc !== undefined) updateData.metaDesc = data.metaDesc?.trim() || null;

  const post = await prisma.blogPost.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath('/insights');
  revalidatePath('/');
  return post;
}

export async function deleteBlogPost(id: string) {
  await checkAuth();

  await prisma.blogPost.delete({ where: { id } });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath('/insights');
  revalidatePath('/');
  return { success: true };
}
