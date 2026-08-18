'use client'
import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import styles from './layout.module.css'

export function AdminShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className={styles.adminLayout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 40, display: 'none'
          }}
          className="mobile-overlay"
        />
      )}
      
      {/* Mobile header bar */}
      <div className="admin-mobile-header">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
          style={{
            background: 'transparent', border: 'none', color: '#9ca3af',
            cursor: 'pointer', padding: '0.5rem', borderRadius: 6
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.9rem' }}>ADMIN PANEL</span>
        <div style={{ width: 38 }} />
      </div>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentArea}>{children}</div>
      </main>

      <style>{`
        .admin-mobile-header {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: #0a0f1a;
          border-bottom: 1px solid #1f2937;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          z-index: 45;
        }
        @media (max-width: 768px) {
          .admin-mobile-header { display: flex; }
          .mobile-overlay { display: block !important; }
          .${styles.mainContent} { margin-top: 56px; }
        }
      `}</style>
    </div>
  )
}
