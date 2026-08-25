'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';

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
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [items, setItems] = useState<ContactMessageItem[]>(messages);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Toggle Read / Unread Status
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
      toast.success(`Marked as ${newStatus === 'NEW' ? 'New (Unread)' : 'Contacted'}`, 'Status Updated');
      router.refresh();
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update message status.', 'Error');
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Message with Admin Confirm Modal
  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Inquiry',
      message: `Are you sure you want to permanently delete the inquiry from "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        setProcessingId(id);
        const res = await fetch(`/api/admin/contact/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Delete failed');

        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success(`Inquiry from "${name}" was deleted.`, 'Deleted');
        router.refresh();
      } catch (err) {
        console.error('Delete error:', err);
        toast.error('Failed to delete inquiry.', 'Error');
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Copy Email to Clipboard
  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    toast.info(`Copied "${email}" to clipboard`, 'Email Copied');
  };

  // Filter & Search Logic
  const filteredItems = items
    .filter((msg) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        msg.name.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        (msg.company && msg.company.toLowerCase().includes(q)) ||
        (msg.projectType && msg.projectType.toLowerCase().includes(q)) ||
        msg.message.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || msg.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  // Pagination Math
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  const statusCounts = {
    ALL: items.length,
    NEW: items.filter((m) => m.status === 'NEW').length,
    CONTACTED: items.filter((m) => m.status === 'CONTACTED').length,
    IN_PROGRESS: items.filter((m) => m.status === 'IN_PROGRESS').length,
    CLOSED: items.filter((m) => m.status === 'CLOSED').length,
    ARCHIVED: items.filter((m) => m.status === 'ARCHIVED').length,
  };

  return (
    <div style={{ color: '#F8FAFC', width: '100%' }}>
      {/* Top Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', flex: '1', minWidth: '280px', maxWidth: '520px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search sender, email, project, keyword..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                backgroundColor: '#070B14',
                border: '1px solid rgba(22, 119, 255, 0.25)',
                borderRadius: '8px',
                padding: '0.6rem 0.95rem',
                fontSize: '0.85rem',
                color: '#F8FAFC',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
            style={{
              backgroundColor: '#070B14',
              border: '1px solid rgba(22, 119, 255, 0.25)',
              borderRadius: '8px',
              padding: '0.6rem 0.85rem',
              fontSize: '0.82rem',
              color: '#CBD5E1',
              outline: 'none',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All', count: statusCounts.ALL },
            { key: 'NEW', label: 'New', count: statusCounts.NEW },
            { key: 'CONTACTED', label: 'Contacted', count: statusCounts.CONTACTED },
            { key: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.IN_PROGRESS },
            { key: 'CLOSED', label: 'Closed', count: statusCounts.CLOSED },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: isActive ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                  border: isActive ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
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

      {/* Messages List Table (Desktop & Tablet) / Cards (Mobile) */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No contact inquiries found"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No messages match your active filter criteria. Try resetting your search or tab filters.'
              : 'Client inquiries submitted via the website contact form will appear here in real-time.'
          }
          action={
            (searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                style={{
                  backgroundColor: 'rgba(22, 119, 255, 0.15)',
                  border: '1px solid rgba(22, 119, 255, 0.35)',
                  color: '#38BDF8',
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Reset All Filters
              </button>
            )
          }
        />
      ) : (
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
                    Sender &amp; Contact
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
                {paginatedItems.map((msg) => {
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>{msg.email}</span>
                          <button
                            type="button"
                            title="Copy email"
                            onClick={(e) => handleCopyEmail(e, msg.email)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748B',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              padding: '0 0.2rem',
                            }}
                          >
                            📋
                          </button>
                        </div>
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
                            whiteSpace: 'nowrap',
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
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#94A3B8', fontSize: '0.78rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        {new Date(msg.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.95rem 1.15rem', verticalAlign: 'middle' }}>
                        <StatusBadge status={msg.status} />
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
                            type="button"
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
                            type="button"
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
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid rgba(22, 119, 255, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
              fontSize: '0.8rem',
              color: '#94A3B8',
            }}
          >
            <div>
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalItems)} of {totalItems} inquiries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: '#070B14',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: '#CBD5E1',
                  outline: 'none',
                }}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  backgroundColor: 'rgba(22, 119, 255, 0.12)',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  color: currentPage === 1 ? '#64748B' : '#38BDF8',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ← Prev
              </button>

              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#F8FAFC' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  backgroundColor: 'rgba(22, 119, 255, 0.12)',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  color: currentPage >= totalPages ? '#64748B' : '#38BDF8',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '4px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
