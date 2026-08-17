'use client'

import { useState } from 'react'
import { updateSiteSettings } from './actions'

export default function SettingsClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.target as HTMLFormElement)
    const payload = []
    
    for (const [key, value] of form.entries()) {
      payload.push({ key, value: value as string })
    }

    await updateSiteSettings(payload)
    alert('Settings saved successfully.')
    window.location.reload()
  }

  // Helper to get value
  const getVal = (key: string) => data.find(s => s.key === key)?.value || ''

  return (
    <div style={{ padding: '2rem', color: '#fff', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Site Settings</h1>
        <p style={{ color: '#9ca3af' }}>Manage global configuration and company details.</p>
      </div>

      <div style={{ background: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '2rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem', color: '#1677FF' }}>Company Info</h2>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Company Name</label>
            <input name="QUANTUM_AI" defaultValue={getVal('QUANTUM_AI')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Company Tagline</label>
            <input name="company_tagline" defaultValue={getVal('company_tagline')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contact Email</label>
            <input name="company_email" type="email" defaultValue={getVal('company_email')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location / Address</label>
            <input name="company_location" defaultValue={getVal('company_location')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>

          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem', color: '#1677FF', marginTop: '1rem' }}>Social Links</h2>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Twitter / X</label>
            <input name="company_twitter" defaultValue={getVal('company_twitter')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>LinkedIn</label>
            <input name="company_linkedin" defaultValue={getVal('company_linkedin')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>GitHub</label>
            <input name="company_github" defaultValue={getVal('company_github')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>

          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem', color: '#1677FF', marginTop: '1rem' }}>SEO / Meta</h2>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Default Meta Title</label>
            <input name="meta_title" defaultValue={getVal('meta_title')} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Default Meta Description</label>
            <textarea name="meta_description" defaultValue={getVal('meta_description')} rows={3} style={{ width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" style={{ padding: '0.75rem 2rem', background: '#1677FF', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
