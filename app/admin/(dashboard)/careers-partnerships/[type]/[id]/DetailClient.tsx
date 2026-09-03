'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import { updateSubmissionStatus, assignSubmission, addSubmissionNote, deleteSubmission } from '../../actions';

export default function DetailClient({
  type,
  submission: initialSubmission,
}: {
  type: 'PARTNERSHIP' | 'CAREER';
  submission: any;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [submission, setSubmission] = useState(initialSubmission);
  const [status, setStatus] = useState(submission.status);
  const [assignedTo, setAssignedTo] = useState(submission.assignedTo || '');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isNoteSaving, setIsNoteSaving] = useState(false);

  const statuses = [
    'NEW',
    'REVIEWING',
    'SHORTLISTED',
    'CONTACTED',
    'INTERVIEW',
    'ACCEPTED',
    'REJECTED',
    'IGNORED',
    'ARCHIVED',
    'CLOSED',
  ];

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'ACCEPTED') {
      const confirmed = await confirm({
        title: 'Accept Application',
        message: 'Are you sure you want to accept this application? Once accepted, this person will automatically be displayed on the public Leadership page.',
        confirmText: 'Accept & Publish to Leadership',
        confirmVariant: 'primary',
      });
      if (!confirmed) {
        return; // do not update if cancelled
      }
    } else if (newStatus === 'REJECTED') {
      const confirmed = await confirm({
        title: 'Reject Application',
        message: 'Are you sure you want to reject this application? This candidate will not be displayed on the public Leadership page.',
        confirmText: 'Reject Application',
        confirmVariant: 'danger',
      });
      if (!confirmed) {
        return;
      }
    }

    setStatus(newStatus);
    setIsSaving(true);
    try {
      await updateSubmissionStatus(type, submission.id, newStatus);
      setSubmission((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to "${newStatus}"`, 'Status Updated');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status', 'Error');
      setStatus(submission.status); // revert
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await assignSubmission(type, submission.id, assignedTo);
      setSubmission((prev: any) => ({ ...prev, assignedTo }));
      toast.success(`Assigned to "${assignedTo}"`, 'Lead Assigned');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update assignment', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setIsNoteSaving(true);
    try {
      await addSubmissionNote(type, submission.id, noteContent);
      setSubmission((prev: any) => ({
        ...prev,
        notes: [
          {
            id: `temp-${Date.now()}`,
            authorName: 'Administrator',
            content: noteContent,
            createdAt: new Date().toISOString(),
          },
          ...(prev.notes || []),
        ],
      }));
      setNoteContent('');
      toast.success('Internal note added successfully.', 'Note Saved');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add note', 'Error');
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Submission',
      message: `Permanently delete submission ${submission.referenceId}? This cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteSubmission(type, submission.id);
        toast.success(`Submission ${submission.referenceId} was deleted.`, 'Deleted');
        router.push('/admin/careers-partnerships');
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete submission', 'Error');
      }
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(submission.email);
    toast.info(`Copied "${submission.email}" to clipboard`, 'Email Copied');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header & Breadcrumb Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            href="/admin/careers-partnerships"
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
            ← Back to Submissions
          </Link>
          <span style={{ color: '#64748B' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#CBD5E1', fontSize: '0.85rem' }}>
            {submission.referenceId}
          </span>
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
            href={`mailto:${submission.email}?subject=Regarding your ${type.toLowerCase()} submission to Quantum AI (${submission.referenceId})&body=Hi ${encodeURIComponent(submission.fullName)},%0D%0A%0D%0AThank you for connecting with Quantum AI.`}
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

          {status !== 'ACCEPTED' && (
            <button
              type="button"
              onClick={() => handleStatusUpdate('ACCEPTED')}
              style={{
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#34D399',
                padding: '0.48rem 0.95rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
                boxShadow: '0 4px 12px rgba(52, 211, 153, 0.15)',
              }}
            >
              ✓ Accept Application
            </button>
          )}

          {status !== 'REJECTED' && (
            <button
              type="button"
              onClick={() => handleStatusUpdate('REJECTED')}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171',
                padding: '0.48rem 0.95rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              ✗ Reject Application
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#94A3B8',
              padding: '0.48rem 0.95rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            🗑 Delete
          </button>
        </div>
      </div>

      {/* 2-Column Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Information Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Info Header */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {submission.photoUrl && (
                  <img
                    src={submission.photoUrl}
                    alt={submission.fullName}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38BDF8', backgroundColor: '#07152F' }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {type === 'PARTNERSHIP' ? 'ENTERPRISE PROPOSAL' : 'TALENT APPLICATION'}
                  </div>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: '#F8FAFC' }}>
                    {submission.fullName}
                  </h1>
                </div>
              </div>
              <StatusBadge status={status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                  Email
                </div>
                <a href={`mailto:${submission.email}`} style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.88rem', wordBreak: 'break-all' }}>
                  {submission.email}
                </a>
              </div>

              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                  Phone
                </div>
                <div style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{submission.phone || '-'}</div>
              </div>

              {type === 'PARTNERSHIP' ? (
                <>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Company
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '0.88rem', fontWeight: 600 }}>{submission.company || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Country
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{submission.country || 'Global'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Partnership Type
                    </div>
                    <div style={{ color: '#38BDF8', fontSize: '0.85rem' }}>{submission.partnershipType}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Website
                    </div>
                    {submission.website ? (
                      <a href={submission.website.startsWith('http') ? submission.website : `https://${submission.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.85rem' }}>
                        {submission.website} ↗
                      </a>
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '0.85rem' }}>-</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Position Applied
                    </div>
                    <div style={{ color: '#38BDF8', fontSize: '0.88rem', fontWeight: 600 }}>{submission.position}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Experience Level
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{submission.experienceLevel || 'Mid Level'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Work Type
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{submission.workType || 'Full Time'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Current Location
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{submission.currentLocation || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      CV / Resume Document
                    </div>
                    {submission.resumeUrl ? (
                      <a href={submission.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.82rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        📄 View Attached CV ↗
                      </a>
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Not provided</span>
                    )}
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                      Additional Portfolio
                    </div>
                    {submission.additionalDocsUrl ? (
                      <a href={submission.additionalDocsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.82rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        📁 View Attached Docs ↗
                      </a>
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Not provided</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submission Details / Message Body */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.85rem 0', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '0.5rem' }}>
              {type === 'PARTNERSHIP' ? 'Proposal Details & Message' : 'Candidate Profile & Details'}
            </h2>

            {type === 'CAREER' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                    LinkedIn
                  </div>
                  {submission.linkedinUrl ? (
                    <a href={submission.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.85rem' }}>{submission.linkedinUrl}</a>
                  ) : <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Not provided</span>}
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                    GitHub
                  </div>
                  {submission.githubUrl ? (
                    <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.85rem' }}>{submission.githubUrl}</a>
                  ) : <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Not provided</span>}
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.2rem' }}>
                    Portfolio Website
                  </div>
                  {submission.portfolioUrl ? (
                    <a href={submission.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.85rem' }}>{submission.portfolioUrl}</a>
                  ) : <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Not provided</span>}
                </div>
              </div>
            )}

            {type === 'CAREER' && submission.skills && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.35rem' }}>
                  Core Technical Skills
                </div>
                <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 6, padding: '0.65rem 0.85rem', color: '#38BDF8', fontSize: '0.85rem' }}>
                  {submission.skills}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.35rem' }}>
                {type === 'PARTNERSHIP' ? 'Message' : 'Introduction & Engineering Background'}
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
                {type === 'PARTNERSHIP' ? submission.message : submission.introduction}
              </div>
            </div>

            {type === 'CAREER' && submission.whyQuantumAI && (
              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.35rem' }}>
                  Why Quantum AI
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
                  {submission.whyQuantumAI}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Internal Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Status & Assignment Card */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 1rem 0' }}>
              Submission Lifecycle
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.35rem' }}>
                  Update Review Status
                </label>
                <select
                  value={status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#070B14',
                    color: '#F8FAFC',
                    border: '1px solid rgba(22, 119, 255, 0.25)',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  {statuses.map((st) => (
                    <option key={st} value={st} style={{ backgroundColor: '#070B14' }}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleAssignUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                  Assign to Team Member
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Technical Recruiter"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: '#070B14',
                    color: '#F8FAFC',
                    border: '1px solid rgba(22, 119, 255, 0.25)',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    backgroundColor: 'rgba(22, 119, 255, 0.15)',
                    border: '1px solid rgba(22, 119, 255, 0.35)',
                    color: '#38BDF8',
                    padding: '0.5rem',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Save Assignment
                </button>
              </form>
            </div>
          </div>

          {/* Internal Notes History */}
          <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 12, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 1rem 0' }}>
              Internal Admin Notes
            </h2>

            <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <textarea
                rows={3}
                placeholder="Log interview feedback, candidate notes, or evaluation summary..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#070B14',
                  color: '#F8FAFC',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={isNoteSaving || !noteContent.trim()}
                style={{
                  backgroundColor: '#1677FF',
                  color: '#FFFFFF',
                  padding: '0.55rem',
                  borderRadius: 6,
                  border: 'none',
                  cursor: isNoteSaving || !noteContent.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {isNoteSaving ? 'Saving...' : '+ Add Note'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {(!submission.notes || submission.notes.length === 0) ? (
                <div style={{ color: '#64748B', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                  No internal notes recorded yet.
                </div>
              ) : (
                submission.notes.map((n: any) => (
                  <div
                    key={n.id}
                    style={{
                      backgroundColor: '#070B14',
                      border: '1px solid rgba(22, 119, 255, 0.15)',
                      borderRadius: 6,
                      padding: '0.75rem',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-mono, monospace)' }}>
                      <span style={{ color: '#38BDF8', fontWeight: 600 }}>{n.authorName}</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: '#CBD5E1', lineHeight: 1.45 }}>{n.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
