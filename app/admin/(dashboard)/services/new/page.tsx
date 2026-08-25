'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminToast } from '@/components/admin/AdminToast';

export default function NewServicePage() {
  const router = useRouter();
  const toast = useAdminToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('AI');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [order, setOrder] = useState('0');
  const [published, setPublished] = useState(true);

  const categories = ['AI', 'SOFTWARE', 'PRODUCT', 'CONSULTING'];

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Service Name is required', 'Validation Error');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      description: description.trim(),
      icon: icon.trim(),
      order: parseInt(order, 10) || 0,
      published,
    };

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Service created successfully.', 'Created');
        router.push('/admin/services');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to create service', 'Error');
      }
    } catch {
      toast.error('Network error submitting service form.', 'Network Error');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(22, 119, 255, 0.25)',
    borderRadius: 8,
    color: '#F8FAFC',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-mono, monospace)',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', color: '#F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.15em', color: '#1677FF', textTransform: 'uppercase', fontWeight: 600 }}>
            SERVICES // CREATE
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>Add New Service</h1>
        </div>
        <Link
          href="/admin/services"
          style={{
            padding: '0.45rem 0.85rem',
            backgroundColor: 'rgba(22, 119, 255, 0.1)',
            border: '1px solid rgba(22, 119, 255, 0.3)',
            borderRadius: 6,
            color: '#38BDF8',
            fontSize: '0.8rem',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          ← Back to Services
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#0B111E',
          border: '1px solid #1E293B',
          borderRadius: 12,
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div>
          <label style={labelStyle}>Service Name *</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Autonomous AI Agents & Multi-Agent Swarms"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="autonomous-ai-agents"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: '#070B14', color: '#F8FAFC' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Description *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the service and capabilities..."
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Icon Identifier (e.g. Brain, Code, Cpu)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Brain"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Sort Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#1677FF', cursor: 'pointer' }}
          />
          <label htmlFor="published" style={{ fontSize: '0.85rem', color: '#F8FAFC', cursor: 'pointer' }}>
            Publish live to public website
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #1E293B', paddingTop: '1.25rem' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: '#1677FF',
              border: 'none',
              color: '#FFFFFF',
              padding: '0.65rem 1.5rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Service'}
          </button>

          <Link
            href="/admin/services"
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: 'rgba(100, 116, 139, 0.15)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: 8,
              color: '#94A3B8',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono, monospace)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
