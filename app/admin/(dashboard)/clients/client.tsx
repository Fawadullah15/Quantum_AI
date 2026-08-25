'use client';

import React, { useState } from 'react';
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
      order: items.length + 1,
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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteClient(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('An error occurred while deleting.');
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.industry && item.industry.toLowerCase().includes(searchQuery.toLowerCase()))
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
          {/* Top action row */}
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
            <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="Search organizations or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#070B14',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.9rem',
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
                padding: '0.6rem 1.25rem',
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
                boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)',
                transition: 'background-color 0.2s',
              }}
            >
              <span>+</span> ADD ORGANIZATION
            </button>
          </div>

          {/* Grid of Client Cards */}
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
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.5rem 0' }}>
                No organizations found
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Add organizations, companies, or products you have deployed to showcase on the landing page.
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
                + Add First Organization
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
              {filteredItems.map((c) => (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.75)',
                    border: '1px solid rgba(22, 119, 255, 0.18)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                >
                  <div>
                    {/* Top Row: Name, Logo & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(22, 119, 255, 0.14)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {c.logo ? (
                            <img src={c.logo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>🏢</span>
                          )}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', margin: 0, lineHeight: 1.25 }}>
                            {c.name}
                          </h3>
                          {c.industry && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontSize: '0.65rem',
                                color: '#38BDF8',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginTop: '0.15rem',
                              }}
                            >
                              {c.industry}
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
                          backgroundColor: c.published ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: c.published ? '#34D399' : '#FBBF24',
                          border: c.published ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.published ? 'LIVE' : 'DRAFT'}
                      </span>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p
                        style={{
                          fontSize: '0.825rem',
                          color: '#94A3B8',
                          lineHeight: 1.5,
                          margin: '0 0 0.65rem 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontWeight: 300,
                        }}
                      >
                        {c.description}
                      </p>
                    )}

                    {/* Target Link */}
                    {c.website && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.72rem',
                            color: '#38BDF8',
                            fontFamily: 'var(--font-mono, monospace)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span>{c.website}</span>
                          <span>↗</span>
                        </a>
                      </div>
                    )}
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
                      onClick={() => handleTogglePublish(c)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        color: c.published ? '#94A3B8' : '#34D399',
                        borderRadius: '4px',
                        padding: '0.25rem 0.55rem',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {c.published ? 'Unpublish' : 'Publish'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(c)}
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
                        onClick={() => handleDelete(c.id, c.name)}
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
        /* Form / Modal View for Create or Edit */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.85)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: '1.75rem',
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
                CLIENT & COLLABORATION
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                {currentId ? `Edit: ${formData.name}` : 'Add New Organization / Client'}
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Organization / Client Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. School Operations Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Industry / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Education / Institution"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  style={inputStyle}
                />
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

            <div>
              <label style={labelStyle}>Website or Case Study URL</label>
              <input
                type="text"
                placeholder="e.g. /work/school-operations-manager or https://client.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Logo Image URL (Optional)</label>
              <input
                type="text"
                placeholder="e.g. /uploads/client-logo.png"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Short Description</label>
              <textarea
                rows={3}
                placeholder="Brief summary of the platform, collaboration, or system built..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                />
                <span>Published (Visible on site)</span>
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <span>Featured</span>
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
                {isSaving ? 'Saving...' : currentId ? 'Save Changes' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
