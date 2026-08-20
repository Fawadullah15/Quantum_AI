'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateTechnology } from '../../actions';

export default function EditTechnologyForm({ technology }: { technology: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    'AI/ML', 'Frontend', 'Backend', 'Database',
    'Infrastructure', 'DevOps', 'API', 'Other'
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const category = formData.get('category') as string;
    const heroTitle = formData.get('heroTitle') as string;
    const heroDescription = formData.get('heroDescription') as string;
    const heroImage = formData.get('heroImage') as string;
    const content = formData.get('content') as string;
    const features = formData.get('features') as string;
    const useCases = formData.get('useCases') as string;
    const ctaTitle = formData.get('ctaTitle') as string;
    const ctaText = formData.get('ctaText') as string;
    const ctaDescription = formData.get('ctaDescription') as string;
    const ctaLink = formData.get('ctaLink') as string;
    const usage = formData.get('usage') as string;
    const projects = formData.get('projects') as string;
    const icon = formData.get('icon') as string;
    const order = parseInt(formData.get('order') as string, 10) || 0;
    const published = formData.get('published') === 'on';

    try {
      await updateTechnology(technology.id, {
        name,
        slug,
        shortDescription,
        category,
        heroTitle,
        heroDescription,
        heroImage,
        content,
        features,
        useCases,
        ctaTitle,
        ctaText,
        ctaDescription,
        ctaLink,
        usage,
        projects,
        icon,
        order,
        published,
      });
      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        router.push('/admin/technology');
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Failed to update technology');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/admin/technology" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to Technologies
        </Link>
        <Link
          href={`/technologies/${technology.slug}`}
          target="_blank"
          style={{ color: '#38BDF8', fontSize: '0.875rem', textDecoration: 'none' }}
        >
          View Public Page ↗
        </Link>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '24px' }}>
        Edit Technology: {technology.name}
      </h1>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#F87171', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', color: '#34D399', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
          Technology updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic Information */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Basic Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Name *</label>
              <input required name="name" defaultValue={technology.name} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Slug</label>
              <input name="slug" defaultValue={technology.slug} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Short Description *</label>
            <textarea required name="shortDescription" defaultValue={technology.shortDescription} rows={2} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Category *</label>
              <select name="category" defaultValue={technology.category} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Display Order</label>
              <input type="number" name="order" defaultValue={technology.order} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Hero Header
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Hero Title</label>
            <input name="heroTitle" defaultValue={technology.heroTitle || ''} placeholder="e.g. Artificial Intelligence Systems" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Hero Description</label>
            <textarea name="heroDescription" defaultValue={technology.heroDescription || ''} rows={2} placeholder="Expanded subtitle for the hero banner" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Hero Image URL</label>
            <input name="heroImage" defaultValue={technology.heroImage || ''} placeholder="https://..." style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
          </div>
        </div>

        {/* Call to Action (CTA) Section */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(22, 119, 255, 0.3)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -4px rgba(22, 119, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Call to Action (CTA)
            </h2>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.8125rem', marginBottom: '16px' }}>
            Configures the dynamic CTA card at the bottom of the public Technology page.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>CTA Title</label>
              <input name="ctaTitle" defaultValue={technology.ctaTitle || ''} placeholder="e.g. Ready to Architect Next-Gen AI?" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>CTA Button Text</label>
              <input name="ctaText" defaultValue={technology.ctaText || ''} placeholder="e.g. Start a Project / Schedule Consultation" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>CTA Description</label>
            <textarea name="ctaDescription" defaultValue={technology.ctaDescription || ''} rows={2} placeholder="e.g. Connect with Quantum AI engineers to design and deploy custom intelligent software." style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>CTA Button Link</label>
            <input name="ctaLink" defaultValue={technology.ctaLink || ''} placeholder="e.g. /contact or https://calendly.com/..." style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC' }} />
          </div>
        </div>

        {/* Content & Features */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Detailed Content & Features
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Page Content (HTML supported)</label>
            <textarea name="content" defaultValue={technology.content || ''} rows={5} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontFamily: 'monospace' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Features (JSON array)</label>
            <textarea name="features" defaultValue={technology.features || '[]'} rows={3} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.875rem', marginBottom: '6px' }}>Use Cases (JSON array)</label>
            <textarea name="useCases" defaultValue={technology.useCases || '[]'} rows={3} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#F8FAFC', fontFamily: 'monospace' }} />
          </div>
        </div>

        {/* Publication Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px 24px' }}>
          <input type="checkbox" name="published" id="published" defaultChecked={technology.published} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
          <label htmlFor="published" style={{ color: '#F8FAFC', fontSize: '0.9375rem', cursor: 'pointer' }}>
            Published (Visible on public website)
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Link href="/admin/technology" style={{ padding: '10px 20px', border: '1px solid #334155', color: '#94A3B8', textDecoration: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ padding: '10px 24px', backgroundColor: '#1677FF', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
