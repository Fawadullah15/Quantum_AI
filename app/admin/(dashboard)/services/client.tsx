'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import { createService, updateService, deleteService } from './actions';

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string | null;
  order: number;
  published: boolean;
}

const ICON_PRESETS = [
  { name: 'Brain', icon: '🧠', label: 'AI / Neural' },
  { name: 'LayoutDashboard', icon: '📊', label: 'Software / Dashboard' },
  { name: 'Bot', icon: '🤖', label: 'Automation / Agent' },
  { name: 'Layers', icon: '📦', label: 'Digital Products' },
  { name: 'Cpu', icon: '⚡', label: 'Infrastructure / Core' },
  { name: 'Network', icon: '🌐', label: 'APIs & Integration' },
  { name: 'Sparkles', icon: '✨', label: 'Consulting / Strategy' },
];

export default function ServicesClient({ initialData = [] }: { initialData: ServiceItem[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [items, setItems] = useState<ServiceItem[]>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    category: 'AI',
    description: '',
    icon: 'Brain',
    order: 0,
    published: true,
  });

  const handleCreate = () => {
    setFormData({
      name: '',
      category: 'AI',
      description: '',
      icon: 'Brain',
      order: items.length + 1,
      published: true,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleEdit = (service: ServiceItem) => {
    setFormData({
      name: service.name || '',
      category: service.category || 'AI',
      description: service.description || '',
      icon: service.icon || 'Brain',
      order: service.order || 0,
      published: service.published ?? true,
    });
    setCurrentId(service.id);
    setIsEditing(true);
  };

  const handleTogglePublish = async (service: ServiceItem) => {
    const newStatus = !service.published;
    try {
      await updateService(service.id, {
        published: newStatus,
      });
      setItems((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, published: newStatus } : s))
      );
      toast.success(
        `"${service.name}" is now ${newStatus ? 'Live on /services' : 'Hidden in Drafts'}`,
        'Visibility Updated'
      );
      router.refresh();
    } catch (err) {
      toast.error('Failed to update status.', 'Error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const itemA = newItems[index];
    const itemB = newItems[targetIndex];

    const tempOrder = itemA.order;
    itemA.order = itemB.order;
    itemB.order = tempOrder;

    newItems[index] = itemB;
    newItems[targetIndex] = itemA;

    setItems(newItems);

    try {
      await Promise.all([
        updateService(itemA.id, { order: itemA.order }),
        updateService(itemB.id, { order: itemB.order }),
      ]);
      toast.info('Service order updated.', 'Reordered');
      router.refresh();
    } catch (err) {
      toast.error('Failed to save order.', 'Error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Service',
      message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteService(id);
        setItems((prev) => prev.filter((s) => s.id !== id));
        toast.success(`"${name}" was deleted.`, 'Deleted');
        router.refresh();
      } catch (err) {
        toast.error('Failed to delete service.', 'Error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Please enter a service name', 'Validation');
      return;
    }

    try {
      setIsSaving(true);
      if (currentId) {
        const updated = await updateService(currentId, formData);
        setItems((prev) =>
          prev.map((s) => (s.id === currentId ? (updated as ServiceItem) : s))
        );
        toast.success(`Service "${formData.name}" updated!`, 'Saved');
      } else {
        const created = await createService(formData);
        setItems((prev) => [...prev, created as ServiceItem]);
        toast.success(`Service "${formData.name}" created!`, 'Created');
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save service', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(items.map((s) => s.category).filter(Boolean)));

  const filteredServices = items.filter((service) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      service.name.toLowerCase().includes(q) ||
      service.category.toLowerCase().includes(q) ||
      service.description.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && service.published) ||
      (statusFilter === 'DRAFT' && !service.published);

    const matchesCategory = categoryFilter === 'ALL' || service.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(22, 119, 255, 0.22)',
    borderRadius: 6,
    color: '#F8FAFC',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-mono, monospace)',
  };

  return (
    <div style={{ color: '#F8FAFC', width: '100%' }}>
      {!isEditing ? (
        <>
          {/* Top Controls Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '260px', maxWidth: '600px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search service name, category, capabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070B14',
                    border: '1px solid rgba(22, 119, 255, 0.25)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.95rem',
                    fontSize: '0.85rem',
                    color: '#F8FAFC',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    backgroundColor: '#070B14',
                    border: '1px solid rgba(22, 119, 255, 0.25)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.82rem',
                    color: '#CBD5E1',
                    outline: 'none',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      backgroundColor: statusFilter === st ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                      border: statusFilter === st ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                      color: statusFilter === st ? '#FFFFFF' : '#94A3B8',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <Link
                href="/services"
                target="_blank"
                style={{
                  backgroundColor: 'rgba(22, 119, 255, 0.12)',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  color: '#38BDF8',
                  padding: '0.55rem 1rem',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                <span>View Public Page</span>
                <span>↗</span>
              </Link>

              <button
                type="button"
                onClick={handleCreate}
                style={{
                  backgroundColor: '#1677FF',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                <span>+</span> ADD SERVICE
              </button>
            </div>
          </div>

          {/* Service List Table */}
          {filteredServices.length === 0 ? (
            <EmptyState
              icon="⚡"
              title="No services found"
              description={
                searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'No services match your active search and filter criteria.'
                  : 'Add service capabilities to display them on the public /services page and systems section.'
              }
              action={
                <button
                  type="button"
                  onClick={handleCreate}
                  style={{
                    backgroundColor: '#1677FF',
                    color: '#FFFFFF',
                    padding: '0.5rem 1.15rem',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  + Add First Service
                </button>
              }
            />
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.75)',
                border: '1px solid rgba(22, 119, 255, 0.18)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.8)', borderBottom: '1px solid rgba(22, 119, 255, 0.18)' }}>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', width: '70px' }}>
                        Order
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Service &amp; Capability
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Category
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Live Status
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service, index) => (
                      <tr key={service.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                        {/* Order Controls */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <button
                              type="button"
                              title="Move up"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, 'UP')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: index === 0 ? '#334155' : '#38BDF8',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                padding: 0,
                              }}
                            >
                              ▲
                            </button>
                            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#94A3B8', minWidth: '16px', textAlign: 'center' }}>
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              title="Move down"
                              disabled={index === filteredServices.length - 1}
                              onClick={() => handleMoveOrder(index, 'DOWN')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: index === filteredServices.length - 1 ? '#334155' : '#38BDF8',
                                cursor: index === filteredServices.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                padding: 0,
                              }}
                            >
                              ▼
                            </button>
                          </div>
                        </td>

                        {/* Name & Description */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.95rem' }}>
                            {service.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', lineHeight: 1.45, maxWidth: '540px' }}>
                            {service.description}
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              backgroundColor: 'rgba(22, 119, 255, 0.12)',
                              border: '1px solid rgba(22, 119, 255, 0.25)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: '#CBD5E1',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                          >
                            {service.category}
                          </span>
                        </td>

                        {/* Published Status Toggle */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(service)}
                            style={{
                              backgroundColor: service.published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                              border: service.published ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                              color: service.published ? '#34D399' : '#94A3B8',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-mono, monospace)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: service.published ? '#34D399' : '#94A3B8',
                              }}
                            />
                            {service.published ? 'LIVE / PUBLISHED' : 'DRAFT (HIDDEN)'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(service)}
                              style={{
                                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                                border: '1px solid rgba(22, 119, 255, 0.35)',
                                color: '#38BDF8',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(service.id, service.name)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#F87171',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Create & Edit Modal Form */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.85)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '640px',
            margin: '0 auto',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
              {currentId ? `Edit Service: ${formData.name}` : 'Create New Service Offering'}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={labelStyle}>Service Offering Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI Systems & Agentic Workflows"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Category / System Domain *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                >
                  <option value="AI">AI & Machine Learning</option>
                  <option value="SOFTWARE">Custom Business Software</option>
                  <option value="AUTOMATION">Workflow Automation</option>
                  <option value="INTEGRATION">Software & API Integration</option>
                  <option value="PRODUCT">Digital Products & SaaS</option>
                  <option value="CONSULTING">Architecture Consulting</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Icon Preset</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  style={inputStyle}
                >
                  {ICON_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Capability Description *</label>
              <textarea
                rows={4}
                required
                placeholder="Detail the technical capability, enterprise solutions, and operational outcomes provided..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="servicePublished"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <label htmlFor="servicePublished" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
                Publish immediately to public Services directory (<span style={{ color: '#38BDF8' }}>/services</span>)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.45rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                {isSaving ? 'Saving...' : currentId ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
