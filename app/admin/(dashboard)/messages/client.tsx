'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  projectType?: string | null;
  budget?: string | null;
  message: string;
  status: string;
  notes?: string | null;
  createdAt: string | Date;
}

export default function MessagesListClient({
  messages = [],
}: {
  messages: ContactMessageItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<ContactMessageItem[]>(messages);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleToggleStatus = async (e: React.MouseEvent, msg: ContactMessageItem) => {
    e.stopPropagation();
    const newStatus = msg.status === 'NEW' ? 'CONTACTED' : 'NEW';
    try {
      setProcessingId(msg.id);
      const res = await fetch(`/api/admin/contact/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');

      setItems((prev) =>
        prev.map((item) => (item.id === msg.id ? { ...item, status: newStatus } : item))
      );
      router.refresh();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Failed to update status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the message from "${name}"?`)) {
      try {
        setProcessingId(id);
        const res = await fetch(`/api/admin/contact/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Delete failed');

        setItems((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete message.');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const filteredItems = items.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.company && msg.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.projectType && msg.projectType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || msg.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'NEW':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'CONTACTED':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' };
      case 'CLOSED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'ARCHIVED':
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8', border: 'rgba(100, 116, 139, 0.3)' };
      default:
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)' };
    }
  };

  const statusCounts = {
    ALL: items.length,
    NEW: items.filter((m) => m.status === 'NEW').length,
    CONTACTED: items.filter((m) => m.status === 'CONTACTED').length,
    IN_PROGRESS: items.filter((m) => m.status === 'IN_PROGRESS').length,
    CLOSED: items.filter((m) => m.status === 'CLOSED').length,
  };

  return (
    <div style={{ color: '#F8FAFC', width: '100%' }}>
      {/* Top Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Search Input */}
        <div style={{ minWidth: '280px', flex: '1', maxWidth: '420px' }}>
          <input
            type="text"
            placeholder="Search by sender, email, project, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#070B14',
              border: '1px solid rgba(22, 119, 255, 0.25)',
              borderRadius: '8px',
              padding: '0.65rem 0.95rem',
              fontSize: '0.875rem',
              color: '#F8FAFC',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Inquiries', count: statusCounts.ALL },
            { key: 'NEW', label: 'New', count: statusCounts.NEW },
            { key: 'CONTACTED', label: 'Contacted', count: statusCounts.CONTACTED },
            { key: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.IN_PROGRESS },
            { key: 'CLOSED', label: 'Closed', count: statusCounts.CLOSED },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  backgroundColor: isActive ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                  border: isActive ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(22,119,255,0.15)',
                    color: isActive ? '#FFFFFF' : '#38BDF8',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages List Table */}
      <div
        style={{
          backgroundColor: 'rgba(6, 21, 43, 0.75)',
          border: '1px solid rgba(22, 119, 255, 0.18)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.8)', borderBottom: '1px solid rgba(22, 119, 255, 0.18)' }}>
                <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Sender & Contact
                </th>
                <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Project Type
                </th>
                <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Message Preview
                </th>
                <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Date
                </th>
                <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
                      No contact inquiries found
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                      Try adjusting your search query or filter tab.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((msg) => {
                  const badge = getStatusBadge(msg.status);
                  const isProcessing = processingId === msg.id;

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => router.push(`/admin/messages/${msg.id}`)}
                      style={{
                        borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        backgroundColor: msg.status === 'NEW' ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          msg.status === 'NEW' ? 'rgba(56, 189, 248, 0.04)' : 'transparent';
                      }}
                    >
                      {/* Sender */}
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.92rem' }}>
                          {msg.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>{msg.email}</div>
                        {msg.company && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                            {msg.company}
                          </div>
                        )}
                      </td>

                      {/* Project Type */}
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(22, 119, 255, 0.12)',
                            border: '1px solid rgba(22, 119, 255, 0.25)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#CBD5E1',
                            fontFamily: 'var(--font-mono, monospace)',
                          }}
                        >
                          {msg.projectType || 'General Inquiry'}
                        </span>
                      </td>

                      {/* Message Preview */}
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle', maxWidth: '300px' }}>
                        <div
                          style={{
                            fontSize: '0.825rem',
                            color: '#94A3B8',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {msg.message}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#94A3B8', fontSize: '0.78rem' }}>
                        {new Date(msg.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono, monospace)',
                            letterSpacing: '0.05em',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {msg.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link
                            href={`/admin/messages/${msg.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              backgroundColor: 'rgba(22, 119, 255, 0.15)',
                              border: '1px solid rgba(22, 119, 255, 0.35)',
                              color: '#38BDF8',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                          >
                            View
                          </Link>

                          <button
                            onClick={(e) => handleToggleStatus(e, msg)}
                            disabled={isProcessing}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                              color: msg.status === 'NEW' ? '#FBBF24' : '#94A3B8',
                              padding: '0.3rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                          >
                            {msg.status === 'NEW' ? 'Mark Contacted' : 'Mark New'}
                          </button>

                          <button
                            onClick={(e) => handleDelete(e, msg.id, msg.name)}
                            disabled={isProcessing}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#F87171',
                              padding: '0.3rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
