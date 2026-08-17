"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminForm from "@/components/admin/AdminForm"

export default function EditFounderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "Ada Lovelace",
    role: "CEO",
    bio: "Pioneer in computing.",
    photoUrl: "/images/ada.jpg",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
    github: "https://github.com",
    order: 0,
    published: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    // Mock save
    setTimeout(() => {
      setLoading(false)
      router.push('/admin/founders')
    }, 800)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
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
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Back to Founders
        </button>
      </div>

      <AdminForm 
        title="Edit Founder" 
        onSubmit={handleSubmit}
        isLoading={loading}
        error={error}
      >
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Role</label>
            <input name="role" value={formData.role} onChange={handleChange} style={inputStyle} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} style={{...inputStyle, resize: 'vertical'}} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Photo URL</label>
            <input name="photoUrl" value={formData.photoUrl} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>LinkedIn URL</label>
            <input name="linkedin" value={formData.linkedin} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Twitter URL</label>
            <input name="twitter" value={formData.twitter} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>GitHub URL</label>
            <input name="github" value={formData.github} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Display Order</label>
            <input type="number" name="order" value={formData.order} onChange={handleChange} style={inputStyle} />
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
            <label htmlFor="published" style={{ color: '#fff', fontSize: '0.875rem' }}>Published</label>
          </div>
        </div>
      </AdminForm>
    </div>
  )
}
