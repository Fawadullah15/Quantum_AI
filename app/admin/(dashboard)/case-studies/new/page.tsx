'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCaseStudy } from '../actions';

export default function NewCaseStudyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState([{ label: '', value: '', description: '' }]);
  const [gallery, setGallery] = useState(['']);

  const addMetric = () => setMetrics([...metrics, { label: '', value: '', description: '' }]);
  const removeMetric = (i: number) => setMetrics(metrics.filter((_, idx) => idx !== i));
  const updateMetric = (i: number, field: string, val: string) => {
    const m = [...metrics];
    m[i] = { ...m[i], [field]: val };
    setMetrics(m);
  };

  const addGallery = () => setGallery([...gallery, '']);
  const removeGallery = (i: number) => setGallery(gallery.filter((_, idx) => idx !== i));
  const updateGallery = (i: number, val: string) => {
    const g = [...gallery];
    g[i] = val;
    setGallery(g);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = (formData.get('slug') as string) || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const client = formData.get('client') as string;
    const industry = formData.get('industry') as string;
    const year = parseInt(formData.get('year') as string, 10) || new Date().getFullYear();
    const heroImage = (formData.get('heroImage') as string) || null;
    const externalUrl = (formData.get('url') as string) || null;
    const technologies = formData.get('technologies') as string;
    const services = formData.get('services') as string;
    const problem = (formData.get('problem') as string) || (formData.get('briefDescription') as string) || '';
    const solution = formData.get('solution') as string;
    const implementation = formData.get('implementation') as string;
    const results = formData.get('results') as string;
    const published = formData.get('published') === 'on';

    try {
      await createCaseStudy({
        title,
        slug,
        client,
        industry,
        year,
        heroImage,
        externalUrl,
        technologies,
        services,
        problem,
        solution,
        implementation,
        results,
        published,
        metrics: metrics.filter(m => m.label && m.value),
        gallery: gallery.filter(Boolean),
      });

      router.push('/admin/case-studies');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.875rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '6px'
  };

  return (
    <div style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Back to Case Studies
        </button>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>New Case Study</h1>

      {error && (
        <div style={{ backgroundColor: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#0a0f1a', padding: '24px', border: '1px solid #1f2937', borderRadius: '8px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><label style={labelStyle}>Title</label><input required name="title" style={inputStyle} /></div>
          <div><label style={labelStyle}>Slug (Optional, auto-generated)</label><input name="slug" style={inputStyle} placeholder="e.g. smart-fee-system" /></div>
          <div><label style={labelStyle}>Client</label><input required name="client" style={inputStyle} /></div>
          <div><label style={labelStyle}>Industry</label><input required name="industry" style={inputStyle} /></div>
          <div><label style={labelStyle}>Year</label><input required name="year" type="number" defaultValue={new Date().getFullYear()} style={inputStyle} /></div>
          <div><label style={labelStyle}>Hero Image URL</label><input name="heroImage" style={inputStyle} /></div>
          <div><label style={labelStyle}>External URL</label><input name="url" style={inputStyle} /></div>
          <div><label style={labelStyle}>Technologies (comma sep)</label><input name="technologies" style={inputStyle} placeholder="Next.js, FastAPI, PostgreSQL" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Services (comma sep)</label><input name="services" style={inputStyle} placeholder="AI Systems, Full-Stack Development" /></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
          <div><label style={labelStyle}>Problem / Challenge</label><textarea required name="problem" rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><label style={labelStyle}>Solution</label><textarea required name="solution" rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><label style={labelStyle}>Implementation</label><textarea required name="implementation" rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><label style={labelStyle}>Results Overview</label><textarea name="results" rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
        </div>

        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>Metrics (Optional)</h3>
            <button type="button" onClick={addMetric} style={{ padding: '4px 10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>+ Add Metric</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input placeholder="Label (e.g. ROI)" value={m.label} onChange={(e) => updateMetric(i, 'label', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input placeholder="Value (e.g. 300%)" value={m.value} onChange={(e) => updateMetric(i, 'value', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input placeholder="Description" value={m.description} onChange={(e) => updateMetric(i, 'description', e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                <button type="button" onClick={() => removeMetric(i)} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '4px 8px' }}>&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>Gallery URLs (Optional)</h3>
            <button type="button" onClick={addGallery} style={{ padding: '4px 10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>+ Add Image</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gallery.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input value={g} onChange={(e) => updateGallery(i, e.target.value)} placeholder="Image URL" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={() => removeGallery(i)} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '4px 8px' }}>&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" id="published" name="published" defaultChecked style={{ width: '16px', height: '16px' }} />
          <label htmlFor="published" style={{ color: '#fff', fontSize: '0.875rem', cursor: 'pointer' }}>Published (Visible on site)</label>
        </div>

        <button disabled={isSubmitting} type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}>
          {isSubmitting ? 'Saving...' : 'Save Case Study'}
        </button>
      </form>
    </div>
  );
}
