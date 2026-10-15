'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import {
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  togglePublishCaseStudy,
  toggleFeaturedCaseStudy,
} from './actions';
import type { CaseStudy } from '@prisma/client';
import { COPILOT_CASE_STUDY } from '@/lib/default-projects';

export default function CaseStudiesClient({
  caseStudies: initialCaseStudies,
}: {
  caseStudies: CaseStudy[];
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [caseStudies, setCaseStudies] = useState<any[]>(() => {
    const list = Array.isArray(initialCaseStudies) ? initialCaseStudies : [];
    if (list.some((s) => s.slug === 'mechanical-engineering-design-copilot')) {
      return list;
    }
    return [COPILOT_CASE_STUDY, ...list];
  });

  useEffect(() => {
    if (Array.isArray(initialCaseStudies)) {
      if (initialCaseStudies.some((s) => s.slug === 'mechanical-engineering-design-copilot')) {
        setCaseStudies(initialCaseStudies);
      } else {
        setCaseStudies([COPILOT_CASE_STUDY, ...initialCaseStudies]);
      }
    }
  }, [initialCaseStudies]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [manualGalleryUrl, setManualGalleryUrl] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<'ALL' | 'FEATURED'>('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    client: 'Quantum AI',
    industry: 'AI Engineering Software',
    year: new Date().getFullYear(),
    services: 'AI Engineering, Product Development',
    technologies: 'Artificial Intelligence, Mechanical Engineering, Engineering Design, Calculations, Machine Learning',
    heroImage: '',
    gallery: [] as string[],
    externalUrl: '',
    problem: '',
    fullDescription: '',
    solution: '',
    implementation: '',
    results: '',
    published: true,
    featured: false,
    status: 'Prototype in Development',
    primaryCtaLabel: 'Explore the Project',
    primaryCtaUrl: '',
    secondaryCtaLabel: 'Contact Quantum AI',
    secondaryCtaUrl: '/contact',
    seoTitle: '',
    seoDescription: '',
    order: 0,
  });

  const handleCreate = () => {
    setFormData({
      title: '',
      slug: '',
      client: 'Quantum AI',
      industry: 'AI Engineering Software',
      year: new Date().getFullYear(),
      services: 'AI Engineering, Product Development',
      technologies: 'Artificial Intelligence, Mechanical Engineering, Engineering Design, Calculations, Machine Learning',
      heroImage: '',
      gallery: [],
      externalUrl: '',
      problem: '',
      fullDescription: '',
      solution: '',
      implementation: '',
      results: '',
      published: true,
      featured: false,
      status: 'Prototype in Development',
      primaryCtaLabel: 'Explore the Project',
      primaryCtaUrl: '',
      secondaryCtaLabel: 'Contact Quantum AI',
      secondaryCtaUrl: '/contact',
      seoTitle: '',
      seoDescription: '',
      order: caseStudies.length + 1,
    });
    setManualGalleryUrl('');
    setCurrentId(null);
    setIsEditing(true);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === '1' || params.get('create') === '1') {
        handleCreate();
      }
    }
  }, []);

  const handleEdit = (study: any) => {
    let initialGallery: string[] = [];
    if (study.gallery) {
      try {
        const parsed = typeof study.gallery === 'string' ? JSON.parse(study.gallery) : study.gallery;
        if (Array.isArray(parsed)) {
          initialGallery = parsed.filter(
            (item: any): item is string => typeof item === 'string' && item.trim().length > 0
          );
        }
      } catch (err) {
        console.warn('Failed to parse study gallery JSON:', err);
      }
    }

    setFormData({
      title: study.title || '',
      slug: study.slug || '',
      client: study.client || 'Quantum AI',
      industry: study.industry || 'AI Engineering Software',
      year: study.year || new Date().getFullYear(),
      services: study.services || '',
      technologies: study.technologies || '',
      heroImage: study.heroImage || '',
      gallery: initialGallery,
      externalUrl: study.externalUrl || '',
      problem: study.problem || '',
      fullDescription: study.fullDescription || '',
      solution: study.solution || '',
      implementation: study.implementation || '',
      results: study.results || '',
      published: study.published ?? true,
      featured: study.featured ?? false,
      status: study.status || 'Completed',
      primaryCtaLabel: study.primaryCtaLabel || 'Explore the Project',
      primaryCtaUrl: study.primaryCtaUrl || '',
      secondaryCtaLabel: study.secondaryCtaLabel || 'Contact Quantum AI',
      secondaryCtaUrl: study.secondaryCtaUrl || '/contact',
      seoTitle: study.seoTitle || '',
      seoDescription: study.seoDescription || '',
      order: study.order || 0,
    });
    setManualGalleryUrl('');
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
        toast.success('Cover image uploaded successfully!', 'Asset Ready');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload cover image.', 'Upload Error');
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingGallery(true);
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('file', file);

        const res = await fetch('/api/media', {
          method: 'POST',
          body: data,
        });

        if (!res.ok) {
          throw new Error(`Failed to upload "${file.name}"`);
        }

        const result = await res.json();
        if (result.url) {
          newUrls.push(result.url);
        }
      }

      if (newUrls.length > 0) {
        setFormData((prev) => {
          const combined = [...prev.gallery, ...newUrls];
          const unique = Array.from(new Set(combined));
          return { ...prev, gallery: unique };
        });
        toast.success(
          `${newUrls.length} screenshot${newUrls.length > 1 ? 's' : ''} uploaded!`,
          'Gallery Ready'
        );
      }
    } catch (err: any) {
      console.error('Gallery upload error:', err);
      toast.error(err?.message || 'Failed to upload gallery image.', 'Upload Error');
    } finally {
      setIsUploadingGallery(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleAddManualGalleryUrl = () => {
    const url = manualGalleryUrl.trim();
    if (!url) {
      toast.warning('Please enter an image URL', 'Validation');
      return;
    }
    if (formData.gallery.includes(url)) {
      toast.warning('This image URL is already in the gallery', 'Duplicate');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      gallery: [...prev.gallery, url],
    }));
    setManualGalleryUrl('');
    toast.success('Image added to gallery', 'Added');
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleMoveGalleryImage = (index: number, direction: 'LEFT' | 'RIGHT') => {
    const targetIndex = direction === 'LEFT' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.gallery.length) return;

    setFormData((prev) => {
      const newGallery = [...prev.gallery];
      const temp = newGallery[index];
      newGallery[index] = newGallery[targetIndex];
      newGallery[targetIndex] = temp;
      return { ...prev, gallery: newGallery };
    });
  };

  const handleTogglePublish = async (study: any) => {
    const nextState = !study.published;
    setCaseStudies((prev) =>
      prev.map((s) => (s.id === study.id ? { ...s, published: nextState } : s))
    );
    try {
      await togglePublishCaseStudy(study.id, nextState);
      toast.success(
        `"${study.title}" is now ${nextState ? 'LIVE on /work' : 'HIDDEN in Drafts'}`,
        'Visibility Updated'
      );
      router.refresh();
    } catch (err) {
      setCaseStudies((prev) =>
        prev.map((s) => (s.id === study.id ? { ...s, published: study.published } : s))
      );
      toast.error('Failed to update publication status.', 'Error');
    }
  };

  const handleToggleFeatured = async (study: any) => {
    const nextState = !study.featured;
    setCaseStudies((prev) =>
      prev.map((s) => (s.id === study.id ? { ...s, featured: nextState } : s))
    );
    try {
      await toggleFeaturedCaseStudy(study.id, nextState);
      toast.success(
        `"${study.title}" is now ${nextState ? 'FEATURED on /work' : 'UNFEATURED'}`,
        'Featured Updated'
      );
      router.refresh();
    } catch (err) {
      setCaseStudies((prev) =>
        prev.map((s) => (s.id === study.id ? { ...s, featured: study.featured } : s))
      );
      toast.error('Failed to update featured status.', 'Error');
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
      toast.info('Project display order updated.', 'Reordered');
      router.refresh();
    } catch (err) {
      toast.error('Failed to save display order.', 'Error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Move this project to Recently Deleted?',
      message: `Move "${title}" to Recently Deleted? It will be hidden from the public website and can be restored at any time.`,
      confirmText: 'Move to Recently Deleted',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteCaseStudy(id);
        setCaseStudies((prev) => prev.filter((s) => s.id !== id));
        toast.success(`"${title}" was moved to Recently Deleted.`, 'Moved to Bin');
        router.refresh();
      } catch (err) {
        toast.error('Failed to delete project.', 'Error');
      }
    }
  };

  const handleSubmitWithPublication = async (e: React.FormEvent, forcePublish?: boolean) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('Please enter a project title', 'Validation');
      return;
    }

    const payload = {
      ...formData,
      ...(forcePublish !== undefined ? { published: forcePublish } : {}),
    };

    try {
      setIsSubmitting(true);
      if (currentId) {
        const updated = await updateCaseStudy(currentId, payload);
        setCaseStudies((prev) =>
          prev.map((s) => (s.id === currentId ? (updated as any) : s))
        );
        toast.success(
          `Project "${formData.title}" updated successfully!`,
          'Changes Saved'
        );
      } else {
        const created = await createCaseStudy(payload);
        setCaseStudies((prev) => [...prev, created as any]);
        toast.success(
          `Project "${formData.title}" published successfully!`,
          'Project Created'
        );
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save project', 'Error');
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
      (study.client || '').toLowerCase().includes(q) ||
      (study.industry || '').toLowerCase().includes(q) ||
      (study.technologies || '').toLowerCase().includes(q) ||
      (study.status || '').toLowerCase().includes(q) ||
      (study.problem || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && study.published) ||
      (statusFilter === 'DRAFT' && !study.published);

    const matchesFeatured =
      featuredFilter === 'ALL' ||
      (featuredFilter === 'FEATURED' && study.featured);

    const matchesIndustry = industryFilter === 'ALL' || study.industry === industryFilter;

    return matchesSearch && matchesStatus && matchesFeatured && matchesIndustry;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(22, 119, 255, 0.22)',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-d-din, sans-serif)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#FFFFFF',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-mono, monospace)',
  };

  return (
    <div style={{ color: '#FFFFFF', width: '100%' }}>
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
            <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '260px', maxWidth: '750px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder="Search project title, owner, category, tech stack, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070B14',
                    border: '1px solid rgba(22, 119, 255, 0.25)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.95rem',
                    fontSize: '0.85rem',
                    color: '#FFFFFF',
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
                    color: '#FFFFFF',
                    outline: 'none',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      backgroundColor: statusFilter === st ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                      border: statusFilter === st ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                      color: '#FFFFFF',
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

              {/* Featured Filter */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setFeaturedFilter(featuredFilter === 'FEATURED' ? 'ALL' : 'FEATURED')}
                  style={{
                    backgroundColor: featuredFilter === 'FEATURED' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(6, 21, 43, 0.65)',
                    border: featuredFilter === 'FEATURED' ? '1px solid #38BDF8' : '1px solid rgba(22, 119, 255, 0.18)',
                    color: featuredFilter === 'FEATURED' ? '#38BDF8' : '#FFFFFF',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  ★ FEATURED
                </button>
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
              <span>+</span> ADD NEW PROJECT
            </button>
          </div>

          {/* List View */}
          {filteredCaseStudies.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects or case studies found"
              description={
                searchQuery || statusFilter !== 'ALL' || industryFilter !== 'ALL' || featuredFilter !== 'ALL'
                  ? 'No projects match your active search and filter criteria.'
                  : 'Add engineering prototypes, software products, or client case studies to feature them on the public /work page.'
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
                  + Add First Project
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
                      <th style={{ padding: '0.85rem 1.15rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', width: '60px' }}>
                        Order
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Project Title &amp; Owner
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Category &amp; Status
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'center' }}>
                        Featured
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Live Status
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Updated
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCaseStudies.map((study, index) => {
                      const statusUpper = (study.status || 'COMPLETED').toUpperCase();
                      let statusBg = 'rgba(56, 189, 248, 0.12)';
                      let statusBorder = 'rgba(56, 189, 248, 0.3)';
                      let statusColor = '#38BDF8';

                      if (statusUpper.includes('PROTOTYPE')) {
                        statusBg = 'rgba(167, 139, 250, 0.15)';
                        statusBorder = 'rgba(167, 139, 250, 0.35)';
                        statusColor = '#C4B5FD';
                      } else if (statusUpper.includes('DEV') || statusUpper.includes('IN_DEVELOPMENT')) {
                        statusBg = 'rgba(251, 191, 36, 0.12)';
                        statusBorder = 'rgba(251, 191, 36, 0.3)';
                        statusColor = '#FCD34D';
                      } else if (statusUpper.includes('LIVE') || statusUpper.includes('COMPLETED')) {
                        statusBg = 'rgba(16, 185, 129, 0.12)';
                        statusBorder = 'rgba(16, 185, 129, 0.3)';
                        statusColor = '#34D399';
                      }

                      return (
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
                              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#FFFFFF', minWidth: '16px', textAlign: 'center' }}>
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

                          {/* Title & Owner */}
                          <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              {study.heroImage ? (
                                <div
                                  style={{
                                    width: '52px',
                                    height: '38px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                  }}
                                >
                                  <Image
                                    src={study.heroImage}
                                    alt={study.title}
                                    fill
                                    sizes="52px"
                                    style={{ objectFit: 'cover' }}
                                    unoptimized={true}
                                  />
                                </div>
                              ) : (
                                <div
                                  style={{
                                    width: '52px',
                                    height: '38px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(22, 119, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    flexShrink: 0,
                                    border: '1px solid rgba(22, 119, 255, 0.2)',
                                  }}
                                >
                                  📁
                                </div>
                              )}

                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.92rem' }}>
                                  {study.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{study.client || 'Quantum AI'}</span>
                                  <span style={{ color: '#475569', fontSize: '0.7rem' }}>•</span>
                                  <Link
                                    href={`/work/${study.slug}`}
                                    target="_blank"
                                    style={{ fontSize: '0.72rem', color: '#38BDF8', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                                  >
                                    /work/{study.slug} ↗
                                  </Link>
                                  {(() => {
                                    try {
                                      const parsed = typeof study.gallery === 'string' ? JSON.parse(study.gallery) : study.gallery;
                                      if (Array.isArray(parsed) && parsed.length > 0) {
                                        return (
                                          <span
                                            style={{
                                              backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                              color: '#38BDF8',
                                              fontSize: '0.68rem',
                                              fontFamily: 'var(--font-mono, monospace)',
                                              padding: '1px 6px',
                                              borderRadius: '4px',
                                              border: '1px solid rgba(56, 189, 248, 0.25)',
                                            }}
                                          >
                                            {parsed.length} img{parsed.length > 1 ? 's' : ''}
                                          </span>
                                        );
                                      }
                                    } catch {
                                      return null;
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Status */}
                          <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                              <span
                                style={{
                                  backgroundColor: 'rgba(22, 119, 255, 0.12)',
                                  border: '1px solid rgba(22, 119, 255, 0.25)',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  color: '#FFFFFF',
                                  fontFamily: 'var(--font-mono, monospace)',
                                }}
                              >
                                {study.industry}
                              </span>
                              <span
                                style={{
                                  backgroundColor: statusBg,
                                  border: `1px solid ${statusBorder}`,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  color: statusColor,
                                  fontFamily: 'var(--font-mono, monospace)',
                                  fontWeight: 600,
                                }}
                              >
                                {study.status || 'Completed'}
                              </span>
                            </div>
                          </td>

                          {/* Featured Toggle */}
                          <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(study)}
                              title={study.featured ? 'Click to unfeature' : 'Click to feature on /work'}
                              style={{
                                backgroundColor: study.featured ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                border: study.featured ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(148, 163, 184, 0.25)',
                                color: study.featured ? '#38BDF8' : '#64748B',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
                            >
                              {study.featured ? '★ FEATURED' : '☆ Standard'}
                            </button>
                          </td>

                          {/* Live Status Toggle */}
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

                          {/* Updated Date */}
                          <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap' }}>
                            {study.updatedAt
                              ? new Date(study.updatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                              <Link
                                href={`/work/${study.slug}`}
                                target="_blank"
                                style={{
                                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  color: '#38BDF8',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  fontFamily: 'var(--font-mono, monospace)',
                                }}
                              >
                                Preview ↗
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleEdit(study)}
                                style={{
                                  backgroundColor: 'rgba(22, 119, 255, 0.15)',
                                  border: '1px solid rgba(22, 119, 255, 0.35)',
                                  color: '#FFFFFF',
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
                                  backgroundColor: 'transparent',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
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
                      );
                    })}
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
            backgroundColor: 'rgba(6, 21, 43, 0.92)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '920px',
            margin: '0 auto',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                {currentId ? `Edit Project: ${formData.title}` : 'Add New Project'}
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Configure project specifications, architecture, calculations, and public visibility on Quantum AI.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '1.25rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={(e) => handleSubmitWithPublication(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Section 1: Identity & Classification */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
                1. Project Identity &amp; Classification
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mechanical Engineering Design Copilot"
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
                    placeholder="e.g. mechanical-engineering-design-copilot"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Project Owner / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quantum AI"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Category / Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Product / Engineering Software"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Project Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono, monospace)' }}
                  >
                    <option value="Prototype in Development">Prototype in Development</option>
                    <option value="In Development">In Development</option>
                    <option value="Completed">Completed</option>
                    <option value="Beta">Beta</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Deployment / Release Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={labelStyle}>Primary Tags &amp; Technologies (comma separated) *</label>
                  <input
                    type="text"
                    placeholder="e.g. Artificial Intelligence, Mechanical Engineering, Engineering Design, Calculations, Machine Learning"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Services &amp; Capabilities (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Engineering, Product Development, Mechanical Design, Calculations"
                    value={formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Visuals & Media */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
                2. Imagery &amp; Visual Assets
              </div>

              <div>
                <label style={labelStyle}>Cover Image (Hero Workspace Visual)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100px',
                      height: '65px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
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
                        sizes="100px"
                        style={{ objectFit: 'cover' }}
                        unoptimized={true}
                      />
                    ) : (
                      <span style={{ fontSize: '1.25rem', color: '#94A3B8' }}>🖼️</span>
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
                          color: '#FFFFFF',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {isUploading ? 'Uploading...' : '📁 Upload Cover Image'}
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
                      placeholder="Or paste direct image URL (e.g. /uploads/mechanical-engineering-design-copilot.png)"
                      value={formData.heroImage}
                      onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                      style={{ ...inputStyle, fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Component */}
              <div
                style={{
                  marginTop: '1.25rem',
                  backgroundColor: 'rgba(3, 10, 24, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                      Additional Screenshots &amp; Technical Drawings
                    </div>
                    <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1px 8px', borderRadius: '12px', fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'var(--font-mono, monospace)' }}>
                      {formData.gallery.length} visual{formData.gallery.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {formData.gallery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, gallery: [] }))}
                      style={{ backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#F87171', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)' }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Upload & Add Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0.75rem 0' }}>
                  <input
                    type="file"
                    ref={galleryFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={isUploadingGallery}
                      onClick={() => galleryFileInputRef.current?.click()}
                      style={{
                        backgroundColor: '#1677FF',
                        border: '1px solid #1677FF',
                        color: '#FFFFFF',
                        padding: '0.45rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: isUploadingGallery ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      <span>📁</span> {isUploadingGallery ? 'Uploading images...' : 'Upload Screenshots (Select Multiple)'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Or paste screenshot URL (e.g. /uploads/cad-schematic.png or https://...)"
                      value={manualGalleryUrl}
                      onChange={(e) => setManualGalleryUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualGalleryUrl();
                        }
                      }}
                      style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.5rem 0.75rem', flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddManualGalleryUrl}
                      style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38BDF8',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      + Add URL
                    </button>
                  </div>
                </div>

                {/* Previews Grid */}
                {formData.gallery.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {formData.gallery.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', backgroundColor: '#020714' }}>
                          <Image src={url} alt={`Screenshot ${idx + 1}`} fill sizes="130px" style={{ objectFit: 'cover' }} unoptimized={true} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', backgroundColor: 'rgba(7, 11, 20, 0.98)' }}>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            <button type="button" disabled={idx === 0} onClick={() => handleMoveGalleryImage(idx, 'LEFT')} style={{ background: 'transparent', border: 'none', color: idx === 0 ? '#334155' : '#38BDF8', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>◀</button>
                            <button type="button" disabled={idx === formData.gallery.length - 1} onClick={() => handleMoveGalleryImage(idx, 'RIGHT')} style={{ background: 'transparent', border: 'none', color: idx === formData.gallery.length - 1 ? '#334155' : '#38BDF8', cursor: idx === formData.gallery.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>▶</button>
                          </div>
                          <button type="button" onClick={() => handleRemoveGalleryImage(idx)} style={{ background: 'transparent', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Descriptions & Full Engineering Narrative */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
                3. Project Descriptions &amp; Technical Narrative
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Short Description * (Overview summary shown on project cards &amp; meta)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="An AI assisted engineering design system intended to help mechanical engineers solve design problems, perform engineering calculations, evaluate components, and make informed technical decisions."
                    value={formData.problem}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Full Project Description (Headings, Markdown, Calculations &amp; Use Cases)</label>
                  <textarea
                    rows={8}
                    placeholder="Overview, Problem, Solution, Planned Capabilities, Example Calculations, and Engineering Workflow..."
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace', fontSize: '0.82rem' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                    Tip: Supports markdown headings (##, ###), bullet lists (- or 1.), bold text (**), equations, and parameter breakdowns.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Engineered Solution &amp; AI Architecture</label>
                    <textarea
                      rows={3}
                      placeholder="Detail the technical systems, algorithms, models, and reasoning tools built by Quantum AI..."
                      value={formData.solution}
                      onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Implementation &amp; Workflow Integration</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the iterative prototyping, validation logic, equations, and software interface..."
                      value={formData.implementation}
                      onChange={(e) => setFormData({ ...formData, implementation: e.target.value })}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Results, Impact &amp; Technical Outcomes</label>
                  <textarea
                    rows={2}
                    placeholder="Describe design clarity, structured calculations, safety evaluation outcomes, or metrics..."
                    value={formData.results}
                    onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Calls to Action & Navigation */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
                4. Calls to Action &amp; Navigation Links
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Primary CTA Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Explore the Project"
                    value={formData.primaryCtaLabel}
                    onChange={(e) => setFormData({ ...formData, primaryCtaLabel: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Primary CTA Destination URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /work/mechanical-engineering-design-copilot"
                    value={formData.primaryCtaUrl}
                    onChange={(e) => setFormData({ ...formData, primaryCtaUrl: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Secondary CTA Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Contact Quantum AI"
                    value={formData.secondaryCtaLabel}
                    onChange={(e) => setFormData({ ...formData, secondaryCtaLabel: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Secondary CTA Destination URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /contact"
                    value={formData.secondaryCtaUrl}
                    onChange={(e) => setFormData({ ...formData, secondaryCtaUrl: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.85rem' }}>
                <label style={labelStyle}>Live Demo / External URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://copilot.quantumai.tech"
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Section 5: SEO Metadata */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
                5. Search Engine Optimization (SEO)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>SEO Title</label>
                  <input
                    type="text"
                    placeholder="Mechanical Engineering Design Copilot | Quantum AI"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>SEO Description</label>
                  <input
                    type="text"
                    placeholder="Learn about Quantum AI's AI assisted mechanical engineering design copilot..."
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Visibility & Publishing */}
            <div style={{ backgroundColor: 'rgba(3, 10, 24, 0.65)', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
                6. Visibility &amp; Publication Workflow
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    id="projectFeatured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="projectFeatured" style={{ fontSize: '0.85rem', color: '#FFFFFF', cursor: 'pointer' }}>
                    <strong>Feature this project prominently</strong> on the public Work showcase (★ Featured badge)
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    id="projectPublished"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="projectPublished" style={{ fontSize: '0.85rem', color: '#FFFFFF', cursor: 'pointer' }}>
                    <strong>Publish immediately to the public website</strong> (Visible at <span style={{ color: '#38BDF8' }}>/work</span> and <span style={{ color: '#38BDF8' }}>/work/[slug]</span>)
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem', flexWrap: 'wrap' }}>
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
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmitWithPublication(e, false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmitWithPublication(e, true)}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.65rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                {isSubmitting ? 'Saving...' : currentId ? 'Save & Publish' : 'Publish Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
