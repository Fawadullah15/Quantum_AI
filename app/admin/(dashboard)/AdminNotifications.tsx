'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export interface NotificationItem {
  id: string
  type: string
  title: string
  subtitle: string
  senderName: string
  senderEmail: string
  preview: string
  details: any
  referenceId?: string | null
  link?: string | null
  read: boolean
  readAt?: string | null
  emailStatus: 'SENT' | 'FAILED' | 'PENDING' | string
  emailError?: string | null
  createdAt: string
  updatedAt: string
}

export function AdminNotifications() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'CONTACT' | 'CAREERS' | 'PARTNERSHIPS'>('ALL')
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async (filter = activeFilter) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/notifications?filter=${filter}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
        setTotalCount(data.totalCount || 0)
        setNotifications(data.notifications || [])
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(activeFilter)
    const interval = setInterval(() => fetchNotifications(activeFilter), 25000)
    return () => clearInterval(interval)
  }, [activeFilter])

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedNotification(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleFilterChange = (filter: 'ALL' | 'UNREAD' | 'CONTACT' | 'CAREERS' | 'PARTNERSHIPS') => {
    setActiveFilter(filter)
    fetchNotifications(filter)
  }

  const handleMarkAsRead = async (id: string, read: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read, readAt: read ? new Date().toISOString() : null } : n))
    )
    setUnreadCount((prev) => (read ? Math.max(0, prev - 1) : prev + 1))
    if (selectedNotification && selectedNotification.id === id) {
      setSelectedNotification((prev) => (prev ? { ...prev, read } : null))
    }

    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read }),
      })
    } catch (err) {
      console.error('Failed to update read state', err)
      fetchNotifications()
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true)
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })))
    setUnreadCount(0)

    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
    } catch (err) {
      console.error('Failed to mark all as read', err)
      fetchNotifications()
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleOpenDetail = (n: NotificationItem) => {
    setSelectedNotification(n)
    if (!n.read) {
      handleMarkAsRead(n.id, true)
    }
  }

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
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const formatFullDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'CONTACT':
      case 'PROJECT_INQUIRY':
        return {
          label: type === 'PROJECT_INQUIRY' ? 'INQUIRY' : 'CONTACT',
          bg: 'rgba(56, 189, 248, 0.14)',
          border: 'rgba(56, 189, 248, 0.35)',
          color: '#38BDF8',
        }
      case 'CAREER':
        return {
          label: 'CAREER',
          bg: 'rgba(168, 85, 247, 0.14)',
          border: 'rgba(168, 85, 247, 0.35)',
          color: '#C084FC',
        }
      case 'PARTNERSHIP':
        return {
          label: 'PARTNERSHIP',
          bg: 'rgba(16, 185, 129, 0.14)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: '#34D399',
        }
      case 'TESTIMONIAL':
        return {
          label: 'REVIEW',
          bg: 'rgba(245, 158, 11, 0.14)',
          border: 'rgba(245, 158, 11, 0.35)',
          color: '#FBBF24',
        }
      default:
        return {
          label: type,
          bg: 'rgba(148, 163, 184, 0.14)',
          border: 'rgba(148, 163, 184, 0.35)',
          color: '#CBD5E1',
        }
    }
  }

  const renderEmailStatusPill = (status: string, error?: string | null) => {
    if (status === 'SENT') {
      return (
        <span
          title="Email copy delivered to quantumai.cmp@gmail.com"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: '0.62rem',
            color: '#34D399',
            backgroundColor: 'rgba(52, 211, 153, 0.12)',
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          <span>✓</span>
          <span>Email Sent</span>
        </span>
      )
    }
    if (status === 'FAILED') {
      return (
        <span
          title={error ? `Email error: ${error}` : 'Email dispatch failed'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: '0.62rem',
            color: '#F87171',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          <span>⚠</span>
          <span>Email Failed</span>
        </span>
      )
    }
    return (
      <span
        title="Email delivery pending"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: '0.62rem',
          color: '#FBBF24',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 600,
        }}
      >
        <span>⏳</span>
        <span>Pending</span>
      </span>
    )
  }

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        {/* Bell Button */}
        <button
          onClick={() => {
            setOpen(!open)
            if (!open) fetchNotifications()
          }}
          aria-label="Central Notifications Inbox"
          title="Central Notifications Inbox"
          style={{
            position: 'relative',
            background: unreadCount > 0 ? 'rgba(14, 165, 233, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: unreadCount > 0 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: unreadCount > 0 ? '#38BDF8' : '#9CA3AF',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: unreadCount > 0 ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
          }}
        >
          {/* Bell Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {/* Unread Badge */}
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
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Popover */}
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: 'clamp(320px, 92vw, 420px)',
              backgroundColor: '#0A101D',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              borderRadius: 12,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(22, 119, 255, 0.15)',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'slideDown 0.15s ease-out',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#070C16',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                  Notifications Inbox
                </span>
                {unreadCount > 0 ? (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 12,
                      fontWeight: 700,
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    {unreadCount} unread
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: '#64748B' }}>All caught up</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAll}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38BDF8',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: 4,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {isMarkingAll ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={() => fetchNotifications()}
                  title="Refresh notifications"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                padding: '0.5rem 0.85rem',
                borderBottom: '1px solid rgba(30, 41, 59, 0.5)',
                backgroundColor: '#080E1B',
                overflowX: 'auto',
              }}
            >
              {[
                { key: 'ALL', label: 'All' },
                { key: 'UNREAD', label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' },
                { key: 'CONTACT', label: 'Contact' },
                { key: 'CAREERS', label: 'Careers' },
                { key: 'PARTNERSHIPS', label: 'Partnerships' },
              ].map((tab) => {
                const isActive = activeFilter === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key as any)}
                    style={{
                      background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: isActive ? '#38BDF8' : '#94A3B8',
                      border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      fontWeight: isActive ? 600 : 500,
                      padding: '0.25rem 0.55rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Notifications Scrollable List */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {loading && notifications.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.825rem' }}>
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.825rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📫</div>
                  No notifications in this filter.
                </div>
              ) : (
                notifications.map((n) => {
                  const typeInfo = getTypeStyle(n.type)
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleOpenDetail(n)}
                      style={{
                        display: 'block',
                        padding: '0.85rem 1.15rem',
                        borderBottom: '1px solid rgba(30, 41, 59, 0.5)',
                        cursor: 'pointer',
                        backgroundColor: !n.read ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                        borderLeft: !n.read ? '3px solid #38BDF8' : '3px solid transparent',
                        transition: 'background-color 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = !n.read ? 'rgba(14, 165, 233, 0.14)' : 'rgba(255, 255, 255, 0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = !n.read ? 'rgba(14, 165, 233, 0.08)' : 'transparent'
                      }}
                    >
                      {/* Top row: Type badge, Reference ID, Time, Mark Read Button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 700,
                              color: typeInfo.color,
                              backgroundColor: typeInfo.bg,
                              border: `1px solid ${typeInfo.border}`,
                              padding: '1px 6px',
                              borderRadius: 4,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {typeInfo.label}
                          </span>
                          {n.referenceId && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontFamily: 'var(--font-mono, monospace)',
                                color: '#94A3B8',
                              }}
                            >
                              {n.referenceId}
                            </span>
                          )}
                          {!n.read && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#38BDF8',
                                display: 'inline-block',
                              }}
                            />
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            title={formatFullDate(n.createdAt)}
                            style={{ fontSize: '0.68rem', color: '#64748B', whiteSpace: 'nowrap' }}
                          >
                            {formatTime(n.createdAt)}
                          </span>

                          <button
                            onClick={(e) => handleMarkAsRead(n.id, !n.read, e)}
                            title={n.read ? 'Mark as unread' : 'Mark as read'}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: n.read ? '#475569' : '#38BDF8',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={n.read ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9" />
                              {n.read && <path d="M9 12l2 2 4-4" strokeWidth="2.5" />}
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Title & Sender */}
                      <div style={{ fontSize: '0.84rem', fontWeight: !n.read ? 700 : 500, color: '#F1F5F9', marginBottom: 2 }}>
                        {n.title}
                      </div>

                      {/* Subtitle / Sender details */}
                      {(n.senderName || n.subtitle) && (
                        <div style={{ fontSize: '0.74rem', color: '#38BDF8', marginBottom: 4, fontWeight: 500 }}>
                          {n.senderName ? `${n.senderName} ${n.subtitle ? '• ' + n.subtitle : ''}` : n.subtitle}
                        </div>
                      )}

                      {/* Snippet preview */}
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: '#94A3B8',
                          lineHeight: 1.45,
                          marginBottom: 6,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {n.preview}
                      </div>

                      {/* Bottom status row: Email status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        {renderEmailStatusPill(n.emailStatus, n.emailError)}
                        <span style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 500 }}>
                          Click to open submission →
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer quick links */}
            <div
              style={{
                padding: '0.65rem 1.15rem',
                borderTop: '1px solid rgba(30, 41, 59, 0.8)',
                backgroundColor: '#070C16',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Link
                href="/admin/messages"
                onClick={() => setOpen(false)}
                style={{ fontSize: '0.75rem', color: '#38BDF8', textDecoration: 'none', fontWeight: 500 }}
              >
                Inquiries & Messages →
              </Link>
              <Link
                href="/admin/careers-partnerships"
                onClick={() => setOpen(false)}
                style={{ fontSize: '0.75rem', color: '#94A3B8', textDecoration: 'none', fontWeight: 500 }}
              >
                Careers & Partners →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FULL SUBMISSION DETAIL MODAL
      ───────────────────────────────────────────────────────────── */}
      {selectedNotification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setSelectedNotification(null)}
        >
          <div
            style={{
              backgroundColor: '#0B132B',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(14, 165, 233, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
                backgroundColor: '#070D1F',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {(() => {
                    const typeInfo = getTypeStyle(selectedNotification.type)
                    return (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 700,
                          color: typeInfo.color,
                          backgroundColor: typeInfo.bg,
                          border: `1px solid ${typeInfo.border}`,
                          padding: '2px 8px',
                          borderRadius: 4,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {typeInfo.label}
                      </span>
                    )
                  })()}

                  {selectedNotification.referenceId && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        color: '#38BDF8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {selectedNotification.referenceId}
                    </span>
                  )}

                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {formatFullDate(selectedNotification.createdAt)}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.01em' }}>
                  {selectedNotification.title}
                </h2>
                {selectedNotification.subtitle && (
                  <p style={{ fontSize: '0.82rem', color: '#38BDF8', margin: '4px 0 0 0' }}>
                    {selectedNotification.subtitle}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  color: '#94A3B8',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94A3B8'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Email Delivery Card */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 8,
                  backgroundColor:
                    selectedNotification.emailStatus === 'SENT'
                      ? 'rgba(16, 185, 129, 0.08)'
                      : selectedNotification.emailStatus === 'FAILED'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(245, 158, 11, 0.08)',
                  border:
                    selectedNotification.emailStatus === 'SENT'
                      ? '1px solid rgba(16, 185, 129, 0.25)'
                      : selectedNotification.emailStatus === 'FAILED'
                      ? '1px solid rgba(239, 68, 68, 0.25)'
                      : '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1rem' }}>
                    {selectedNotification.emailStatus === 'SENT' ? '✓' : selectedNotification.emailStatus === 'FAILED' ? '⚠' : '⏳'}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F1F5F9' }}>
                      {selectedNotification.emailStatus === 'SENT'
                        ? 'Email Copy Sent'
                        : selectedNotification.emailStatus === 'FAILED'
                        ? 'Email Copy Not Delivered'
                        : 'Email Copy Pending'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {selectedNotification.emailStatus === 'SENT'
                        ? 'Delivered to quantumai.cmp@gmail.com'
                        : selectedNotification.emailError || 'Configure GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY in environment variables'}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    color:
                      selectedNotification.emailStatus === 'SENT'
                        ? '#34D399'
                        : selectedNotification.emailStatus === 'FAILED'
                        ? '#F87171'
                        : '#FBBF24',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}
                >
                  {selectedNotification.emailStatus}
                </span>
              </div>

              {/* Applicant / Sender Contact Details */}
              <div
                style={{
                  backgroundColor: '#070D1F',
                  border: '1px solid rgba(30, 41, 59, 0.8)',
                  borderRadius: 8,
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', letterSpacing: '0.15em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                  CONTACT INFORMATION
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                  {selectedNotification.senderName && (
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Full Name</div>
                      <div style={{ fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 600 }}>{selectedNotification.senderName}</div>
                    </div>
                  )}

                  {selectedNotification.senderEmail && (
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Email Address</div>
                      <a href={`mailto:${selectedNotification.senderEmail}`} style={{ fontSize: '0.88rem', color: '#38BDF8', textDecoration: 'none', fontWeight: 500 }}>
                        {selectedNotification.senderEmail} ↗
                      </a>
                    </div>
                  )}

                  {selectedNotification.details?.phone && (
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Phone</div>
                      <a href={`tel:${selectedNotification.details.phone}`} style={{ fontSize: '0.88rem', color: '#38BDF8', textDecoration: 'none' }}>
                        {selectedNotification.details.phone}
                      </a>
                    </div>
                  )}

                  {selectedNotification.details?.company && (
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Company / Org</div>
                      <div style={{ fontSize: '0.88rem', color: '#F1F5F9' }}>{selectedNotification.details.company}</div>
                    </div>
                  )}

                  {selectedNotification.details?.country && (
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Location / Country</div>
                      <div style={{ fontSize: '0.88rem', color: '#F1F5F9' }}>{selectedNotification.details.country}</div>
                    </div>
                  )}

                  {selectedNotification.details?.website && (
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Website</div>
                      <a
                        href={selectedNotification.details.website.startsWith('http') ? selectedNotification.details.website : `https://${selectedNotification.details.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.88rem', color: '#38BDF8', textDecoration: 'none' }}
                      >
                        {selectedNotification.details.website} ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Specific Submission Details */}
              {selectedNotification.details && (
                <div
                  style={{
                    backgroundColor: '#070D1F',
                    border: '1px solid rgba(30, 41, 59, 0.8)',
                    borderRadius: 8,
                    padding: '1rem 1.25rem',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', letterSpacing: '0.15em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                    SUBMISSION ATTRIBUTES
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    {selectedNotification.details.position && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Applied Position</div>
                        <div style={{ fontSize: '0.88rem', color: '#C084FC', fontWeight: 600 }}>{selectedNotification.details.position}</div>
                      </div>
                    )}

                    {selectedNotification.details.experienceLevel && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Experience Level</div>
                        <div style={{ fontSize: '0.88rem', color: '#F1F5F9' }}>{selectedNotification.details.experienceLevel}</div>
                      </div>
                    )}

                    {selectedNotification.details.workType && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Work Type</div>
                        <div style={{ fontSize: '0.88rem', color: '#F1F5F9' }}>{selectedNotification.details.workType}</div>
                      </div>
                    )}

                    {selectedNotification.details.skills && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Core Skills</div>
                        <div style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 500 }}>{selectedNotification.details.skills}</div>
                      </div>
                    )}

                    {selectedNotification.details.partnershipType && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Partnership Category</div>
                        <div style={{ fontSize: '0.88rem', color: '#34D399', fontWeight: 600 }}>{selectedNotification.details.partnershipType}</div>
                      </div>
                    )}

                    {selectedNotification.details.budgetRange && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Budget Range</div>
                        <div style={{ fontSize: '0.88rem', color: '#FBBF24', fontWeight: 600 }}>{selectedNotification.details.budgetRange}</div>
                      </div>
                    )}

                    {selectedNotification.details.budget && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Budget</div>
                        <div style={{ fontSize: '0.88rem', color: '#FBBF24', fontWeight: 600 }}>{selectedNotification.details.budget}</div>
                      </div>
                    )}

                    {selectedNotification.details.projectType && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Inquiry Type</div>
                        <div style={{ fontSize: '0.88rem', color: '#38BDF8', fontWeight: 600 }}>{selectedNotification.details.projectType}</div>
                      </div>
                    )}

                    {selectedNotification.details.preferredContactMethod && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Preferred Contact</div>
                        <div style={{ fontSize: '0.88rem', color: '#F1F5F9' }}>{selectedNotification.details.preferredContactMethod}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message / Cover Letter / Introduction Content */}
              <div
                style={{
                  backgroundColor: '#070D1F',
                  border: '1px solid rgba(30, 41, 59, 0.8)',
                  borderRadius: 8,
                  padding: '1.25rem',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', letterSpacing: '0.15em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 700 }}>
                  SUBMISSION CONTENT / MESSAGE
                </div>
                <div
                  style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    color: '#E2E8F0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedNotification.details?.message ||
                    selectedNotification.details?.introduction ||
                    selectedNotification.preview}
                </div>
              </div>

              {/* Attachments / Files (Resume, Proposal, Photo) */}
              {(selectedNotification.details?.resumeUrl ||
                selectedNotification.details?.attachmentUrl ||
                selectedNotification.details?.photoUrl ||
                selectedNotification.details?.portfolioUrl) && (
                <div
                  style={{
                    backgroundColor: '#070D1F',
                    border: '1px solid rgba(30, 41, 59, 0.8)',
                    borderRadius: 8,
                    padding: '1rem 1.25rem',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', letterSpacing: '0.15em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                    ATTACHED DOCUMENTS & LINKS
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {selectedNotification.details.resumeUrl && (
                      <a
                        href={selectedNotification.details.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#7C3AED',
                          color: '#FFFFFF',
                          padding: '0.5rem 1rem',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <span>📄</span>
                        <span>Download Resume (CV) ↗</span>
                      </a>
                    )}

                    {selectedNotification.details.attachmentUrl && (
                      <a
                        href={selectedNotification.details.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#0284C7',
                          color: '#FFFFFF',
                          padding: '0.5rem 1rem',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <span>📎</span>
                        <span>View Attached Proposal Document ↗</span>
                      </a>
                    )}

                    {selectedNotification.details.portfolioUrl && (
                      <a
                        href={selectedNotification.details.portfolioUrl.startsWith('http') ? selectedNotification.details.portfolioUrl : `https://${selectedNotification.details.portfolioUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#1E293B',
                          color: '#38BDF8',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          padding: '0.5rem 1rem',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <span>🌐</span>
                        <span>Portfolio Link ↗</span>
                      </a>
                    )}

                    {selectedNotification.details.photoUrl && (
                      <a
                        href={selectedNotification.details.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#1E293B',
                          color: '#F1F5F9',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '0.5rem 1rem',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <span>👤</span>
                        <span>Applicant Photo ↗</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(30, 41, 59, 0.8)',
                backgroundColor: '#070D1F',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleMarkAsRead(selectedNotification.id, !selectedNotification.read)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#F1F5F9',
                    borderRadius: 6,
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {selectedNotification.read ? 'Mark as Unread' : 'Mark as Read'}
                </button>

                {selectedNotification.senderEmail && (
                  <a
                    href={`mailto:${selectedNotification.senderEmail}?subject=Re:%20Quantum%20AI%20${encodeURIComponent(selectedNotification.title)}`}
                    style={{
                      backgroundColor: '#1677FF',
                      color: '#FFFFFF',
                      borderRadius: 6,
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>Reply by Email</span>
                    <span>→</span>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {selectedNotification.link && (
                  <Link
                    href={selectedNotification.link}
                    onClick={() => {
                      setSelectedNotification(null)
                      setOpen(false)
                    }}
                    style={{
                      fontSize: '0.78rem',
                      color: '#38BDF8',
                      textDecoration: 'none',
                      fontWeight: 600,
                      padding: '0.45rem 0.65rem',
                    }}
                  >
                    Open in Dedicated Admin View ↗
                  </Link>
                )}

                <button
                  onClick={() => setSelectedNotification(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94A3B8',
                    borderRadius: 6,
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
