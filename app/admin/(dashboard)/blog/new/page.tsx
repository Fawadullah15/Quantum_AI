"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import AdminForm from "@/components/admin/AdminForm"

export default function NewBlogPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "",
    tags: "",
    author: "",
    published: false,
    metaTitle: "",
    metaDescription: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    setTimeout(() => {
      setLoading(false)
      router.push('/admin/blog')
    }, 800)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    const newFormData = { ...formData, [e.target.name]: value }
    
    // Auto-generate slug
    if (e.target.name === 'title' && typeof value === 'string') {
      const slugified = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      newFormData.slug = slugified
    }
    
    setFormData(newFormData)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.875rem'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '8px'
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Back to Blog Posts
        </button>
      </div>

      <AdminForm 
        title="Create Blog Post" 
        onSubmit={handleSubmit}
        isLoading={loading}
        error={error}
      >
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Title</label>
            <input name="title" value={formData.title} onChange={handleChange} style={inputStyle} required />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Slug</label>
            <input name="slug" value={formData.slug} onChange={handleChange} style={inputStyle} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Excerpt</label>
            <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} style={{...inputStyle, resize: 'vertical'}} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>Content</label>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Markdown supported</span>
            </div>
            <textarea name="content" value={formData.content} onChange={handleChange} rows={12} style={{...inputStyle, resize: 'vertical', fontFamily: 'monospace'}} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Cover Image URL</label>
            <input name="coverImage" value={formData.coverImage} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <input name="category" value={formData.category} onChange={handleChange} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>Author</label>
            <input name="author" value={formData.author} onChange={handleChange} style={inputStyle} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input name="tags" value={formData.tags} onChange={handleChange} style={inputStyle} placeholder="e.g. AI, Machine Learning, Update" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              id="published" 
              name="published" 
              checked={formData.published} 
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="published" style={{ color: '#fff', fontSize: '0.875rem' }}>Published (Visible on site)</label>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 16px 0', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>SEO Info</h3>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Meta Title (Optional, defaults to Title)</label>
            <input name="metaTitle" value={formData.metaTitle} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Meta Description (Optional, defaults to Excerpt)</label>
            <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={2} style={{...inputStyle, resize: 'vertical'}} />
          </div>
        </div>
      </AdminForm>
    </div>
  )
}
