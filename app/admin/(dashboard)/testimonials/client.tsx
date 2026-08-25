'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import { createTestimonial, updateTestimonial, deleteTestimonial } from './actions';
import type { Testimonial } from '@prisma/client';

export default function TestimonialsClient({ testimonials: initialTestimonials = [] }: { testimonials: Testimonial[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [items, setItems] = useState<Testimonial[]>(initialTestimonials);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3'>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreate = () => {
    setFormData({
      name: '',
      company: '',
      role: '',
      content: '',
      rating: 5,
      photo: '',
      published: true,
      order: items.length + 1,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleEdit = (t: Testimonial) => {
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

      if (!res.ok) throw new Error('Upload failed');

      const result = await res.json();
      if (result.url) {
        setFormData((prev) => ({ ...prev, photo: result.url }));
        toast.success('Client photo uploaded successfully!', 'Asset Ready');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload photo.', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async (testimonial: Testimonial) => {
    const newStatus = !testimonial.published;
    try {
      await updateTestimonial(testimonial.id, {
        published: newStatus,
      });
      setItems((prev) =>
        prev.map((t) => (t.id === testimonial.id ? { ...t, published: newStatus } : t))
      );
      toast.success(
        `"${testimonial.name}" is now ${newStatus ? 'Approved & Live in Slider' : 'Pending Review / Hidden'}`,
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
        updateTestimonial(itemA.id, { order: itemA.order }),
        updateTestimonial(itemB.id, { order: itemB.order }),
      ]);
      toast.info('Testimonial sequence updated.', 'Reordered');
      router.refresh();
    } catch (err) {
      toast.error('Failed to save order.', 'Error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Testimonial',
      message: `Are you sure you want to permanently delete the testimonial from "${name}"?`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteTestimonial(id);
        setItems((prev) => prev.filter((t) => t.id !== id));
        toast.success(`Testimonial from "${name}" was deleted.`, 'Deleted');
        router.refresh();
      } catch (err) {
        toast.error('Failed to delete testimonial.', 'Error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Please enter client name', 'Validation');
      return;
    }
    if (!formData.content.trim()) {
      toast.warning('Please enter testimonial quote', 'Validation');
      return;
    }

    try {
      setIsSubmitting(true);
      if (currentId) {
        const updated = await updateTestimonial(currentId, formData);
        setItems((prev) =>
          prev.map((t) => (t.id === currentId ? (updated as Testimonial) : t))
        );
        toast.success(`Testimonial from "${formData.name}" updated!`, 'Saved');
      } else {
        const created = await createTestimonial(formData);
        setItems((prev) => [created as Testimonial, ...prev]);
        toast.success(`Testimonial from "${formData.name}" created!`, 'Created');
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save testimonial', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.company && t.company.toLowerCase().includes(q)) ||
      (t.role && t.role.toLowerCase().includes(q)) ||
      t.content.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && t.published) ||
      (statusFilter === 'PENDING' && !t.published);

    const matchesRating =
      ratingFilter === 'ALL' || t.rating === Number(ratingFilter);

    return matchesSearch && matchesStatus && matchesRating;
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
            <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '260px', maxWidth: '640px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search client name, company, quote..."
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

              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value as any)}
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
                <option value="ALL">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
              </select>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['ALL', 'PUBLISHED', 'PENDING'] as const).map((st) => (
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
                    {st === 'PUBLISHED' ? 'LIVE IN SLIDER' : st === 'PENDING' ? 'PENDING REVIEW' : 'ALL'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <Link
                href="/#testimonials"
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
                <span>View Slider on Site</span>
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
                <span>+</span> ADD TESTIMONIAL
              </button>
            </div>
          </div>

          {/* Testimonial List Table */}
          {filteredItems.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No testimonials found"
              description={
                searchQuery || statusFilter !== 'ALL' || ratingFilter !== 'ALL'
                  ? 'No reviews match your active search and filter criteria.'
                  : 'Add client testimonials or approve user submissions to feature them in the continuous horizontal slider on the homepage.'
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
                  + Add First Testimonial
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
                        Client &amp; Company
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Testimonial Quote
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Rating
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Status / Approval
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                        {/* Order Controls */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', width: '70px' }}>
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

                        {/* Client & Avatar */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                                border: '1px solid rgba(22, 119, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#38BDF8',
                                flexShrink: 0,
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              {item.photo ? (
                                <Image
                                  src={item.photo}
                                  alt={item.name}
                                  fill
                                  sizes="38px"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                item.name.charAt(0).toUpperCase()
                              )}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.92rem' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                                {item.role ? `${item.role}, ` : ''}{item.company || 'Client'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Quote */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', maxWidth: '380px' }}>
                          <div style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.45, fontStyle: 'italic' }}>
                            "{item.content}"
                          </div>
                        </td>

                        {/* Rating */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ color: '#FBBF24', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                            {'★'.repeat(item.rating || 5)}
                          </div>
                        </td>

                        {/* Published / Approval Status */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(item)}
                            style={{
                              backgroundColor: item.published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              border: item.published ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(234, 179, 8, 0.35)',
                              color: item.published ? '#34D399' : '#FBBF24',
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
                                backgroundColor: item.published ? '#34D399' : '#FBBF24',
                              }}
                            />
                            {item.published ? 'LIVE IN SLIDER' : 'PENDING APPROVAL'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
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
                              onClick={() => handleDelete(item.id, item.name)}
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
            maxWidth: '720px',
            margin: '0 auto',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
              {currentId ? `Edit Testimonial: ${formData.name}` : 'Add Client Testimonial'}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Section 1: Client Overview */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                1. Client &amp; Organization Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Usman Farooq"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Role / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. VP of Systems Engineering"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Emerge Technologies"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Star Rating</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    style={inputStyle}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Avatar & Media */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                2. Client Photo (Optional)
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {formData.photo ? (
                    <Image
                      src={formData.photo}
                      alt="Avatar preview"
                      fill
                      sizes="54px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.2rem', color: '#64748B' }}>👤</span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {isUploading ? 'Uploading...' : '📁 Upload Photo'}
                    </button>
                    {formData.photo && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo: '' })}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          padding: '0.4rem 0.65rem',
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
                    placeholder="Or paste direct image URL (e.g. /images/clients/avatar.jpg)"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    style={{ ...inputStyle, fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Testimonial Quote */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                3. Testimonial Quote *
              </div>

              <textarea
                rows={4}
                required
                placeholder="Share the client's direct feedback on technical architecture, speed, reliability, and business impact..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* Publish Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="testPublished"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <label htmlFor="testPublished" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
                Approve &amp; display immediately in the continuous horizontal marquee on the homepage (<span style={{ color: '#38BDF8' }}>/#testimonials</span>)
              </label>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.45rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                {isSubmitting ? 'Saving...' : currentId ? 'Save Changes' : 'Create Testimonial'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
