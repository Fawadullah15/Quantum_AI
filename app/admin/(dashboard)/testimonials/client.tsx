"use client";

import { useState } from 'react';
import { createTestimonial, updateTestimonial, deleteTestimonial } from './actions';

export default function TestimonialsClient({ testimonials }: { testimonials: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<any>(null);
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
      order: testimonials.length,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentId) {
        await updateTestimonial(currentId, formData);
      } else {
        await createTestimonial(formData);
      }
      setIsEditing(false);
      setCurrentId(null);
    } catch (error) {
      console.error("Failed to save testimonial:", error);
      alert("An error occurred while saving.");
    }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await deleteTestimonial(id);
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
          <button
            onClick={handleCreate}
            className="mb-4 bg-[#1677FF] hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Add Testimonial
          </button>
          
          <div className="bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 border-b border-[#1f2937]">
                  <th className="p-4 font-semibold">Order</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Company / Role</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((t) => (
                  <tr key={t.id} className="border-b border-[#1f2937] hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">{t.order}</td>
                    <td className="p-4 font-medium text-white">{t.name}</td>
                    <td className="p-4 text-gray-400">
                      {t.company} {t.company && t.role && " - "} {t.role}
                    </td>
                    <td className="p-4">{t.rating} / 5</td>
                    <td className="p-4">
                      {t.published ? (
                        <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Published</span>
                      ) : (
                        <span className="text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Draft</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(t)} className="text-[#1677FF] hover:text-blue-400 mr-4 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-400 transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
                {testimonials.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No testimonials found.</td>
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
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] transition-all"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] transition-all"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] transition-all"
                  placeholder="CEO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Content</label>
              <textarea
                required
                rows={5}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] transition-all resize-y"
                placeholder="Write the testimonial content here..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Photo URL</label>
              <input
                type="text"
                value={formData.photo}
                onChange={e => setFormData({...formData, photo: e.target.value})}
                className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] transition-all"
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Order (Display sequence)</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({...formData, order: Number(e.target.value)})}
                  className="w-full bg-gray-900 border border-[#1f2937] rounded-md p-2.5 text-white focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] transition-all"
                />
              </div>
              <div className="pb-3">
                <label className="inline-flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={e => setFormData({...formData, published: e.target.checked})}
                    className="w-5 h-5 rounded bg-gray-900 border-[#1f2937] text-[#1677FF] focus:ring-[#1677FF] focus:ring-offset-gray-900"
                  />
                  <span className="text-sm font-medium text-white">Published</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-[#1f2937] mt-6">
              <button
                type="submit"
                className="bg-[#1677FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium transition-colors"
              >
                Save Testimonial
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
