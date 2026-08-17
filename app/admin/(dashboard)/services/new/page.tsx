'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewServicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['AI', 'SOFTWARE', 'PRODUCT', 'CONSULTING'];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      ...data,
      order: parseInt(data.order as string, 10) || 0,
      published: data.published === 'on',
    };

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/services');
        router.refresh();
      } else {
        alert('Failed to create service');
      }
    } catch (err) {
      alert('Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Add Service</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--color-surface)] p-8 border border-[var(--color-border)]">
        
        <div>
          <label className="block text-sm font-mono mb-2">Name</label>
          <input required name="name" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" />
        </div>

        <div>
          <label className="block text-sm font-mono mb-2">Category</label>
          <select required name="category" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-mono mb-2">Description</label>
          <textarea required name="description" rows={4} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-mono mb-2">Icon Identifier (e.g. Brain, Code)</label>
            <input name="icon" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" />
          </div>
          <div>
            <label className="block text-sm font-mono mb-2">Order</label>
            <input name="order" type="number" defaultValue={0} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3" />
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="published" defaultChecked className="w-5 h-5 accent-[var(--color-primary)]" />
            <span className="font-mono text-sm">Published</span>
          </label>
        </div>

        <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-[var(--color-primary)] text-[var(--color-bg)] font-bold mt-8 disabled:opacity-50">
          {isSubmitting ? 'SAVING...' : 'SAVE SERVICE'}
        </button>
      </form>
    </div>
  );
}
