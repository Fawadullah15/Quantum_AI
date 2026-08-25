'use client';

import React, { useState } from 'react';
import { createClient, updateClient, deleteClient } from './actions';

interface ClientItem {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  featured: boolean;
  published: boolean;
  order: number;
}

export default function ClientsManagerClient({
  clients = [],
}: {
  clients: ClientItem[];
}) {
  const [items, setItems] = useState<ClientItem[]>(clients);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    website: '',
    industry: '',
    description: '',
    featured: true,
    published: true,
    order: 0,
  });

  const handleEdit = (c: ClientItem) => {
    setFormData({
      name: c.name || '',
      logo: c.logo || '',
      website: c.website || '',
      industry: c.industry || '',
      description: c.description || '',
      featured: c.featured ?? true,
      published: c.published ?? true,
      order: c.order || 0,
    });
    setCurrentId(c.id);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      logo: '',
      website: '',
      industry: '',
      description: '',
      featured: true,
      published: true,
      order: items.length,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleTogglePublish = async (c: ClientItem) => {
    try {
      await updateClient(c.id, {
        name: c.name,
        logo: c.logo || '',
        website: c.website || '',
        industry: c.industry || '',
        description: c.description || '',
        featured: c.featured,
        published: !c.published,
        order: c.order,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, published: !c.published } : item))
      );
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('An error occurred while updating status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter an organization / client name.');
      return;
    }

    try {
      setIsSaving(true);
      if (currentId) {
        const updated = await updateClient(currentId, formData);
        setItems((prev) =>
          prev.map((item) => (item.id === currentId ? (updated as ClientItem) : item))
        );
      } else {
        const created = await createClient(formData);
        setItems((prev) => [...prev, created as ClientItem]);
      }
      setIsEditing(false);
      setCurrentId(null);
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this organization?')) {
      try {
        await deleteClient(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('An error occurred while deleting.');
      }
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.industry && item.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="text-gray-200">
      {!isEditing ? (
        <>
          {/* Top action row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#081735] border border-blue-900/40 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleCreate}
              className="bg-[#1677FF] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <span>+</span> Add Organization
            </button>
          </div>

          {/* Table / List */}
          {filteredItems.length === 0 ? (
            <div className="bg-[#06152B] border border-blue-950/60 rounded-xl p-12 text-center">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="text-lg font-semibold text-gray-200 mb-1">No organizations found</h3>
              <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
                Add clients, companies, or partners you have worked with to showcase on the landing page.
              </p>
              <button
                onClick={handleCreate}
                className="bg-[#1677FF] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors inline-flex items-center gap-2"
              >
                <span>+</span> Add First Organization
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#06152B] border border-blue-900/30 rounded-xl p-5 flex flex-col justify-between hover:border-blue-500/40 transition-all group relative"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-lg overflow-hidden shrink-0">
                          {c.logo ? (
                            <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>🏢</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-100 text-base leading-snug group-hover:text-blue-400 transition-colors">
                            {c.name}
                          </h3>
                          <span className="text-xs text-blue-400/80 font-mono">
                            {c.industry || 'General Client'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            c.published
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {c.published ? 'LIVE' : 'DRAFT'}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                        {c.description}
                      </p>
                    )}

                    {/* Website */}
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400/70 hover:text-blue-300 font-mono flex items-center gap-1 mb-3"
                      >
                        <span>{c.website.replace(/^https?:\/\//, '')}</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-3 border-t border-blue-950/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(c)}
                        className="text-gray-400 hover:text-gray-200 font-medium transition-colors"
                      >
                        {c.published ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Form / Modal View */
        <div className="max-w-2xl bg-[#06152B] border border-blue-900/40 rounded-xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-blue-950/80 mb-6">
            <h2 className="text-xl font-bold text-gray-100">
              {currentId ? 'Edit Organization' : 'Add New Organization'}
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Organization / Client Name <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Education, Zenith Retail, CloudBase"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#081735] border border-blue-900/50 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Education, Retail, AI & ML, Healthcare"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full bg-[#081735] border border-blue-900/50 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#081735] border border-blue-900/50 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Website URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-[#081735] border border-blue-900/50 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Logo Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://... or upload in media library"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full bg-[#081735] border border-blue-900/50 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Project / Work Description
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe what Quantum AI built or automated for this organization..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#081735] border border-blue-900/50 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded bg-[#081735] border-blue-900 text-blue-500 focus:ring-0"
                />
                <span>Published (Visible on Site)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded bg-[#081735] border-blue-900 text-blue-500 focus:ring-0"
                />
                <span>Featured Badge</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-blue-950/80">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#1677FF] hover:bg-blue-600 disabled:opacity-50 text-white px-5 py-2 rounded-md font-medium text-sm transition-colors shadow-lg shadow-blue-500/20"
              >
                {isSaving ? 'Saving...' : currentId ? 'Update Organization' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
