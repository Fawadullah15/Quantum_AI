'use client'

import { useState } from 'react'
import { createTechnology, updateTechnology, deleteTechnology } from './actions'

export default function TechnologyClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData)
  const [editing, setEditing] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.target as HTMLFormElement)
    
    // Parse features and use cases from textarea (JSON format)
    let features = '[]'
    let useCases = '[]'
    
    try {
      const featuresText = form.get('features') as string
      const useCasesText = form.get('useCases') as string
      if (featuresText) features = featuresText
      if (useCasesText) useCases = useCasesText
    } catch (e) {
      console.error('Error parsing JSON:', e)
    }

    const payload = {
      name: form.get('name') as string,
      slug: form.get('slug') as string || undefined,
      shortDescription: form.get('shortDescription') as string,
      category: form.get('category') as string,
      heroTitle: form.get('heroTitle') as string || undefined,
      heroDescription: form.get('heroDescription') as string || undefined,
      heroImage: form.get('heroImage') as string || undefined,
      content: form.get('content') as string || undefined,
      features,
      useCases,
      ctaTitle: form.get('ctaTitle') as string || undefined,
      ctaDescription: form.get('ctaDescription') as string || undefined,
      ctaText: form.get('ctaText') as string || undefined,
      ctaLink: form.get('ctaLink') as string || undefined,
      usage: form.get('usage') as string || undefined,
      projects: form.get('projects') as string || undefined,
      icon: form.get('icon') as string || undefined,
      order: parseInt(form.get('order') as string) || 0,
      published: form.get('published') === 'on',
    }

    if (editing) {
      await updateTechnology(editing.id, payload)
    } else {
      await createTechnology(payload)
    }
    
    setIsModalOpen(false)
    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this technology?')) {
      await deleteTechnology(id)
      window.location.reload()
    }
  }

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Technologies</h1>
        <button 
          onClick={() => { setEditing(null); setIsModalOpen(true); }}
          style={{ padding: '0.5rem 1rem', background: '#1677FF', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
        >
          + Add Technology
        </button>
      </div>

      <div style={{ background: '#111827', borderRadius: '8px', border: '1px solid #1f2937', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#1f2937' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Slug</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '1rem' }}>{item.name}</td>
                <td style={{ padding: '1rem' }}>{item.category}</td>
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#9ca3af' }}>{item.slug}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', background: item.published ? '#065f46' : '#991b1b' }}>
                    {item.published ? 'Published' : 'Hidden'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => { setEditing(item); setIsModalOpen(true); }} style={{ marginRight: '1rem', background: 'transparent', color: '#1677FF', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#111827', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '700px', border: '1px solid #1f2937', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{editing ? 'Edit Technology' : 'Add Technology'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Basic Info */}
              <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af', textTransform: 'uppercase' }}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Name *</label>
                    <input name="name" defaultValue={editing?.name} required style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Slug (auto-generated if empty)</label>
                    <input name="slug" defaultValue={editing?.slug} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Short Description *</label>
                  <textarea name="shortDescription" defaultValue={editing?.shortDescription} required rows={2} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Category *</label>
                    <input name="category" defaultValue={editing?.category} required style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Display Order</label>
                    <input type="number" name="order" defaultValue={editing?.order || 0} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                  </div>
                </div>
              </div>

              {/* Hero Section */}
              <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af', textTransform: 'uppercase' }}>Hero Section</h3>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Hero Title</label>
                  <input name="heroTitle" defaultValue={editing?.heroTitle} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Hero Description</label>
                  <textarea name="heroDescription" defaultValue={editing?.heroDescription} rows={2} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Hero Image URL</label>
                  <input name="heroImage" defaultValue={editing?.heroImage} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af', textTransform: 'uppercase' }}>Page Content (HTML supported)</h3>
                <textarea name="content" defaultValue={editing?.content} rows={6} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff', fontFamily: 'monospace' }} />
              </div>

              {/* Features */}
              <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af', textTransform: 'uppercase' }}>Features (JSON array)</h3>
                <textarea 
                  name="features" 
                  defaultValue={editing?.features} 
                  rows={4} 
                  placeholder='[{"title": "Feature 1", "description": "Description 1"}]'
                  style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff', fontFamily: 'monospace' }} 
                />
              </div>

              {/* Use Cases */}
              <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af', textTransform: 'uppercase' }}>Use Cases (JSON array)</h3>
                <textarea 
                  name="useCases" 
                  defaultValue={editing?.useCases} 
                  rows={4} 
                  placeholder='[{"title": "Use Case 1", "description": "Description 1"}]'
                  style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff', fontFamily: 'monospace' }} 
                />
              </div>

              {/* CTA */}
              <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af', textTransform: 'uppercase' }}>Call to Action</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>CTA Title</label>
                    <input name="ctaTitle" defaultValue={editing?.ctaTitle} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>CTA Text</label>
                    <input name="ctaText" defaultValue={editing?.ctaText} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>CTA Description</label>
                  <textarea name="ctaDescription" defaultValue={editing?.ctaDescription} rows={2} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>CTA Link</label>
                  <input name="ctaLink" defaultValue={editing?.ctaLink} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
              </div>

              {/* Legacy Fields */}
              <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af', textTransform: 'uppercase' }}>Legacy Fields</h3>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Usage</label>
                  <input name="usage" defaultValue={editing?.usage} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Projects (comma-separated)</label>
                  <input name="projects" defaultValue={editing?.projects} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Icon URL</label>
                  <input name="icon" defaultValue={editing?.icon} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#1f2937', borderRadius: '6px' }}>
                <input type="checkbox" name="published" id="published" defaultChecked={editing ? editing.published : true} />
                <label htmlFor="published">Published</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#1677FF', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
