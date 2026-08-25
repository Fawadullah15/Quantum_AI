'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';

export interface MessageDetailData {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  projectType?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  status: string;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export default function MessageDetailClient({ message }: { message: MessageDetailData }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [status, setStatus] = useState(message.status || 'NEW');
  const [notes, setNotes] = useState(message.notes || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/admin/contact/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Status updated to "${status}"`, 'Status Updated');
      router.refresh();
    } catch (err) {
      console.error('Update status error:', err);
      toast.error('An error occurred while updating status.', 'Update Failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingNotes(true);
      const res = await fetch(`/api/admin/contact/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        throw new Error('Failed to save notes');
      }

      toast.success('Internal notes saved successfully.', 'Notes Saved');
      router.refresh();
    } catch (err) {
      console.error('Save notes error:', err);
      toast.error('An error occurred while saving notes.', 'Save Failed');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Inquiry',
      message: `Are you sure you want to permanently delete the inquiry from "${message.name}"? This cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        setIsDeleting(true);
        const res = await fetch(`/api/admin/contact/${message.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('Failed to delete message');
        }

        toast.success(`Inquiry from "${message.name}" was deleted.`, 'Deleted');
        router.push('/admin/messages');
        router.refresh();
      } catch (err) {
        console.error('Delete error:', err);
        toast.error('Failed to delete inquiry.', 'Error');
        setIsDeleting(false);
      }
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(message.email);
    toast.info(`Copied "${message.email}" to clipboard`, 'Email Copied');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100, margin: '0 auto', color: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Breadcrumb & Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            href="/admin/messages"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#38BDF8',
              backgroundColor: 'rgba(22, 119, 255, 0.12)',
              border: '1px solid rgba(22, 119, 255, 0.25)',
              padding: '0.45rem 0.85rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            ← Back to Inquiries
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#64748B', fontSize: '0.85rem' }}>/</span>
            <span style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 500 }}>{message.name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyEmail}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38BDF8',
              padding: '0.48rem 0.95rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            📋 Copy Email
          </button>

          <a
            href={`mailto:${message.email}?subject=Regarding your inquiry at Quantum AI&body=Hi ${encodeURIComponent(message.name)},%0D%0A%0D%0AThank you for reaching out to Quantum AI.`}
            style={{
              backgroundColor: '#1677FF',
              color: '#FFFFFF',
              padding: '0.48rem 1rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)',
            }}
          >
            ✉ Reply via Email
          </a>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              padding: '0.48rem 0.95rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {isDeleting ? 'Deleting...' : '🗑 Delete'}
          </button>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Contact & Message Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Contact Information Card */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '0.65rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: 0 }}>
                Contact Information
              </h2>
              <StatusBadge status={status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.25rem' }}>
                  Name
                </div>
                <div style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>{message.name}</div>
              </div>

              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.25rem' }}>
                  Email Address
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <a href={`mailto:${message.email}`} style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.88rem', wordBreak: 'break-all' }}>
                    {message.email}
                  </a>
                </div>
              </div>

              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.25rem' }}>
                  Company / Organization
                </div>
                <div style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{message.company || '-'}</div>
              </div>

              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.25rem' }}>
                  Phone Number
                </div>
                <div style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{message.phone || '-'}</div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.25rem' }}>
                  Date Received
                </div>
                <div style={{ color: '#CBD5E1', fontSize: '0.825rem' }}>
                  {new Date(message.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Project Details & Body */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 1rem 0', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '0.65rem' }}>
              Project Details &amp; Message
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.25rem' }}>
                  Project Type
                </div>
                <div style={{ color: '#38BDF8', fontWeight: 500, fontSize: '0.88rem' }}>{message.projectType || 'General Inquiry'}</div>
              </div>

              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.25rem' }}>
                  Estimated Budget
                </div>
                <div style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{message.budget || '-'}</div>
              </div>
            </div>

            <div>
              <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.45rem' }}>
                Client Message
              </div>
              <div
                style={{
                  backgroundColor: '#070B14',
                  border: '1px solid rgba(22, 119, 255, 0.2)',
                  borderRadius: 8,
                  padding: '1.15rem',
                  color: '#F8FAFC',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {message.message}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Control & Internal Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Status Updater Card */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 1rem 0' }}>
              Inquiry Status
            </h2>

            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  backgroundColor: '#070B14',
                  color: '#F8FAFC',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  borderRadius: 6,
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              >
                <option value="NEW" style={{ backgroundColor: '#070B14' }}>New (Unread)</option>
                <option value="CONTACTED" style={{ backgroundColor: '#070B14' }}>Contacted</option>
                <option value="IN_PROGRESS" style={{ backgroundColor: '#070B14' }}>In Progress</option>
                <option value="CLOSED" style={{ backgroundColor: '#070B14' }}>Closed</option>
                <option value="ARCHIVED" style={{ backgroundColor: '#070B14' }}>Archived</option>
              </select>

              <button
                type="submit"
                disabled={isUpdatingStatus}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  backgroundColor: 'rgba(22, 119, 255, 0.2)',
                  border: '1px solid rgba(22, 119, 255, 0.4)',
                  color: '#38BDF8',
                  borderRadius: 6,
                  cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.03em',
                  transition: 'background-color 0.2s',
                }}
              >
                {isUpdatingStatus ? 'Updating Status...' : 'Update Status'}
              </button>
            </form>
          </div>

          {/* Internal Notes Card */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 1rem 0' }}>
              Internal Admin Notes
            </h2>

            <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <textarea
                rows={5}
                placeholder="Add private internal notes about this client, call logs, requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#070B14',
                  color: '#F8FAFC',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  borderRadius: 6,
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />

              <button
                type="submit"
                disabled={isSavingNotes}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  cursor: isSavingNotes ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.03em',
                  boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)',
                }}
              >
                {isSavingNotes ? 'Saving Notes...' : 'Save Notes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
