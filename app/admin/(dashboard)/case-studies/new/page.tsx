'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCaseStudyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Formatting data before send
    const payload = {
      ...data,
      published: data.published === 'on',
      metrics: metrics.filter(m => m.label && m.value),
      gallery: gallery.filter(g => g),
    };

    try {
      const res = await fetch('/api/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/case-studies');
        router.refresh();
      } else {
        alert('Failed to create case study');
      }
    } catch (err) {
      alert('Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl pb-24">
      <h1 className="text-3xl font-bold mb-8">New Case Study</h1>
      <form onSubmit={handleSubmit} className="space-y-8 bg-[var(--color-surface)] p-8 border border-[var(--color-border)]">
        
        <div className="grid md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-mono mb-2">Title</label><input required name="title" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Slug</label><input required name="slug" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Client</label><input required name="client" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Industry</label><input required name="industry" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Year</label><input required name="year" type="number" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Hero Image URL</label><input name="heroImage" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">External URL</label><input name="url" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Technologies (comma sep)</label><input name="technologies" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-mono mb-2">Services (comma sep)</label><input name="services" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
        </div>

        <div className="space-y-6 pt-6 border-t border-[var(--color-border)]">
          <div><label className="block text-sm font-mono mb-2">Brief Description</label><textarea required name="briefDescription" rows={2} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Problem</label><textarea required name="problem" rows={4} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Solution</label><textarea required name="solution" rows={4} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Implementation</label><textarea required name="implementation" rows={4} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
          <div><label className="block text-sm font-mono mb-2">Results Overview</label><textarea name="results" rows={3} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" /></div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Metrics</h3>
            <button type="button" onClick={addMetric} className="text-sm font-mono border border-[var(--color-border)] px-3 py-1 hover:border-[var(--color-primary)]">+ Add Metric</button>
          </div>
          <div className="space-y-4">
            {metrics.map((m, i) => (
              <div key={i} className="flex gap-4 items-start">
                <input placeholder="Label (e.g. ROI)" value={m.label} onChange={(e) => updateMetric(i, 'label', e.target.value)} className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] p-2" />
                <input placeholder="Value (e.g. 300%)" value={m.value} onChange={(e) => updateMetric(i, 'value', e.target.value)} className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] p-2" />
                <input placeholder="Description" value={m.description} onChange={(e) => updateMetric(i, 'description', e.target.value)} className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] p-2" />
                <button type="button" onClick={() => removeMetric(i)} className="text-red-500 p-2">&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Gallery URLs</h3>
            <button type="button" onClick={addGallery} className="text-sm font-mono border border-[var(--color-border)] px-3 py-1 hover:border-[var(--color-primary)]">+ Add Image</button>
          </div>
          <div className="space-y-2">
            {gallery.map((g, i) => (
              <div key={i} className="flex gap-4">
                <input value={g} onChange={(e) => updateGallery(i, e.target.value)} placeholder="Image URL" className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] p-2" />
                <button type="button" onClick={() => removeGallery(i)} className="text-red-500 p-2">&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="published" defaultChecked className="w-5 h-5 accent-[var(--color-primary)]" />
            <span className="font-mono text-sm">Published</span>
          </label>
        </div>

        <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-[var(--color-primary)] text-[var(--color-bg)] font-bold disabled:opacity-50">
          {isSubmitting ? 'SAVING...' : 'SAVE CASE STUDY'}
        </button>
      </form>
    </div>
  );
}
