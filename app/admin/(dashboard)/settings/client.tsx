'use client'

import React, { useState } from 'react'
import { updateSiteSettings } from './actions'

interface SettingItem {
  id?: string
  key: string
  value: string
}

export default function SettingsClient({ initialData }: { initialData: SettingItem[] }) {
  const [data, setData] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    try {
      const form = new FormData(e.target as HTMLFormElement)
      const payload: { key: string; value: string }[] = []

      for (const [key, value] of form.entries()) {
        payload.push({ key, value: value as string })
      }

      await updateSiteSettings(payload)
      setToast('Settings saved successfully.')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setToast('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const getVal = (key: string, fallback = '') => {
    return data.find((s) => s.key === key)?.value || fallback
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    color: '#F8FAFC',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
    letterSpacing: '0.02em',
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Site Settings</h1>
          <p style={{ color: '#64748B', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            Manage your global branding, company information, and meta data.
          </p>
        </div>
        {toast && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#6EE7B7', padding: '0.4rem 0.875rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500 }}>
            {toast}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Section 1: Company Profile */}
        <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.65rem' }}>
            <span style={{ fontSize: '1rem' }}>🏢</span>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Company Information</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Company Name</label>
              <input name="QUANTUM_AI" defaultValue={getVal('QUANTUM_AI', 'Quantum AI')} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Tagline</label>
              <input name="company_tagline" defaultValue={getVal('company_tagline', 'Intelligent software for a connected world.')} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Official Contact Email</label>
              <input name="company_email" type="email" defaultValue={getVal('company_email', 'hello@quantumai.dev')} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Office Location</label>
              <input name="company_location" defaultValue={getVal('company_location', 'San Francisco & Islamabad')} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Section 2: Social Links */}
        <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.65rem' }}>
            <span style={{ fontSize: '1rem' }}>🔗</span>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Social & Links</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>LinkedIn URL</label>
              <input name="company_linkedin" defaultValue={getVal('company_linkedin')} placeholder="https://linkedin.com/company/..." style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Twitter / X URL</label>
              <input name="company_twitter" defaultValue={getVal('company_twitter')} placeholder="https://x.com/..." style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>GitHub URL</label>
              <input name="company_github" defaultValue={getVal('company_github')} placeholder="https://github.com/..." style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Section 3: SEO Configuration */}
        <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.65rem' }}>
            <span style={{ fontSize: '1rem' }}>🔍</span>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Search Engine Optimization (SEO)</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Default Meta Title</label>
              <input name="meta_title" defaultValue={getVal('meta_title', 'Quantum AI — Intelligent Softwares Company')} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Meta Description</label>
              <textarea name="meta_description" defaultValue={getVal('meta_description', 'Quantum AI builds AI systems, business software, and digital products.')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.6rem 1.75rem',
              backgroundColor: '#2563EB',
              border: 'none',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'background-color 0.2s',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
