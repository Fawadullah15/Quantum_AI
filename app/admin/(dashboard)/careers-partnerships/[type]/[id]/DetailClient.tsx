'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateSubmissionStatus, assignSubmission, addSubmissionNote, deleteSubmission } from '../../actions';

export default function DetailClient({
  type,
  submission: initialSubmission,
}: {
  type: 'PARTNERSHIP' | 'CAREER';
  submission: any;
}) {
  const router = useRouter();
  const [submission, setSubmission] = useState(initialSubmission);
  const [status, setStatus] = useState(submission.status);
  const [assignedTo, setAssignedTo] = useState(submission.assignedTo || '');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isNoteSaving, setIsNoteSaving] = useState(false);

  const statuses = [
    'NEW', 'REVIEWING', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'CLOSED'
  ];

  const handleStatusUpdate = async (newStatus: string) => {
    setStatus(newStatus);
    setIsSaving(true);
    try {
      await updateSubmissionStatus(type, submission.id, newStatus);
      setSubmission((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
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
    } catch (err: any) {
      alert(err?.message || 'Failed to update assignment');
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
    } catch (err: any) {
      alert(err?.message || 'Failed to add note');
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Permanently delete submission ${submission.referenceId}?`)) {
      try {
        await deleteSubmission(type, submission.id);
        router.push('/admin/careers-partnerships');
        router.refresh();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#F8FAFC' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/admin/careers-partnerships"
          style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          ← Back to Careers & Partnerships
        </Link>
        <button
          onClick={handleDelete}
          style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.4rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}
        >
          Delete Submission
        </button>
      </div>

      {/* Header Info Banner */}
      <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem', color: '#38BDF8', fontWeight: 700, marginBottom: '0.35rem' }}>
              <span>●</span> {submission.referenceId}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              {submission.fullName}
            </h1>
            <div style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {type === 'PARTNERSHIP' ? `Company: ${submission.company || 'Not Specified'}` : `Position: ${submission.position} (${submission.workType})`}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Received: {new Date(submission.createdAt).toLocaleString()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Status:</span>
              <select
                value={status}
                disabled={isSaving}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                style={{
                  padding: '0.4rem 0.85rem',
                  backgroundColor: '#0F172A',
                  border: '1px solid #38BDF8',
                  borderRadius: '6px',
                  color: '#38BDF8',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Assign Form */}
        <form onSubmit={handleAssignUpdate} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.8125rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>Assigned Reviewer:</span>
          <input
            type="text"
            placeholder="Assign team member (e.g. Fawad / Engineering Lead)"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={{
              padding: '0.4rem 0.85rem',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.8125rem',
              flex: 1,
              maxWidth: '360px',
            }}
          />
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Assignee
          </button>
        </form>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Contact & Professional Info Card */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Contact & Submission Details
          </h2>

          <DetailRow label="Email" value={<a href={`mailto:${submission.email}`} style={{ color: '#38BDF8' }}>{submission.email}</a>} />
          {submission.phone && <DetailRow label="Phone / WhatsApp" value={<a href={`tel:${submission.phone}`} style={{ color: '#F8FAFC' }}>{submission.phone}</a>} />}
          {submission.country && <DetailRow label="Country / Region" value={submission.country} />}
          {submission.currentLocation && <DetailRow label="Location" value={submission.currentLocation} />}
          {submission.website && <DetailRow label="Website" value={<a href={submission.website} target="_blank" style={{ color: '#38BDF8' }}>{submission.website} ↗</a>} />}
          {submission.linkedinUrl && <DetailRow label="LinkedIn" value={<a href={submission.linkedinUrl} target="_blank" style={{ color: '#38BDF8' }}>{submission.linkedinUrl} ↗</a>} />}
          {submission.githubUrl && <DetailRow label="GitHub" value={<a href={submission.githubUrl} target="_blank" style={{ color: '#38BDF8' }}>{submission.githubUrl} ↗</a>} />}
          {submission.portfolioUrl && <DetailRow label="Portfolio" value={<a href={submission.portfolioUrl} target="_blank" style={{ color: '#38BDF8' }}>{submission.portfolioUrl} ↗</a>} />}

          {type === 'PARTNERSHIP' ? (
            <>
              <DetailRow label="Partnership Type" value={<span style={{ color: '#A78BFA', fontWeight: 600 }}>{submission.partnershipType}</span>} />
              {submission.budgetRange && <DetailRow label="Budget Range" value={submission.budgetRange} />}
              {submission.preferredContactMethod && <DetailRow label="Preferred Contact" value={submission.preferredContactMethod} />}
            </>
          ) : (
            <>
              <DetailRow label="Position" value={<span style={{ color: '#38BDF8', fontWeight: 600 }}>{submission.position}</span>} />
              <DetailRow label="Experience Level" value={submission.experienceLevel} />
              <DetailRow label="Work Type" value={submission.workType} />
              <DetailRow label="Core Skills" value={<span style={{ color: '#CBD5E1' }}>{submission.skills}</span>} />
            </>
          )}
        </div>

        {/* Files & Documents Card */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Attached Documents & Files
          </h2>

          {type === 'CAREER' && submission.resumeUrl ? (
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Candidate Resume / CV
              </div>
              <a
                href={submission.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#1677FF',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Download / View Resume (PDF) ↗
              </a>
            </div>
          ) : null}

          {submission.additionalDocsUrl ? (
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Additional Portfolio / Documents
              </div>
              <a
                href={submission.additionalDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}
              >
                View Additional Document ↗
              </a>
            </div>
          ) : null}

          {type === 'PARTNERSHIP' && submission.attachmentUrl ? (
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Company Profile / Deck
              </div>
              <a
                href={submission.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#1677FF',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Download Deck / Document ↗
              </a>
            </div>
          ) : null}

          {!submission.resumeUrl && !submission.attachmentUrl && !submission.additionalDocsUrl && (
            <div style={{ color: '#64748B', fontSize: '0.875rem', padding: '1rem 0' }}>
              No document files were attached to this submission.
            </div>
          )}
        </div>
      </div>

      {/* Message / Proposal Content */}
      <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          {type === 'PARTNERSHIP' ? `Proposal Subject: ${submission.subject}` : 'Candidate Introduction'}
        </h2>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#CBD5E1', whiteSpace: 'pre-wrap' }}>
          {type === 'PARTNERSHIP' ? submission.message : submission.introduction}
        </div>

        {type === 'CAREER' && submission.whyQuantumAI && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Why Candidate Wants to Work with Quantum AI:
            </h3>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#CBD5E1', whiteSpace: 'pre-wrap' }}>
              {submission.whyQuantumAI}
            </div>
          </div>
        )}
      </div>

      {/* ─── Internal Team Notes Timeline ─── */}
      <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          Internal Review Notes
        </h2>

        <form onSubmit={handleAddNote} style={{ marginBottom: '24px' }}>
          <textarea
            required
            rows={3}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add an internal note or interview feedback (visible to admins only)..."
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '0.875rem',
              marginBottom: '12px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isNoteSaving}
            style={{
              padding: '8px 20px',
              backgroundColor: '#1677FF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: isNoteSaving ? 'wait' : 'pointer',
            }}
          >
            {isNoteSaving ? 'Posting...' : 'Post Internal Note'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submission.notes && submission.notes.length > 0 ? (
            submission.notes.map((note: any) => (
              <div key={note.id} style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem', color: '#94A3B8' }}>
                  <span style={{ fontWeight: 600, color: '#38BDF8' }}>{note.authorName} ({note.authorEmail || 'Admin'})</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#64748B', fontSize: '0.875rem' }}>
              No internal notes posted yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B', fontSize: '0.875rem' }}>
      <span style={{ color: '#94A3B8' }}>{label}:</span>
      <span style={{ fontWeight: 500, color: '#F8FAFC', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
