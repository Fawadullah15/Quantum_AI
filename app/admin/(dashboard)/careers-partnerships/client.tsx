'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateSubmissionStatus, deleteSubmission } from './actions';

interface Props {
  partnerships: any[];
  applications: any[];
  metrics: {
    totalSubmissions: number;
    newApplications: number;
    underReview: number;
    partnershipCount: number;
    recentlyContacted: number;
  };
}

export default function CareersPartnershipsClient({ partnerships: initialPartnerships, applications: initialApps, metrics }: Props) {
  const [activeTab, setActiveTab] = useState<'PARTNERSHIPS' | 'CAREERS'>('PARTNERSHIPS');
  const [partnerships, setPartnerships] = useState(initialPartnerships);
  const [applications, setApplications] = useState(initialApps);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const statuses = [
    'ALL', 'NEW', 'REVIEWING', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'CLOSED'
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
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (type: 'PARTNERSHIP' | 'CAREER', id: string, refId: string) => {
    if (confirm(`Are you sure you want to delete submission ${refId}? This cannot be undone.`)) {
      setActionLoading(id);
      try {
        await deleteSubmission(type, id);
        if (type === 'PARTNERSHIP') {
          setPartnerships((prev) => prev.filter((p) => p.id !== id));
        } else {
          setApplications((prev) => prev.filter((a) => a.id !== id));
        }
      } catch (err: any) {
        alert(err?.message || 'Failed to delete submission');
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Filtered Partnership list
  const filteredPartnerships = partnerships.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Applications list
  const filteredApplications = applications.filter((a) => {
    const matchesSearch =
      searchTerm === '' ||
      a.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.skills?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ color: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          Careers & Business Partnerships
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
          Manage incoming enterprise partnership proposals, talent applications, CV reviews, and candidate workflows.
        </p>
      </div>

      {/* ─── Metric Summary Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <MetricCard label="New Applications" value={metrics.newApplications} color="#38BDF8" />
        <MetricCard label="Under Review / Interview" value={metrics.underReview} color="#FBBF24" />
        <MetricCard label="Partnership Requests" value={metrics.partnershipCount} color="#A78BFA" />
        <MetricCard label="Recently Contacted" value={metrics.recentlyContacted} color="#34D399" />
        <MetricCard label="Total Submissions" value={metrics.totalSubmissions} color="#F8FAFC" />
      </div>

      {/* ─── Tabs & Controls ─── */}
      <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Tabs */}
          <div style={{ display: 'inline-flex', backgroundColor: '#0F172A', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
            <button
              onClick={() => setActiveTab('PARTNERSHIPS')}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: activeTab === 'PARTNERSHIPS' ? '#1677FF' : 'transparent',
                color: activeTab === 'PARTNERSHIPS' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Partnership Requests ({partnerships.length})
            </button>
            <button
              onClick={() => setActiveTab('CAREERS')}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: activeTab === 'CAREERS' ? '#1677FF' : 'transparent',
                color: activeTab === 'CAREERS' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Career Applications ({applications.length})
            </button>
          </div>

          {/* Search & Status Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexGrow: 1, maxWidth: '520px' }}>
            <input
              type="text"
              placeholder="Search by name, email, ref ID, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '0.5rem 0.85rem',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.8125rem',
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.8125rem',
              }}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Table Views ─── */}
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'PARTNERSHIPS' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Ref ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Name & Company</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Partnership Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartnerships.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                      No partnership requests found.
                    </td>
                  </tr>
                ) : (
                  filteredPartnerships.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#38BDF8', fontWeight: 600 }}>
                        {item.referenceId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.fullName}</div>
                        <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                          {item.company || item.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#1E293B', borderRadius: '4px', fontSize: '0.75rem', color: '#A78BFA' }}>
                          {item.partnershipType}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#CBD5E1' }}>
                        {item.subject}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <select
                          value={item.status}
                          disabled={actionLoading === item.id}
                          onChange={(e) => handleStatusChange('PARTNERSHIP', item.id, e.target.value)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: getStatusColorBg(item.status),
                            color: getStatusColor(item.status),
                            border: '1px solid currentColor',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {statuses.filter((s) => s !== 'ALL').map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Link
                            href={`/admin/careers-partnerships/partnership/${item.id}`}
                            style={{ padding: '0.25rem 0.6rem', backgroundColor: '#1E293B', color: '#38BDF8', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500 }}
                          >
                            Review ↗
                          </Link>
                          <button
                            onClick={() => handleDelete('PARTNERSHIP', item.id, item.referenceId)}
                            disabled={actionLoading === item.id}
                            style={{ background: 'transparent', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Ref ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Candidate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Position</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Experience</th>
                  <th style={{ padding: '0.75rem 1rem' }}>CV / Resume</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                      No career applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#38BDF8', fontWeight: 600 }}>
                        {item.referenceId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.fullName}</div>
                        <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{item.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ color: '#F8FAFC', fontWeight: 500 }}>{item.position}</div>
                        <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{item.workType}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#1E293B', borderRadius: '4px', fontSize: '0.75rem', color: '#38BDF8' }}>
                          {item.experienceLevel}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {item.resumeUrl ? (
                          <a
                            href={item.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#34D399', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            View CV ↗
                          </a>
                        ) : (
                          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <select
                          value={item.status}
                          disabled={actionLoading === item.id}
                          onChange={(e) => handleStatusChange('CAREER', item.id, e.target.value)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: getStatusColorBg(item.status),
                            color: getStatusColor(item.status),
                            border: '1px solid currentColor',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {statuses.filter((s) => s !== 'ALL').map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Link
                            href={`/admin/careers-partnerships/career/${item.id}`}
                            style={{ padding: '0.25rem 0.6rem', backgroundColor: '#1E293B', color: '#38BDF8', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500 }}
                          >
                            Review ↗
                          </Link>
                          <button
                            onClick={() => handleDelete('CAREER', item.id, item.referenceId)}
                            disabled={actionLoading === item.id}
                            style={{ background: 'transparent', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'NEW': return '#38BDF8';
    case 'REVIEWING': return '#FBBF24';
    case 'SHORTLISTED': return '#A78BFA';
    case 'CONTACTED': return '#34D399';
    case 'INTERVIEW': return '#EC4899';
    case 'ACCEPTED': return '#10B981';
    case 'REJECTED': return '#EF4444';
    case 'CLOSED': return '#64748B';
    default: return '#94A3B8';
  }
}

function getStatusColorBg(status: string) {
  switch (status) {
    case 'NEW': return 'rgba(56, 189, 248, 0.15)';
    case 'REVIEWING': return 'rgba(251, 191, 36, 0.15)';
    case 'SHORTLISTED': return 'rgba(167, 139, 250, 0.15)';
    case 'CONTACTED': return 'rgba(52, 211, 153, 0.15)';
    case 'INTERVIEW': return 'rgba(236, 72, 153, 0.15)';
    case 'ACCEPTED': return 'rgba(16, 185, 129, 0.15)';
    case 'REJECTED': return 'rgba(239, 68, 68, 0.15)';
    case 'CLOSED': return 'rgba(100, 116, 139, 0.15)';
    default: return '#1E293B';
  }
}
