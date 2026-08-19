'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTechnology } from '../actions';

export default function NewTechnologyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'AI/ML', 'Frontend', 'Backend', 'Database', 
    'Infrastructure', 'DevOps', 'API', 'Other'
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = (formData.get('slug') as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const shortDescription = (formData.get('shortDescription') as string) || (formData.get('description') as string) || '';
    const category = formData.get('category') as string;
    const usage = formData.get('usage') as string;
    const projects = formData.get('projects') as string;
    const icon = formData.get('icon') as string;
    const order = parseInt(formData.get('order') as string, 10) || 0;
    const published = formData.get('published') === 'on';

    try {
      await createTechnology({
        name,
        slug,
        shortDescription,
        category,
        usage,
        projects,
        icon,
        order,
        published,
      });
      router.push('/admin/technology');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Back to Technology
        </button>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>Add Technology</h1>

      {error && (
        <div style={{ backgroundColor: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#0a0f1a', padding: '24px', border: '1px solid #1f2937', borderRadius: '8px' }}>
        
        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Name</label>
          <input required name="name" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Slug (Optional, auto-generated from Name)</label>
          <input name="slug" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }} placeholder="e.g. pytorch" />
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Category</label>
          <select required name="category" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Short Description</label>
          <textarea required name="shortDescription" rows={3} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff', resize: 'vertical' }} />
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Usage (How we use it)</label>
          <input name="usage" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }} placeholder="e.g. Primary inference engine" />
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Projects (Comma separated)</label>
          <input name="projects" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }} placeholder="e.g. Neural Router, Agentic Search" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Icon / Badge</label>
            <input name="icon" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }} placeholder="e.g. ⚡ or URL" />
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '6px' }}>Order</label>
            <input name="order" type="number" defaultValue={0} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" id="published" name="published" defaultChecked style={{ width: '16px', height: '16px' }} />
          <label htmlFor="published" style={{ color: '#fff', fontSize: '0.875rem', cursor: 'pointer' }}>Published (Visible on site)</label>
        </div>

        <button disabled={isSubmitting} type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}>
          {isSubmitting ? 'Saving...' : 'Save Technology'}
        </button>
      </form>
    </div>
  );
}
