"use client";

import { useState } from 'react';
import type { BlogPost } from '@prisma/client';
import { createBlogPost, updateBlogPost, deleteBlogPost } from './actions';

export default function BlogPostClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: '',
    tags: '[]',
    author: '',
    published: false,
  });

  const handleEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || '',
      category: post.category || '',
      tags: post.tags,
      author: post.author,
      published: post.published,
    });
    setView('form');
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      category: '',
      tags: '[]',
      author: '',
      published: false,
    });
    setView('form');
  };

  const handleCancel = () => {
    setView('list');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateBlogPost(editingId, formData);
      } else {
        await createBlogPost(formData);
      }
      setView('list');
    } catch (error) {
      console.error(error);
      alert('Failed to save blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setLoading(true);
    try {
      await deleteBlogPost(id);
    } catch (error) {
      console.error(error);
      alert('Failed to delete blog post');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <div className="bg-[#1f2937] p-6 rounded-md">
        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Post' : 'Create Post'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Excerpt</label>
            <textarea
              required
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              required
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cover Image URL</label>
              <input
                type="text"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Author</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (JSON Array)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder='["tag1", "tag2"]'
                className="w-full bg-[#374151] border border-[#4b5563] rounded px-3 py-2 text-white focus:outline-none focus:border-[#1677FF]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-4 h-4 text-[#1677FF] bg-[#374151] border-[#4b5563] rounded focus:ring-[#1677FF]"
            />
            <label htmlFor="published" className="text-sm font-medium">Published</label>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1677FF] text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Post'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-400">Manage your blog posts here.</p>
        <button
          onClick={handleCreateNew}
          className="bg-[#1677FF] text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          + Create New Post
        </button>
      </div>

      <div className="bg-[#1f2937] rounded-md overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#374151] text-gray-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No blog posts found. Create one to get started.
                </td>
              </tr>
            ) : (
              initialPosts.map((post) => (
                <tr key={post.id} className="border-t border-[#374151] hover:bg-[#374151]/50">
                  <td className="px-4 py-3 font-medium">{post.title}</td>
                  <td className="px-4 py-3 text-gray-400">{post.slug}</td>
                  <td className="px-4 py-3">{post.author}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${post.published ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-[#1677FF] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={loading}
                      className="text-red-400 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
