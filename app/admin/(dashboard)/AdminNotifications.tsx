'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface NotificationItem {
  id: string
  title: string
  subtitle: string
  snippet: string
  createdAt: string
  status: string
  link: string
}

export function AdminNotifications() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
        setNotifications(data.notifications || [])
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return `${diffDays}d ago`
    } catch {
      return ''
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => {
          setOpen(!open)
          if (!open) fetchNotifications()
        }}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? '#60A5FA' : '#9CA3AF',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {/* Bell Icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #0A0F1A',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown popup */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'clamp(280px, 85vw, 340px)',
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: 10,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'slideDown 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0A0F1D',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={fetchNotifications}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.825rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid rgba(30, 41, 59, 0.6)',
                    textDecoration: 'none',
                    backgroundColor: n.status === 'NEW' ? 'rgba(30, 58, 138, 0.15)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = n.status === 'NEW' ? 'rgba(30, 58, 138, 0.15)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#F1F5F9' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748B', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginBottom: 2 }}>
                    {n.subtitle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    {n.snippet}
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.5rem 1rem',
              borderTop: '1px solid #1E293B',
              backgroundColor: '#0A0F1D',
              textAlign: 'center',
            }}
          >
            <Link
              href="/admin/messages"
              onClick={() => setOpen(false)}
              style={{
                fontSize: '0.75rem',
                color: '#38BDF8',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              View all messages →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
