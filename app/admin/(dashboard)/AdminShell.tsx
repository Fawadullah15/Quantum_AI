'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './layout.module.css'
import { AdminNotifications } from './AdminNotifications'

export function AdminShell({
  sidebar,
  children,
  userName = 'Admin',
  userRole = 'ADMIN',
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
  userName?: string
  userRole?: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Get current section name
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard'
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length > 1) {
      const section = parts[1]
      return section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')
    }
    return 'Admin'
  }

  return (
    <div className={styles.adminLayout}>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 45,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Universal Top Bar for both PC and Mobile */}
        <header className={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
              className="admin-hamburger"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 6,
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb / Title */}
            <div className={styles.breadcrumb}>
              <span style={{ color: '#475569' }}>Admin</span>
              <span style={{ color: '#334155' }}>/</span>
              <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{getPageTitle()}</span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className={styles.topBarActions}>
            <Link
              href="/"
              target="_blank"
              style={{
                fontSize: '0.75rem',
                color: '#94A3B8',
                textDecoration: 'none',
                padding: '0.35rem 0.65rem',
                borderRadius: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s',
              }}
            >
              <span>View Site</span>
              <span style={{ fontSize: '0.85rem' }}>↗</span>
            </Link>

            {/* Notification Bell Component */}
            <AdminNotifications />

            {/* User Mini Indicator */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #1E3A8A, #0284C7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-hamburger {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
