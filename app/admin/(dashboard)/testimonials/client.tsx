"use client";

import { useState } from 'react';
import { createTestimonial, updateTestimonial, deleteTestimonial } from './actions';

export default function TestimonialsClient({ testimonials = [] }: { testimonials: any[] }) {
  const [items, setItems] = useState<any[]>(testimonials);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    content: '',
    rating: 5,
    photo: '',
    published: true,
    order: 0,
  });

  const handleEdit = (t: any) => {
    setFormData({
      name: t.name || '',
      company: t.company || '',
      role: t.role || '',
      content: t.content || '',
      rating: t.rating || 5,
      photo: t.photo || '',
      published: t.published ?? true,
      order: t.order || 0,
    });
    setCurrentId(t.id);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      company: '',
      role: '',
      content: '',
      rating: 5,
      photo: '',
      published: true,
      order: items.length,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleTogglePublish = async (t: any) => {
    try {
      const updated = await updateTestimonial(t.id, {
        name: t.name,
        company: t.company || '',
        role: t.role || '',
        content: t.content,
        rating: t.rating,
        photo: t.photo || '',
        published: !t.published,
        order: t.order,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, published: !t.published } : item))
      );
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("An error occurred while updating status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (currentId) {
        const updated = await updateTestimonial(currentId, formData);
        setItems((prev) =>
          prev.map((item) => (item.id === currentId ? { ...item, ...formData } : item))
        );
      } else {
        const created = await createTestimonial(formData);
        setItems((prev) => [...prev, created]);
      }
      setIsEditing(false);
      setCurrentId(null);
    } catch (error) {
      console.error("Failed to save testimonial:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await deleteTestimonial(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Failed to delete testimonial:", error);
        alert("An error occurred while deleting.");
      }
    }
  };

  return (
    <div className="text-gray-200">
      {!isEditing ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-400">
                Incoming reviews submitted by clients will appear as <span className="text-amber-400 font-medium">Pending Approval</span> below until approved.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-[#1677FF] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2"
            >
              <span>+</span> Add Testimonial
            </button>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/80 border-b border-[#1f2937] text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-semibold">Client Name</th>
                  <th className="p-4 font-semibold">Company & Role</th>
                  <th className="p-4 font-semibold">Review / Feedback</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]">
                {items.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {t.photo ? (
                          <img src={t.photo} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-gray-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center text-xs font-bold text-blue-300">
                            {t.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-white">{t.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      <div>{t.company || '—'}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300 max-w-xs">
                      <p className="line-clamp-2 italic text-gray-300">&ldquo;{t.content}&rdquo;</p>
                    </td>
                    <td className="p-4 text-sm text-amber-400 font-mono">
                      {'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}
                    </td>
                    <td className="p-4">
                      {t.published ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(t)}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                            t.published
                              ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white'
                              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                        >
                          {t.published ? 'Unpublish' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-xs px-2.5 py-1 rounded border border-blue-500/30 text-[#38BDF8] hover:bg-blue-500/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No testimonials recorded yet. Reviews submitted from the website will appear here for approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-6 max-w-3xl">
          <h2 className="text-xl font-bold mb-6 text-white">{currentId ? 'Edit' : 'Add'} Testimonial</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Client Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF]"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Company / Organization</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF]"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Role / Designation</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF]"
                  placeholder="VP of Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Rating (1-5 Stars)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Testimonial Content *</label>
              <textarea
                required
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] resize-y"
                placeholder="What the client said about Quantum AI..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Photo URL (Optional)</label>
              <input
                type="text"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF]"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Display Sequence (Order)</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>
              <div className="pb-3">
                <label className="inline-flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-900 border-[#1f2937] text-[#1677FF]"
                  />
                  <span className="text-sm font-medium text-white">Approve & Publish to Public Site</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-[#1f2937] mt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#1677FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Testimonial'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-transparent border border-[#1f2937] text-gray-300 hover:bg-gray-800 hover:text-white px-5 py-2.5 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
