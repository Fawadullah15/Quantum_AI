'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import {
  updateSubmissionStatus,
  deleteSubmission,
  createCareerPosition,
  updateCareerPosition,
  deleteCareerPosition,
} from './actions';

interface Props {
  partnerships: any[];
  applications: any[];
  positions?: any[];
  metrics: {
    totalSubmissions: number;
    newApplications: number;
    underReview: number;
    partnershipCount: number;
    recentlyContacted: number;
  };
}

export default function CareersPartnershipsClient({
  partnerships: initialPartnerships,
  applications: initialApps,
  positions: initialPositions = [],
  metrics,
}: Props) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [activeTab, setActiveTab] = useState<'PARTNERSHIPS' | 'CAREERS' | 'POSITIONS'>('PARTNERSHIPS');
  const [partnerships, setPartnerships] = useState(initialPartnerships);
  const [applications, setApplications] = useState(initialApps);
  const [positions, setPositions] = useState(initialPositions);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Position modal / create form
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [positionForm, setPositionForm] = useState({
    title: '',
    department: 'AI Engineering',
    location: 'Remote / Hybrid',
    workType: 'Full Time',
    description: '',
    isActive: true,
    order: 0,
  });

  const statuses = [
    'ALL',
    'NEW',
    'REVIEWING',
    'SHORTLISTED',
    'CONTACTED',
    'INTERVIEW',
    'ACCEPTED',
    'REJECTED',
    'CLOSED',
  ];

  const handleStatusChange = async (type: 'PARTNERSHIP' | 'CAREER', id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateSubmissionStatus(type, id, newStatus);
      if (type === 'PARTNERSHIP') {
        setPartnerships((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      } else {
        setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
      }
      toast.success(`Status updated to "${newStatus}"`, 'Status Updated');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (type: 'PARTNERSHIP' | 'CAREER', id: string, refId: string) => {
    const confirmed = await confirm({
      title: 'Delete Submission',
      message: `Permanently delete submission ${refId}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      setActionLoading(id);
      try {
        await deleteSubmission(type, id);
        if (type === 'PARTNERSHIP') {
          setPartnerships((prev) => prev.filter((p) => p.id !== id));
        } else {
          setApplications((prev) => prev.filter((a) => a.id !== id));
        }
        toast.success(`Submission ${refId} was deleted.`, 'Deleted');
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete submission', 'Error');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    toast.info(`Copied "${email}" to clipboard`, 'Email Copied');
  };

  // Position handlers
  const handleOpenNewPosition = () => {
    setPositionForm({
      title: '',
      department: 'AI Engineering',
      location: 'Remote / Hybrid',
      workType: 'Full Time',
      description: '',
      isActive: true,
      order: positions.length + 1,
    });
    setEditingPositionId(null);
    setIsEditingPosition(true);
  };

  const handleEditPosition = (pos: any) => {
    setPositionForm({
      title: pos.title,
      department: pos.department || 'AI Engineering',
      location: pos.location || 'Remote / Hybrid',
      workType: pos.workType || 'Full Time',
      description: pos.description || '',
      isActive: pos.isActive ?? true,
      order: pos.order || 0,
    });
    setEditingPositionId(pos.id);
    setIsEditingPosition(true);
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionForm.title.trim()) {
      toast.warning('Please enter a position title', 'Validation');
      return;
    }

    try {
      if (editingPositionId) {
        const updated = await updateCareerPosition(editingPositionId, positionForm);
        setPositions((prev) => prev.map((p) => (p.id === editingPositionId ? updated : p)));
        toast.success(`Position "${positionForm.title}" updated`, 'Saved');
      } else {
        const created = await createCareerPosition(positionForm);
        setPositions((prev) => [...prev, created]);
        toast.success(`Position "${positionForm.title}" created`, 'Created');
      }
      setIsEditingPosition(false);
      setEditingPositionId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save position', 'Error');
    }
  };

  const handleDeletePosition = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Position',
      message: `Permanently delete open role "${title}"?`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteCareerPosition(id);
        setPositions((prev) => prev.filter((p) => p.id !== id));
        toast.success(`Position "${title}" removed`, 'Deleted');
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete position', 'Error');
      }
    }
  };

  const handleTogglePositionActive = async (pos: any) => {
    try {
      const updated = await updateCareerPosition(pos.id, {
        ...pos,
        isActive: !pos.isActive,
      });
      setPositions((prev) => prev.map((p) => (p.id === pos.id ? updated : p)));
      toast.success(`Position ${!pos.isActive ? 'activated' : 'deactivated'}`, 'Status Updated');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status', 'Error');
    }
  };

  // Filtered lists
  const filteredPartnerships = partnerships.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      p.referenceId?.toLowerCase().includes(q) ||
      p.fullName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.company?.toLowerCase().includes(q) ||
      p.subject?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      a.referenceId?.toLowerCase().includes(q) ||
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.position?.toLowerCase().includes(q) ||
      a.skills?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPositions = positions.filter((p) => {
    const q = searchTerm.toLowerCase();
    return !q || p.title?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q);
  });

  return (
    <div style={{ color: '#F8FAFC', width: '100%' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.12)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              color: '#1677FF',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
              fontWeight: 600,
            }}
          >
            TALENT &amp; ENTERPRISE EXPANSION
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, margin: 0 }}>
            Careers &amp; Business Partnerships
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: 300 }}>
            Review candidate applications, manage enterprise partnership proposals, and publish open engineering roles.
          </p>
        </div>

        {activeTab === 'POSITIONS' && (
          <button
            type="button"
            onClick={handleOpenNewPosition}
            style={{
              backgroundColor: '#1677FF',
              color: '#FFFFFF',
              padding: '0.55rem 1.15rem',
              borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)',
            }}
          >
            + Add Open Position
          </button>
        )}
      </div>

      {/* KPI Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 10, padding: '1rem', borderLeft: '3px solid #38BDF8' }}>
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
            Total Submissions
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', marginTop: '0.25rem' }}>
            {metrics.totalSubmissions}
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 10, padding: '1rem', borderLeft: '3px solid #F59E0B' }}>
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
            New Applications
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FBBF24', marginTop: '0.25rem' }}>
            {metrics.newApplications}
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 10, padding: '1rem', borderLeft: '3px solid #818CF8' }}>
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
            Under Review
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#A5B4FC', marginTop: '0.25rem' }}>
            {metrics.underReview}
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 10, padding: '1rem', borderLeft: '3px solid #34D399' }}>
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
            Open Job Roles
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#34D399', marginTop: '0.25rem' }}>
            {positions.length}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.45rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'PARTNERSHIPS', label: '🤝 Enterprise Partnerships', count: partnerships.length },
          { key: 'CAREERS', label: '👥 Career Applications', count: applications.length },
          { key: 'POSITIONS', label: '💼 Open Positions (Careers Page)', count: positions.length },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as any);
                setStatusFilter('ALL');
              }}
              style={{
                backgroundColor: isActive ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                border: isActive ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(22,119,255,0.15)',
                  color: isActive ? '#FFFFFF' : '#38BDF8',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '460px' }}>
          <input
            type="text"
            placeholder={
              activeTab === 'POSITIONS'
                ? 'Search role title or department...'
                : 'Search candidate, email, reference ID, skills...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        </div>

        {activeTab !== 'POSITIONS' && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {statuses.slice(0, 6).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  backgroundColor: statusFilter === st ? 'rgba(56, 189, 248, 0.2)' : 'rgba(6, 21, 43, 0.65)',
                  border: statusFilter === st ? '1px solid #38BDF8' : '1px solid rgba(22, 119, 255, 0.18)',
                  color: statusFilter === st ? '#38BDF8' : '#94A3B8',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── TAB 1: PARTNERSHIPS TABLE ── */}
      {activeTab === 'PARTNERSHIPS' && (
        <>
          {filteredPartnerships.length === 0 ? (
            <EmptyState
              icon="🤝"
              title="No enterprise partnership requests found"
              description="Incoming strategic and technology partnership proposals will appear here in real-time."
            />
          ) : (
            <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.8)', borderBottom: '1px solid rgba(22, 119, 255, 0.18)' }}>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Ref ID &amp; Sender</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Company &amp; Country</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Partnership Type</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartnerships.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/admin/careers-partnerships/partnership/${p.id}`)}
                        style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>{p.referenceId}</div>
                          <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.9rem', marginTop: '0.15rem' }}>{p.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{p.email}</div>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <div style={{ color: '#F8FAFC', fontWeight: 500 }}>{p.company || '-'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{p.country || 'Global'}</div>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <span style={{ backgroundColor: 'rgba(22, 119, 255, 0.12)', border: '1px solid rgba(22, 119, 255, 0.25)', padding: '0.2rem 0.55rem', borderRadius: 4, fontSize: '0.75rem', color: '#CBD5E1', fontFamily: 'var(--font-mono, monospace)' }}>
                            {p.partnershipType || 'Strategic'}
                          </span>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/admin/careers-partnerships/partnership/${p.id}`}
                              style={{ backgroundColor: 'rgba(22, 119, 255, 0.15)', border: '1px solid rgba(22, 119, 255, 0.35)', color: '#38BDF8', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                            >
                              Review
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete('PARTNERSHIP', p.id, p.referenceId)}
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '0.3rem 0.55rem', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: CAREER APPLICATIONS TABLE ── */}
      {activeTab === 'CAREERS' && (
        <>
          {filteredApplications.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No talent applications found"
              description="Submitted candidate CVs and applications from the public /careers page will appear here."
            />
          ) : (
            <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.8)', borderBottom: '1px solid rgba(22, 119, 255, 0.18)' }}>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Applicant &amp; Role</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Location &amp; Work Type</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Experience &amp; Skills</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>CV / Resume</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status &amp; Date</th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => router.push(`/admin/careers-partnerships/career/${a.id}`)}
                        style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {a.photoUrl ? (
                              <img
                                src={a.photoUrl}
                                alt={a.fullName}
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #38BDF8', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(22, 119, 255, 0.15)', border: '1px solid rgba(22, 119, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                                {a.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600 }}>{a.referenceId}</div>
                              <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.9rem', marginTop: '0.1rem' }}>{a.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{a.position}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <div style={{ color: '#F8FAFC', fontSize: '0.82rem' }}>{a.currentLocation || 'Not specified'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>{a.workType || 'Full Time'}</div>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <div style={{ color: '#F8FAFC', fontSize: '0.82rem' }}>{a.experienceLevel || 'Mid Level'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{a.skills || '-'}</div>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }} onClick={(e) => e.stopPropagation()}>
                          {a.resumeUrl ? (
                            <a
                              href={a.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#38BDF8', textDecoration: 'none', fontSize: '0.78rem', fontFamily: 'var(--font-mono, monospace)' }}
                            >
                              <span>📄 View Resume</span>
                              <span>↗</span>
                            </a>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>No link</span>
                          )}
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <StatusBadge status={a.status} />
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.45rem', fontFamily: 'var(--font-mono, monospace)' }}>
                            {new Date(a.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/admin/careers-partnerships/career/${a.id}`}
                              style={{ backgroundColor: 'rgba(22, 119, 255, 0.15)', border: '1px solid rgba(22, 119, 255, 0.35)', color: '#38BDF8', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                            >
                              Review
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete('CAREER', a.id, a.referenceId)}
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '0.3rem 0.55rem', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 3: OPEN POSITIONS (JOB CATALOG) ── */}
      {activeTab === 'POSITIONS' && (
        <>
          {isEditingPosition ? (
            <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.85)', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 12, padding: '1.5rem', maxWidth: '640px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#F8FAFC' }}>
                {editingPositionId ? 'Edit Open Position' : 'Create New Open Position'}
              </h2>

              <form onSubmit={handleSavePosition} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                    Position Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior AI Engineer"
                    value={positionForm.title}
                    onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, padding: '0.65rem 0.85rem', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                      Department / Orbit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AI Engineering"
                      value={positionForm.department}
                      onChange={(e) => setPositionForm({ ...positionForm, department: e.target.value })}
                      style={{ width: '100%', backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, padding: '0.65rem 0.85rem', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                      Work Type &amp; Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Full-time · Remote"
                      value={positionForm.workType}
                      onChange={(e) => setPositionForm({ ...positionForm, workType: e.target.value })}
                      style={{ width: '100%', backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, padding: '0.65rem 0.85rem', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                    Job Description (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Key responsibilities, technical requirements, and qualifications..."
                    value={positionForm.description}
                    onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, padding: '0.65rem 0.85rem', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={positionForm.isActive}
                    onChange={(e) => setPositionForm({ ...positionForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
                    Active &amp; Visible on Public /careers page
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPosition(false);
                      setEditingPositionId(null);
                    }}
                    style={{ backgroundColor: 'transparent', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#94A3B8', padding: '0.55rem 1.15rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#1677FF', color: '#FFFFFF', padding: '0.55rem 1.35rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)' }}
                  >
                    Save Position
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {filteredPositions.length === 0 ? (
                <EmptyState
                  icon="💼"
                  title="No job openings configured"
                  description="Add open roles here to automatically display them to candidates on the public /careers page."
                  action={
                    <button
                      type="button"
                      onClick={handleOpenNewPosition}
                      style={{ backgroundColor: '#1677FF', color: '#FFFFFF', padding: '0.5rem 1.15rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}
                    >
                      + Add First Position
                    </button>
                  }
                />
              ) : (
                <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.8)', borderBottom: '1px solid rgba(22, 119, 255, 0.18)' }}>
                          <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Position Title</th>
                          <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Department</th>
                          <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Work Type</th>
                          <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Visibility</th>
                          <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPositions.map((pos) => (
                          <tr key={pos.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                            <td style={{ padding: '0.95rem 1.15rem', fontWeight: 600, color: '#F8FAFC' }}>
                              {pos.title}
                            </td>
                            <td style={{ padding: '0.95rem 1.15rem', color: '#38BDF8' }}>
                              {pos.department}
                            </td>
                            <td style={{ padding: '0.95rem 1.15rem', color: '#94A3B8' }}>
                              {pos.workType}
                            </td>
                            <td style={{ padding: '0.95rem 1.15rem' }}>
                              <button
                                type="button"
                                onClick={() => handleTogglePositionActive(pos)}
                                style={{
                                  backgroundColor: pos.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                  border: pos.isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                                  color: pos.isActive ? '#34D399' : '#94A3B8',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-mono, monospace)',
                                }}
                              >
                                {pos.isActive ? '● LIVE / ACTIVE' : '○ DRAFT'}
                              </button>
                            </td>
                            <td style={{ padding: '0.95rem 1.15rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleEditPosition(pos)}
                                  style={{ backgroundColor: 'rgba(22, 119, 255, 0.15)', border: '1px solid rgba(22, 119, 255, 0.35)', color: '#38BDF8', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)' }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePosition(pos.id, pos.title)}
                                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '0.3rem 0.55rem', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
