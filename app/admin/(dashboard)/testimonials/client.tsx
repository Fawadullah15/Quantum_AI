'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface TestimonialItem {
  id: string;
  name: string;
  company?: string | null;
  role?: string | null;
  content: string;
  rating?: number;
  photo?: string | null;
  published: boolean;
  order: number;
}

export default function TestimonialsAdminClient({
  testimonials = [],
}: {
  testimonials: TestimonialItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<TestimonialItem[]>(testimonials);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    content: '',
    rating: 5,
    photo: '',
    published: true,
    order: 1,
  });

  const handleEdit = (t: TestimonialItem) => {
    setFormData({
      name: t.name,
      company: t.company || '',
      role: t.role || '',
      content: t.content,
      rating: t.rating || 5,
      photo: t.photo || '',
      published: t.published,
      order: t.order || 1,
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
        setFormData((prev) => ({ ...prev, photo: result.url }));
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async (t: TestimonialItem) => {
    try {
      const nextState = !t.published;
      const res = await fetch(`/api/testimonials/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: nextState }),
      });

      if (!res.ok) throw new Error('Status update failed');

      setItems((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, published: nextState } : item))
      );
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('An error occurred while updating status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Please fill in the client name and testimonial text.');
      return;
    }

    try {
      setIsSaving(true);
      if (currentId) {
        const res = await fetch(`/api/testimonials/${currentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === currentId ? (updated as TestimonialItem) : item))
        );
      } else {
        const res = await fetch('/api/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Create failed');
        const created = await res.json();
        setItems((prev) => [...prev, created as TestimonialItem]);
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (error) {
      console.error('Failed to save testimonial:', error);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the testimonial from "${name}"?`)) {
      try {
        const res = await fetch(`/api/testimonials/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed');
        setItems((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      } catch (error) {
        console.error('Failed to delete testimonial:', error);
        alert('An error occurred while deleting.');
      }
    }
  };

  const pendingCount = items.filter((item) => !item.published).length;
  const activeCount = items.filter((item) => item.published).length;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.role && item.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? !item.published
        : item.published;

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
          {/* Pending Reviews Notice Banner */}
          {pendingCount > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '8px',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.15rem' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#FBBF24', fontSize: '0.88rem' }}>
                    {pendingCount} New Client Review{pendingCount > 1 ? 's' : ''} Awaiting Approval
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                    Submitted via public &quot;+ Share Your Experience&quot; form. Click &quot;Approve &amp; Publish&quot; to show on the live slider.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#FBBF24',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono, monospace)',
                  cursor: 'pointer',
                }}
              >
                View Pending ({pendingCount})
              </button>
            </div>
          )}

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
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Search by client, company, or quote..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#070B14',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.95rem',
                  fontSize: '0.875rem',
                  color: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Filter Tabs & Add Button */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  style={{
                    backgroundColor: statusFilter === 'ALL' ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                    border: statusFilter === 'ALL' ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                    color: statusFilter === 'ALL' ? '#FFFFFF' : '#94A3B8',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  All ({items.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  style={{
                    backgroundColor: statusFilter === 'PENDING' ? '#F59E0B' : 'rgba(6, 21, 43, 0.65)',
                    border: statusFilter === 'PENDING' ? '1px solid #F59E0B' : '1px solid rgba(245, 158, 11, 0.25)',
                    color: statusFilter === 'PENDING' ? '#000000' : '#FBBF24',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Pending ({pendingCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  style={{
                    backgroundColor: statusFilter === 'ACTIVE' ? '#10B981' : 'rgba(6, 21, 43, 0.65)',
                    border: statusFilter === 'ACTIVE' ? '1px solid #10B981' : '1px solid rgba(16, 185, 129, 0.25)',
                    color: statusFilter === 'ACTIVE' ? '#000000' : '#34D399',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Active ({activeCount})
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                style={{
                  backgroundColor: '#1677FF',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
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

          {/* Testimonial Cards Grid */}
          {filteredItems.length === 0 ? (
            <div
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.65)',
                border: '1px solid rgba(22, 119, 255, 0.18)',
                borderRadius: '12px',
                padding: '3.5rem 2rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⭐</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.5rem 0' }}>
                No testimonials found
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Add client reviews to showcase in the continuous horizontal marquee on the landing page.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  backgroundColor: '#1677FF',
                  color: '#FFFFFF',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + Add First Testimonial
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
                width: '100%',
              }}
            >
              {filteredItems.map((t) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.75)',
                    border: !t.published ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(22, 119, 255, 0.18)',
                    borderRadius: '12px',
                    padding: '1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    boxShadow: !t.published ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'none',
                  }}
                >
                  <div>
                    {/* Top Row: Author & Rating */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(22, 119, 255, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {t.photo ? (
                            <img src={t.photo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                              {t.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#F8FAFC', margin: 0, lineHeight: 1.25 }}>
                            {t.name}
                          </h3>
                          {(t.role || t.company) && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontSize: '0.65rem',
                                color: '#38BDF8',
                                display: 'block',
                                marginTop: '0.15rem',
                              }}
                            >
                              {[t.role, t.company].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.62rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          backgroundColor: t.published ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                          color: t.published ? '#34D399' : '#FBBF24',
                          border: t.published ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.published ? 'LIVE / ACTIVE' : 'PENDING REVIEW'}
                      </span>
                    </div>

                    {/* Star Rating */}
                    {t.rating && (
                      <div style={{ color: '#F59E0B', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                        {'★'.repeat(t.rating)}
                      </div>
                    )}

                    {/* Testimonial Quote */}
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: '#CBD5E1',
                        lineHeight: 1.55,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontWeight: 300,
                        fontStyle: 'italic',
                      }}
                    >
                      &quot;{t.content}&quot;
                    </p>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div
                    style={{
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(22, 119, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(t)}
                      style={{
                        backgroundColor: !t.published ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        border: !t.published ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.25)',
                        color: !t.published ? '#34D399' : '#94A3B8',
                        borderRadius: '4px',
                        padding: '0.3rem 0.65rem',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {!t.published ? '✓ Approve & Publish' : 'Deactivate'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.35)',
                          color: '#38BDF8',
                          borderRadius: '4px',
                          padding: '0.25rem 0.65rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id, t.name)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          borderRadius: '4px',
                          padding: '0.25rem 0.65rem',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
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
        /* Edit / Create Form View */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.85)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: 'clamp(1.5rem, 3vw, 2.5rem)',
            maxWidth: '650px',
            margin: '0 auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              {currentId ? 'Edit Testimonial' : 'Create New Testimonial'}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={labelStyle}>Client / Author Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammad Tariq"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Role / Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Director of Academic Operations"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Eden School System"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Star Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) || 5 })}
                  style={inputStyle}
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                  <option value={2}>★★☆☆☆ (2 Stars)</option>
                  <option value={1}>★☆☆☆☆ (1 Star)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Testimonial Quote / Experience *</label>
              <textarea
                rows={4}
                required
                placeholder="Enter detailed testimonial quote describing the impact of Quantum AI's systems..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Photo Upload Section */}
            <div>
              <label style={labelStyle}>Author Photo / Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#030712',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {formData.photo ? (
                    <img src={formData.photo} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: '#64748B' }}>NO PHOTO</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    style={{ fontSize: '0.8rem', color: '#94A3B8' }}
                  />
                  {isUploading && (
                    <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '0.25rem' }}>
                      Uploading image...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Published Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="testimonialPublished"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="testimonialPublished" style={{ color: '#F8FAFC', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                Publish immediately to live public continuous marquee slider
              </label>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
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
                  padding: '0.6rem 1.5rem',
                  borderRadius: 6,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  opacity: isSaving ? 0.7 : 1,
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {isSaving ? 'Saving...' : currentId ? 'Update Testimonial' : 'Create Testimonial'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
