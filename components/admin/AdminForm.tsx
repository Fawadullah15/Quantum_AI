import React from 'react'

export interface AdminFormProps {
  title: string
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  error?: string
  success?: string
  children: React.ReactNode
}

export default function AdminForm({ title, onSubmit, isLoading, error, success, children }: AdminFormProps) {
  return (
    <div style={{
      backgroundColor: '#0a0f1a',
      border: '1px solid #1f2937',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #1f2937'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
          {title}
        </h2>
      </div>
      
      <form onSubmit={onSubmit}>
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              borderRadius: '4px',
              fontSize: '0.875rem',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              borderRadius: '4px',
              fontSize: '0.875rem',
              marginBottom: '24px'
            }}>
              {success}
            </div>
          )}

          {children}
        </div>
        
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#111827',
          borderTop: '1px solid #1f2937',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              padding: '10px 24px',
              backgroundColor: '#06b6d4',
              color: '#030712',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
