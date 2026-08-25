'use client';

import React, { useState, useRef } from 'react';
import { createTestimonial, updateTestimonial, deleteTestimonial } from './actions';

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

export default function TestimonialsClient({
  testimonials = [],
}: {
  testimonials: TestimonialItem[];
}) {
  const [items, setItems] = useState<TestimonialItem[]>(testimonials);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleEdit = (t: TestimonialItem) => {
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
      await updateTestimonial(t.id, {
        name: t.name,
        company: t.company || '',
        role: t.role || '',
        content: t.content,
        rating: t.rating || 5,
        photo: t.photo || '',
        published: !t.published,
        order: t.order,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, published: !t.published } : item))
      );
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
        const updated = await updateTestimonial(currentId, formData);
        setItems((prev) =>
          prev.map((item) => (item.id === currentId ? (updated as TestimonialItem) : item))
        );
      } else {
        const created = await createTestimonial(formData);
        setItems((prev) => [...prev, created as TestimonialItem]);
      }
      setIsEditing(false);
      setCurrentId(null);
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
        await deleteTestimonial(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Failed to delete testimonial:', error);
        alert('An error occurred while deleting.');
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.role && item.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '400px' }}>
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

            <button
              onClick={handleCreate}
              style={{
                backgroundColor: '#1677FF',
                color: '#FFFFFF',
                padding: '0.65rem 1.35rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.85rem',
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
                    border: '1px solid rgba(22, 119, 255, 0.18)',
                    borderRadius: '12px',
                    padding: '1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
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
                          backgroundColor: t.published ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: t.published ? '#34D399' : '#FBBF24',
                          border: t.published ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.published ? 'ACTIVE' : 'INACTIVE'}
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
                      onClick={() => handleTogglePublish(t)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        color: t.published ? '#94A3B8' : '#34D399',
                        borderRadius: '4px',
                        padding: '0.25rem 0.55rem',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {t.published ? 'Deactivate' : 'Activate'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
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
                        onClick={() => handleDelete(t.id, t.name)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          borderRadius: '4px',
                          padding: '0.25rem 0.65rem',
                          cursor: 'pointer',
                          fontWeight: 600,
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
        /* Create or Edit Form / Modal */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.9)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '14px',
            padding: '2rem',
            maxWidth: '680px',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
              paddingBottom: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#1677FF', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                CLIENT REPUTATION MANAGEMENT
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                {currentId ? `Edit: ${formData.name}` : 'Add New Client Testimonial'}
              </h2>
            </div>

            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentId(null);
              }}
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
              <label style={labelStyle}>Client Name *</label>
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
                <label style={labelStyle}>Position / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Director of Operations"
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

            <div>
              <label style={labelStyle}>Testimonial Quote *</label>
              <textarea
                rows={4}
                required
                placeholder="Enter client experience or feedback..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Profile Photo Upload */}
            <div>
              <label style={labelStyle}>Profile Photo (Optional)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
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
                    <img src={formData.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: '#64748B' }}>NO PHOTO</span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      style={{
                        backgroundColor: 'rgba(22, 119, 255, 0.2)',
                        border: '1px solid rgba(22, 119, 255, 0.4)',
                        color: '#38BDF8',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {isUploading ? 'Uploading...' : '📁 Upload Photo File'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter image URL: /uploads/client.png"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    style={{ ...inputStyle, fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Rating (1 to 5 Stars)</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) || 5 })}
                  style={inputStyle}
                >
                  <option value={5} style={{ backgroundColor: '#030712' }}>★★★★★ (5 Stars)</option>
                  <option value={4} style={{ backgroundColor: '#030712' }}>★★★★☆ (4 Stars)</option>
                  <option value={3} style={{ backgroundColor: '#030712' }}>★★★☆☆ (3 Stars)</option>
                  <option value={2} style={{ backgroundColor: '#030712' }}>★★☆☆☆ (2 Stars)</option>
                  <option value={1} style={{ backgroundColor: '#030712' }}>★☆☆☆☆ (1 Star)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Display Order</label>
                <input
                  type="number"
                  placeholder="1, 2, 3..."
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                />
                <span>Active (Display on public website)</span>
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1rem',
                borderTop: '1px solid rgba(22, 119, 255, 0.15)',
                paddingTop: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentId(null);
                }}
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
                  letterSpacing: '0.04em',
                }}
              >
                {isSaving ? 'Saving...' : currentId ? 'Save Changes' : 'Save Testimonial'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
