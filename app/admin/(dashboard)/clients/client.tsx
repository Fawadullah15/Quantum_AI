'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import { createClient, updateClient, deleteClient } from './actions';

export interface ClientItem {
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
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [items, setItems] = useState<ClientItem[]>(clients);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      order: items.length + 1,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const result = await res.json();
      if (result.url) {
        setFormData((prev) => ({ ...prev, logo: result.url }));
        toast.success('Logo uploaded successfully!', 'Asset Ready');
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('Failed to upload logo image. Please try again.', 'Upload Failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async (c: ClientItem) => {
    const newStatus = !c.published;
    try {
      await updateClient(c.id, {
        name: c.name,
        logo: c.logo || '',
        website: c.website || '',
        industry: c.industry || '',
        description: c.description || '',
        featured: c.featured,
        published: newStatus,
        order: c.order,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, published: newStatus } : item))
      );
      toast.success(
        `"${c.name}" is now ${newStatus ? 'Published (Live on Slider)' : 'Draft (Hidden)'}`,
        'Visibility Updated'
      );
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('An error occurred while updating status.', 'Error');
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
        updateClient(itemA.id, { ...itemA, order: itemA.order }),
        updateClient(itemB.id, { ...itemB, order: itemB.order }),
      ]);
      toast.info('Logo order updated.', 'Reordered');
      router.refresh();
    } catch (err) {
      toast.error('Failed to save new order.', 'Error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Please enter an organization / client name.', 'Validation');
      return;
    }

    try {
      setIsSaving(true);
      if (currentId) {
        const updated = await updateClient(currentId, formData);
        setItems((prev) =>
          prev.map((item) => (item.id === currentId ? (updated as ClientItem) : item))
        );
        toast.success(`Client "${formData.name}" updated successfully!`, 'Saved');
      } else {
        const created = await createClient(formData);
        setItems((prev) => [...prev, created as ClientItem]);
        toast.success(`Client "${formData.name}" added to logo slider!`, 'Created');
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (error) {
      console.error('Failed to save client:', error);
      toast.error('An error occurred while saving.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Organization',
      message: `Are you sure you want to permanently delete "${name}" from the logo showcase?`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteClient(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success(`"${name}" was deleted.`, 'Deleted');
        router.refresh();
      } catch (error) {
        console.error('Failed to delete client:', error);
        toast.error('An error occurred while deleting.', 'Error');
      }
    }
  };

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.industry && item.industry.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && item.published) ||
      (statusFilter === 'DRAFT' && !item.published);

    return matchesSearch && matchesStatus;
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
          {/* Top Control Bar */}
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
            <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '260px', maxWidth: '520px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search organization or industry..."
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
              <span>+</span> ADD ORGANISATION
            </button>
          </div>

          {/* Client List */}
          {filteredItems.length === 0 ? (
            <EmptyState
              icon="🏢"
              title="No client organizations found"
              description={
                searchQuery
                  ? 'No clients match your active search filter.'
                  : 'Add organization logos to display them in the continuous animated marquee on the landing page.'
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
                  + Add First Organization
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
                        Organization &amp; Logo
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Industry / Category
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Website URL
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
                    {filteredItems.map((c, index) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                        {/* Order Reordering */}
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
                              disabled={index === filteredItems.length - 1}
                              onClick={() => handleMoveOrder(index, 'DOWN')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: index === filteredItems.length - 1 ? '#334155' : '#38BDF8',
                                cursor: index === filteredItems.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                padding: 0,
                              }}
                            >
                              ▼
                            </button>
                          </div>
                        </td>

                        {/* Name & Logo */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div
                              style={{
                                width: '46px',
                                height: '36px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                flexShrink: 0,
                                position: 'relative',
                              }}
                            >
                              {c.logo ? (
                                <Image
                                  src={c.logo}
                                  alt={c.name}
                                  fill
                                  sizes="46px"
                                  style={{ objectFit: 'contain', padding: '3px' }}
                                />
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>🏢</span>
                              )}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.92rem' }}>
                                {c.name}
                              </div>
                              {c.description && (
                                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.15rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Industry */}
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
                            {c.industry || 'Enterprise'}
                          </span>
                        </td>

                        {/* Website URL */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          {c.website ? (
                            <a
                              href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <span>{c.website.replace(/^https?:\/\//, '')}</span>
                              <span style={{ fontSize: '0.75rem' }}>↗</span>
                            </a>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>

                        {/* Published Status Toggle */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(c)}
                            style={{
                              backgroundColor: c.published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                              border: c.published ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                              color: c.published ? '#34D399' : '#94A3B8',
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
                                backgroundColor: c.published ? '#34D399' : '#94A3B8',
                              }}
                            />
                            {c.published ? 'LIVE IN SLIDER' : 'DRAFT (HIDDEN)'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(c)}
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
                              onClick={() => handleDelete(c.id, c.name)}
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
        /* Create & Edit Client Modal / Form */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.85)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '680px',
            margin: '0 auto',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
              {currentId ? 'Edit Organization' : 'Add New Organization Logo'}
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
              <label style={labelStyle}>Organization / Client Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. OpenAI, DeepMind, Tesla"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Logo Image Upload & Preview */}
            <div>
              <label style={labelStyle}>Organization Logo Image</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '60px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  {formData.logo ? (
                    <Image
                      src={formData.logo}
                      alt="Logo preview"
                      fill
                      sizes="80px"
                      style={{ objectFit: 'contain', padding: '6px' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.25rem', color: '#64748B' }}>🖼️</span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundColor: 'rgba(22, 119, 255, 0.15)',
                        border: '1px solid rgba(22, 119, 255, 0.35)',
                        color: '#38BDF8',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {isUploading ? 'Uploading...' : '📁 Upload Logo File'}
                    </button>
                    {formData.logo && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste direct image URL (e.g. /logos/company.svg)"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    style={{ ...inputStyle, fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Industry / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence, Finance"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Website URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://company.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Brief Description / Collaboration Note</label>
              <textarea
                rows={2}
                placeholder="e.g. Enterprise AI model deployment partner"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="clientPublished"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <label htmlFor="clientPublished" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
                Publish immediately to continuous logo slider on public website
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
                {isSaving ? 'Saving...' : currentId ? 'Save Changes' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
