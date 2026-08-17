import prisma from '@/lib/db';
import BlogPostClient from './client';

export const metadata = {
  title: 'Blog Management | Admin',
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 text-white min-h-screen bg-[#111827]">
      <h1 className="text-2xl font-bold mb-6">Blog Posts Management</h1>
      <BlogPostClient initialPosts={posts} />
    </div>
  );
}
