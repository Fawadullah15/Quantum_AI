"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import AdminForm from "@/components/admin/AdminForm"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    status: "ACTIVE",
    heroImage: "",
    demoUrl: "",
    docsUrl: "",
    technologies: "",
    order: 0,
    published: true
  })

  const [features, setFeatures] = useState([{ title: "", description: "" }])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    setTimeout(() => {
      setLoading(false)
      router.push('/admin/products')
    }, 800)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    let newFormData = { ...formData, [e.target.name]: value }
    
    // Auto-generate slug from name if name is changed and slug is untouched or matches previous name
    if (e.target.name === 'name' && typeof value === 'string') {
      const slugified = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      newFormData.slug = slugified
    }
    
    setFormData(newFormData)
  }

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    setFeatures(newFeatures)
  }

  const addFeature = () => {
    setFeatures([...features, { title: "", description: "" }])
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
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
          ← Back to Products
        </button>
      </div>

      <AdminForm 
        title="Add New Product" 
        onSubmit={handleSubmit}
        isLoading={loading}
        error={error}
      >
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
          </div>
          
          <div>
            <label style={labelStyle}>Slug</label>
            <input name="slug" value={formData.slug} onChange={handleChange} style={inputStyle} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} style={{...inputStyle, resize: 'vertical'}} required />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <input name="category" value={formData.category} onChange={handleChange} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
              <option value="ACTIVE">Active</option>
              <option value="BETA">Beta</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="DEPRECATED">Deprecated</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Hero Image URL</label>
            <input name="heroImage" value={formData.heroImage} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Demo URL</label>
            <input name="demoUrl" value={formData.demoUrl} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Docs URL</label>
            <input name="docsUrl" value={formData.docsUrl} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Technologies (comma-separated)</label>
            <input name="technologies" value={formData.technologies} onChange={handleChange} style={inputStyle} placeholder="e.g. PyTorch, React, Node.js" />
          </div>

          <div>
            <label style={labelStyle}>Display Order</label>
            <input type="number" name="order" value={formData.order} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              id="published" 
              name="published" 
              checked={formData.published} 
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="published" style={{ color: '#fff', fontSize: '0.875rem' }}>Published</label>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Features</h3>
              <button type="button" onClick={addFeature} style={{ padding: '6px 12px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                + Add Feature
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {features.map((feature, idx) => (
                <div key={idx} style={{ backgroundColor: '#070b12', padding: '16px', borderRadius: '4px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={labelStyle}>Feature Title</label>
                    {features.length > 1 && (
                      <button type="button" onClick={() => removeFeature(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input value={feature.title} onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)} style={inputStyle} placeholder="Feature Title" />
                  
                  <label style={labelStyle}>Feature Description</label>
                  <textarea value={feature.description} onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)} rows={2} style={{...inputStyle, resize: 'vertical'}} placeholder="Brief description..." />
                </div>
              ))}
            </div>
          </div>

        </div>
      </AdminForm>
    </div>
  )
}
