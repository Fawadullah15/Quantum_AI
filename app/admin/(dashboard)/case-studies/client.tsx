'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import { createCaseStudy, updateCaseStudy, deleteCaseStudy } from './actions';
import type { CaseStudy } from '@prisma/client';

export default function CaseStudiesClient({ caseStudies: initialCaseStudies }: { caseStudies: CaseStudy[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(initialCaseStudies);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    client: '',
    industry: 'Artificial Intelligence',
    year: new Date().getFullYear(),
    services: '',
    technologies: '',
    heroImage: '',
    externalUrl: '',
    problem: '',
    solution: '',
    implementation: '',
    results: '',
    published: true,
    order: 0,
  });

  const handleCreate = () => {
    setFormData({
      title: '',
      slug: '',
      client: '',
      industry: 'Artificial Intelligence',
      year: new Date().getFullYear(),
      services: 'AI Engineering, Custom Software',
      technologies: 'Next.js, Python, TypeScript, PyTorch',
      heroImage: '',
      externalUrl: '',
      problem: '',
      solution: '',
      implementation: '',
      results: '',
      published: true,
      order: caseStudies.length + 1,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleEdit = (study: CaseStudy) => {
    setFormData({
      title: study.title || '',
      slug: study.slug || '',
      client: study.client || '',
      industry: study.industry || 'Artificial Intelligence',
      year: study.year || new Date().getFullYear(),
      services: study.services || '',
      technologies: study.technologies || '',
      heroImage: study.heroImage || '',
      externalUrl: study.externalUrl || '',
      problem: study.problem || '',
      solution: study.solution || '',
      implementation: study.implementation || '',
      results: study.results || '',
      published: study.published ?? true,
      order: study.order || 0,
    });
    setCurrentId(study.id);
    setIsEditing(true);
  };

  const handleTitleChange = (val: string) => {
    const autoSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !currentId ? autoSlug : prev.slug,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) throw new Error('Upload failed');

      const result = await res.json();
      if (result.url) {
        setFormData((prev) => ({ ...prev, heroImage: result.url }));
        toast.success('Hero image uploaded successfully!', 'Asset Ready');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload hero image.', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async (study: CaseStudy) => {
    const newStatus = !study.published;
    try {
      await updateCaseStudy(study.id, {
        ...study,
        published: newStatus,
      });
      setCaseStudies((prev) =>
        prev.map((s) => (s.id === study.id ? { ...s, published: newStatus } : s))
      );
      toast.success(
        `"${study.title}" is now ${newStatus ? 'Live on /work' : 'Hidden in Drafts'}`,
        'Visibility Updated'
      );
      router.refresh();
    } catch (err) {
      toast.error('Failed to update status.', 'Error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= caseStudies.length) return;

    const newStudies = [...caseStudies];
    const itemA = newStudies[index];
    const itemB = newStudies[targetIndex];

    const tempOrder = itemA.order;
    itemA.order = itemB.order;
    itemB.order = tempOrder;

    newStudies[index] = itemB;
    newStudies[targetIndex] = itemA;

    setCaseStudies(newStudies);

    try {
      await Promise.all([
        updateCaseStudy(itemA.id, { order: itemA.order }),
        updateCaseStudy(itemB.id, { order: itemB.order }),
      ]);
      toast.info('Case study order updated.', 'Reordered');
      router.refresh();
    } catch (err) {
      toast.error('Failed to save order.', 'Error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Case Study',
      message: `Are you sure you want to permanently delete "${title}"? This cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteCaseStudy(id);
        setCaseStudies((prev) => prev.filter((s) => s.id !== id));
        toast.success(`"${title}" was deleted.`, 'Deleted');
        router.refresh();
      } catch (err) {
        toast.error('Failed to delete case study.', 'Error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('Please enter a project title', 'Validation');
      return;
    }

    try {
      setIsSubmitting(true);
      if (currentId) {
        const updated = await updateCaseStudy(currentId, formData);
        setCaseStudies((prev) =>
          prev.map((s) => (s.id === currentId ? (updated as CaseStudy) : s))
        );
        toast.success(`Case study "${formData.title}" updated!`, 'Saved');
      } else {
        const created = await createCaseStudy(formData);
        setCaseStudies((prev) => [...prev, created as CaseStudy]);
        toast.success(`Case study "${formData.title}" created!`, 'Created');
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save case study', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract unique industries for filter dropdown
  const industries = Array.from(new Set(caseStudies.map((c) => c.industry).filter(Boolean)));

  const filteredCaseStudies = caseStudies.filter((study) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      study.title.toLowerCase().includes(q) ||
      study.client.toLowerCase().includes(q) ||
      study.industry.toLowerCase().includes(q) ||
      study.technologies.toLowerCase().includes(q) ||
      study.problem.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && study.published) ||
      (statusFilter === 'DRAFT' && !study.published);

    const matchesIndustry = industryFilter === 'ALL' || study.industry === industryFilter;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(22, 119, 255, 0.22)',
    borderRadius: 6,
    color: '#F8FAFC',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-mono, monospace)',
  };

  return (
    <div style={{ color: '#F8FAFC', width: '100%' }}>
      {!isEditing ? (
        <>
          {/* Top Control Bar */}
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
            {/* Search & Filter Controls */}
            <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '260px', maxWidth: '600px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search project title, client, tech stack, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

              {industries.length > 0 && (
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
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
                  <option value="ALL">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      backgroundColor: statusFilter === st ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                      border: statusFilter === st ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                      color: statusFilter === st ? '#FFFFFF' : '#94A3B8',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              style={{
                backgroundColor: '#1677FF',
                color: '#FFFFFF',
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
              }}
            >
              <span>+</span> NEW CASE STUDY
            </button>
          </div>

          {/* List View */}
          {filteredCaseStudies.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No works or case studies found"
              description={
                searchQuery || statusFilter !== 'ALL' || industryFilter !== 'ALL'
                  ? 'No projects match your active search and filter criteria.'
                  : 'Add completed portfolio deployments and case studies to feature them on the public /work page.'
              }
              action={
                <button
                  type="button"
                  onClick={handleCreate}
                  style={{
                    backgroundColor: '#1677FF',
                    color: '#FFFFFF',
                    padding: '0.5rem 1.15rem',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  + Add First Case Study
                </button>
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
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', width: '70px' }}>
                        Order
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Project Title &amp; Client
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Industry &amp; Year
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Tech Stack
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Live Status
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCaseStudies.map((study, index) => (
                      <tr key={study.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                        {/* Order Controls */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <button
                              type="button"
                              title="Move up"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, 'UP')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: index === 0 ? '#334155' : '#38BDF8',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                padding: 0,
                              }}
                            >
                              ▲
                            </button>
                            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#94A3B8', minWidth: '16px', textAlign: 'center' }}>
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              title="Move down"
                              disabled={index === filteredCaseStudies.length - 1}
                              onClick={() => handleMoveOrder(index, 'DOWN')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: index === filteredCaseStudies.length - 1 ? '#334155' : '#38BDF8',
                                cursor: index === filteredCaseStudies.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                padding: 0,
                              }}
                            >
                              ▼
                            </button>
                          </div>
                        </td>

                        {/* Title & Client */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            {study.heroImage ? (
                              <div
                                style={{
                                  width: '48px',
                                  height: '36px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                }}
                              >
                                <Image
                                  src={study.heroImage}
                                  alt={study.title}
                                  fill
                                  sizes="48px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '48px',
                                  height: '36px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(22, 119, 255, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1rem',
                                  flexShrink: 0,
                                }}
                              >
                                📁
                              </div>
                            )}

                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.92rem' }}>
                                {study.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{study.client}</span>
                                <span style={{ color: '#475569', fontSize: '0.7rem' }}>•</span>
                                <Link
                                  href={`/work/${study.slug}`}
                                  target="_blank"
                                  style={{ fontSize: '0.72rem', color: '#38BDF8', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                                >
                                  /work/{study.slug} ↗
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Industry & Year */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
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
                            {study.industry}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem', fontFamily: 'var(--font-mono, monospace)' }}>
                            Year: {study.year}
                          </div>
                        </td>

                        {/* Tech Stack */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', maxWidth: '220px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#38BDF8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono, monospace)' }}>
                            {study.technologies || '-'}
                          </div>
                        </td>

                        {/* Published Status Toggle */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(study)}
                            style={{
                              backgroundColor: study.published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                              border: study.published ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                              color: study.published ? '#34D399' : '#94A3B8',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-mono, monospace)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: study.published ? '#34D399' : '#94A3B8',
                              }}
                            />
                            {study.published ? 'LIVE / PUBLISHED' : 'DRAFT (HIDDEN)'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(study)}
                              style={{
                                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                                border: '1px solid rgba(22, 119, 255, 0.35)',
                                color: '#38BDF8',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(study.id, study.title)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#F87171',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
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
      ) : (
        /* Create & Edit Modal Form */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.85)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '840px',
            margin: '0 auto',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                {currentId ? `Edit Work: ${formData.title}` : 'Create New Work / Case Study'}
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Fill out the project architecture, client problem, technical solution, and deployment results.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Section 1: Overview */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                1. Overview &amp; Client Identity
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autonomous School Operations Manager"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>URL Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. autonomous-school-operations-manager"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Client / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EduSphere Global"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Industry / Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Education, Fintech, HealthTech"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Deployment Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Live Project URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://edusphere.io"
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Media & Tech Stack */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                2. Imagery &amp; Technology Stack
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Technologies Used (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, Python, PostgreSQL, PyTorch"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Services Delivered (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Engineering, Systems Architecture"
                    value={formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Hero Cover Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '90px',
                      height: '60px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {formData.heroImage ? (
                      <Image
                        src={formData.heroImage}
                        alt="Hero preview"
                        fill
                        sizes="90px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.25rem', color: '#64748B' }}>🖼️</span>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.35)',
                          color: '#38BDF8',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {isUploading ? 'Uploading...' : '📁 Upload Hero Image'}
                      </button>
                      {formData.heroImage && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImage: '' })}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#F87171',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste direct image URL (e.g. /images/work/project.jpg)"
                      value={formData.heroImage}
                      onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                      style={{ ...inputStyle, fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Deep Technical Narrative */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                3. Technical Narrative &amp; Outcomes
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={labelStyle}>Problem / Operational Challenge *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the institutional challenges, bottlenecks, or scale constraints faced by the client..."
                    value={formData.problem}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Engineered Solution &amp; AI Architecture *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detail the technical systems, algorithms, models, and infrastructure built by Quantum AI..."
                    value={formData.solution}
                    onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Implementation &amp; Deployment Process</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the rollout phases, testing, pipelines, and security compliance..."
                    value={formData.implementation}
                    onChange={(e) => setFormData({ ...formData, implementation: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Results, Metrics &amp; Impact</label>
                  <textarea
                    rows={2}
                    placeholder="Summarize quantifiable performance gains, throughput improvements, and business outcomes..."
                    value={formData.results}
                    onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Publish Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="studyPublished"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <label htmlFor="studyPublished" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
                Publish immediately to the public Works showcase (<span style={{ color: '#38BDF8' }}>/work</span> and <span style={{ color: '#38BDF8' }}>/work/[slug]</span>)
              </label>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.45rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                {isSubmitting ? 'Saving...' : currentId ? 'Save Changes' : 'Create Case Study'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
