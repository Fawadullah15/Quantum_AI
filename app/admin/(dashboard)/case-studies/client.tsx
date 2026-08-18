'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createCaseStudy, updateCaseStudy, deleteCaseStudy } from './actions'
import type { CaseStudy } from '@prisma/client'

export default function CaseStudiesClient({ caseStudies: initialCaseStudies }: { caseStudies: CaseStudy[] }) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(initialCaseStudies)
  const [isEditing, setIsEditing] = useState(false)
  const [current, setCurrent] = useState<CaseStudy | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = (study: CaseStudy) => {
    setCurrent(study)
    setIsEditing(true)
  }

  const handleCreate = () => {
    setCurrent(null)
    setIsEditing(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteCaseStudy(id)
      setCaseStudies(prev => prev.filter(s => s.id !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const data = Object.fromEntries(formData.entries())

      if (current?.id) {
        await updateCaseStudy(current.id, data)
      } else {
        await createCaseStudy(data)
      }
      setIsEditing(false)
      window.location.reload()
    } catch (error) {
      console.error('Error saving case study:', error)
      alert('Failed to save case study')
    } finally {
      setIsSubmitting(false)
    }
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
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
  }

  if (isEditing) {
    return (
      <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 10, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>
            {current ? `Edit Work: ${current.title}` : 'Create New Work / Case Study'}
          </h2>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ✕ Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Basic Info */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              1. Basic Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Project Title *</label>
                <input name="title" defaultValue={current?.title} required placeholder="e.g. Smart School Management System" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>URL Slug (optional - auto generated)</label>
                <input name="slug" defaultValue={current?.slug} placeholder="e.g. smart-school-management" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Client Name</label>
                <input name="client" defaultValue={current?.client || ''} placeholder="e.g. Eden School System" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Industry / Category</label>
                <input name="industry" defaultValue={current?.industry || 'Education'} placeholder="e.g. Education, AI Systems, FinTech" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <input type="number" name="year" defaultValue={current?.year || new Date().getFullYear()} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Display Order</label>
                <input type="number" name="order" defaultValue={current?.order || 0} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Narrative Content */}
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              2. Story & Solution
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={labelStyle}>Problem / Overview Description *</label>
                <textarea name="problem" defaultValue={current?.problem || ''} required rows={3} placeholder="The core challenge the client faced..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Solution Architecture</label>
                <textarea name="solution" defaultValue={current?.solution || ''} rows={2} placeholder="How Quantum AI engineered the solution..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Implementation Details</label>
                <textarea name="implementation" defaultValue={current?.implementation || ''} rows={2} placeholder="Models, databases, and deployment details..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Key Results & Metrics</label>
                <textarea name="results" defaultValue={current?.results || ''} rows={2} placeholder="e.g. 50% faster turnaround, 10,000+ daily active users..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Tags & Tech */}
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              3. Technologies & Services
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Technologies (comma separated)</label>
                <input name="technologies" defaultValue={current?.technologies || ''} placeholder="Next.js, Python, PostgreSQL, Docker" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Services (comma separated)</label>
                <input name="services" defaultValue={current?.services || ''} placeholder="Business Software, Automation" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Publishing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <input type="checkbox" name="published" id="published" value="true" defaultChecked={current ? current.published : true} style={{ width: 16, height: 16, accentColor: '#1677FF', cursor: 'pointer' }} />
            <label htmlFor="published" style={{ fontSize: '0.85rem', color: '#F1F5F9', cursor: 'pointer' }}>
              Published (visible immediately on public Works & Homepage)
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #1E293B', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              style={{ padding: '0.55rem 1.25rem', backgroundColor: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#94A3B8', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '0.55rem 1.5rem', backgroundColor: '#2563EB', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Saving...' : (current ? 'Update Work' : 'Publish Work')}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#0B111E', borderRadius: 10, border: '1px solid #1E293B', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090E1A', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', margin: 0 }}>All Works & Case Studies</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>{caseStudies.length} total deployments</p>
        </div>
        <button
          onClick={handleCreate}
          style={{ padding: '0.45rem 1rem', backgroundColor: '#2563EB', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          + Add New Work
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#64748B', borderBottom: '1px solid #1E293B' }}>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Client</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Industry</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Year</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {caseStudies.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                  No case studies found. Click "+ Add New Work" to create your first project.
                </td>
              </tr>
            ) : (
              caseStudies.map((study) => (
                <tr key={study.id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#F1F5F9' }}>
                    {study.title}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94A3B8' }}>{study.client || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94A3B8' }}>{study.industry || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{study.year || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      backgroundColor: study.published ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      color: study.published ? '#34D399' : '#FBBF24',
                    }}>
                      {study.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link
                        href={`/work/${study.slug}`}
                        target="_blank"
                        style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.1)' }}
                      >
                        View ↗
                      </Link>
                      <button
                        onClick={() => handleEdit(study)}
                        style={{ background: '#334155', border: 'none', color: '#F1F5F9', padding: '0.25rem 0.55rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(study.id, study.title)}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#F87171', padding: '0.25rem 0.55rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
