'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import MediaLibrary from '@/components/admin/MediaLibrary';
import { CampaignDisplay } from '@/components/public/CampaignDisplay';
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  togglePublishCampaign,
  duplicateCampaign,
  type CampaignInput,
} from './actions';
import type {
  CampaignType,
  CampaignStatus,
  RepeatPolicy,
  DisplayPosition,
  PublicCampaign,
} from '@/lib/campaigns';

interface CampaignsClientProps {
  initialCampaigns: any[];
  initialStats: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
    disabled: number;
    expired: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: string;
  };
}

const CAMPAIGN_TYPES: { id: CampaignType; label: string; icon: string; desc: string }[] = [
  {
    id: 'IMAGE_POPUP',
    label: 'Image Advertisement Popup',
    icon: '🖼️',
    desc: 'Promotional visual creative with headline, description, and call to action button.',
  },
  {
    id: 'ANNOUNCEMENT_POPUP',
    label: 'Announcement Popup',
    icon: '📢',
    desc: 'Clean typography-driven announcement with badge, message, and action link.',
  },
  {
    id: 'COMPACT_NOTIFICATION',
    label: 'Compact Notification',
    icon: '🔔',
    desc: 'Sleek floating notification pill near top of screen with minimal footprint.',
  },
  {
    id: 'PROMOTIONAL_BANNER',
    label: 'Promotional Banner',
    icon: '📣',
    desc: 'Full-width horizontal announcement bar fixed at the top of the website.',
  },
  {
    id: 'IMAGE_ONLY',
    label: 'Image Only Creative',
    icon: '🎨',
    desc: 'Standalone graphic advertisement creative without text overlay.',
  },
];

export function CampaignsClient({
  initialCampaigns,
  initialStats,
}: CampaignsClientProps) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  // Navigation tabs: 'overview' | 'all' | 'editor' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'editor' | 'settings'>('overview');

  // Campaigns list state
  const [campaigns, setCampaigns] = useState<any[]>(initialCampaigns);
  const [stats, setStats] = useState(initialStats);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'updated' | 'created' | 'impressions' | 'clicks'>('priority');

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'desktop' | 'mobile' | null>(null);

  // Live Preview Modal State
  const [previewCampaign, setPreviewCampaign] = useState<any | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  // Settings Diagnostic State
  const [activeCheckResult, setActiveCheckResult] = useState<any | null>(null);
  const [isCheckingActive, setIsCheckingActive] = useState(false);

  // Form Data
  const defaultFormData: CampaignInput = {
    name: '',
    headline: '',
    description: '',
    supportingText: '',
    badge: 'NEW',
    type: 'IMAGE_POPUP',
    imageUrl: '',
    imageAlt: '',
    mobileImageUrl: '',
    ctaLabel: 'Learn More',
    destinationUrl: '',
    openInNewTab: false,
    status: 'DRAFT',
    priority: 10,
    startDate: '',
    endDate: '',
    autoDismiss: true,
    dismissDuration: 5,
    showProgress: true,
    repeatPolicy: 'SESSION',
    cooldownMinutes: 1440,
    displayPosition: 'TOP_RIGHT',
    allowClickEmptySpace: false,
  };

  const [formData, setFormData] = useState<CampaignInput>(defaultFormData);

  // Protect against unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, isDirty]);

  // Handle URL query parameters for direct action (e.g. ?create=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === '1' || params.get('create') === '1') {
        handleStartCreate();
      }
    }
  }, []);

  const handleStartCreate = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsEditing(true);
    setIsDirty(false);
    setActiveTab('editor');
  };

  const handleStartEdit = (campaign: any) => {
    setFormData({
      name: campaign.name || '',
      headline: campaign.headline || '',
      description: campaign.description || '',
      supportingText: campaign.supportingText || '',
      badge: campaign.badge || '',
      type: campaign.type || 'IMAGE_POPUP',
      imageUrl: campaign.imageUrl || '',
      imageAlt: campaign.imageAlt || '',
      mobileImageUrl: campaign.mobileImageUrl || '',
      ctaLabel: campaign.ctaLabel || '',
      destinationUrl: campaign.destinationUrl || '',
      openInNewTab: Boolean(campaign.openInNewTab),
      status: campaign.status || 'DRAFT',
      priority: campaign.priority ?? 10,
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
      autoDismiss: campaign.autoDismiss !== undefined ? Boolean(campaign.autoDismiss) : true,
      dismissDuration: campaign.dismissDuration || 5,
      showProgress: campaign.showProgress !== undefined ? Boolean(campaign.showProgress) : true,
      repeatPolicy: campaign.repeatPolicy || 'SESSION',
      cooldownMinutes: campaign.cooldownMinutes || 1440,
      displayPosition: campaign.displayPosition || 'TOP_RIGHT',
      allowClickEmptySpace: Boolean(campaign.allowClickEmptySpace),
    });
    setEditingId(campaign.id);
    setIsEditing(true);
    setIsDirty(false);
    setActiveTab('editor');
  };

  const handleCancelEdit = async () => {
    if (isDirty) {
      const confirmed = await confirm({
        title: 'Discard Unsaved Changes?',
        message: 'You have unsaved changes in this campaign. Are you sure you want to close without saving?',
        confirmText: 'Discard Changes',
        confirmVariant: 'danger',
      });
      if (!confirmed) return;
    }
    setIsEditing(false);
    setIsDirty(false);
    setActiveTab('all');
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: data,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload creative asset');
      }

      const result = await res.json();
      if (result.url) {
        if (isMobile) {
          setFormData((prev) => ({ ...prev, mobileImageUrl: result.url }));
        } else {
          setFormData((prev) => ({
            ...prev,
            imageUrl: result.url,
            imageAlt: prev.imageAlt || prev.headline || prev.name,
          }));
        }
        setIsDirty(true);
        toast.success('Creative asset uploaded and optimized successfully!', 'Asset Ready');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err?.name === 'AbortError') {
        toast.error('Upload timed out after 15 seconds. Please paste a direct image URL or select from Media Library.', 'Upload Timeout');
      } else {
        toast.error(err?.message || 'Upload failed. Please check file format and size.', 'Upload Error');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent, forceStatus?: CampaignStatus) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.warning('Please enter an internal campaign name', 'Validation');
      return;
    }

    if (formData.destinationUrl?.trim()) {
      const cleanUrl = formData.destinationUrl.trim().toLowerCase();
      if (cleanUrl.startsWith('javascript:') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('vbscript:')) {
        toast.error('Unsafe destination URL scheme is not allowed', 'Security Warning');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        ...(forceStatus ? { status: forceStatus } : {}),
      };

      const url = '/api/admin/campaigns';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? JSON.stringify({ id: editingId, ...payload }) : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.error || `Server responded with status ${res.status}`);
      }

      const campaignResult = resData.campaign;

      if (editingId) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === editingId ? { ...campaignResult, effectiveStatus: campaignResult.status } : c))
        );
        toast.success(`Campaign "${formData.name}" updated successfully!`, 'Changes Saved');
      } else {
        setCampaigns((prev) => [{ ...campaignResult, effectiveStatus: campaignResult.status }, ...prev]);
        toast.success(`Campaign "${formData.name}" created successfully!`, 'Campaign Published');
      }

      setIsDirty(false);
      setIsEditing(false);
      setActiveTab('all');
      router.refresh();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err?.message || 'Failed to save campaign.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Publish / Disable
  const handleToggleStatus = async (campaign: any) => {
    const isLive = campaign.effectiveStatus === 'PUBLISHED' || campaign.status === 'PUBLISHED';
    const nextStatus: CampaignStatus = isLive ? 'DISABLED' : 'PUBLISHED';

    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, status: nextStatus }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to toggle status');

      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus, effectiveStatus: nextStatus } : c))
      );
      toast.success(
        `Campaign "${campaign.name}" is now ${nextStatus === 'PUBLISHED' ? 'LIVE' : 'DISABLED'}.`,
        'Status Updated'
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle status.', 'Error');
    }
  };

  // Duplicate Handler
  const handleDuplicate = async (campaign: any) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', id: campaign.id }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to duplicate campaign');

      setCampaigns((prev) => [resData.campaign, ...prev]);
      toast.success(`Created draft duplicate of "${campaign.name}".`, 'Campaign Duplicated');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to duplicate campaign.', 'Error');
    }
  };

  // Delete Handler
  const handleDelete = async (campaign: any) => {
    const confirmed = await confirm({
      title: 'Move Campaign to Recently Deleted?',
      message: `Move "${campaign.name}" to Recently Deleted? It will be removed from the public website and can be restored from the Recycle Bin.`,
      confirmText: 'Move to Recently Deleted',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        const res = await fetch(`/api/admin/campaigns?id=${campaign.id}`, {
          method: 'DELETE',
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(resData.error || 'Failed to delete campaign');
        setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
        toast.success(`"${campaign.name}" was moved to Recently Deleted.`, 'Deleted');
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete campaign.', 'Error');
      }
    }
  };

  // Check Active Campaign Delivery via /api/campaigns/active
  const handleCheckActiveCampaign = async () => {
    setIsCheckingActive(true);
    try {
      const res = await fetch('/api/campaigns/active', { cache: 'no-store' });
      const data = await res.json();
      setActiveCheckResult(data);
      if (data?.campaign) {
        toast.success(`Live active campaign: "${data.campaign.headline || data.campaign.name || data.campaign.id}"`, 'Active Campaign API');
      } else {
        toast.info('No campaign is currently active for visitors', 'Active Campaign API');
      }
    } catch (err: any) {
      toast.error('Failed to query /api/campaigns/active: ' + (err?.message || 'Network error'), 'Diagnostic Error');
    } finally {
      setIsCheckingActive(false);
    }
  };

  // Clear Browser Testing Cache
  const handleClearTestCache = () => {
    try {
      let count = 0;
      if (typeof window !== 'undefined') {
        const localKeys = Object.keys(localStorage);
        for (const k of localKeys) {
          if (k.startsWith('qa_cmp_')) {
            localStorage.removeItem(k);
            count++;
          }
        }
        const sessionKeys = Object.keys(sessionStorage);
        for (const k of sessionKeys) {
          if (k.startsWith('qa_cmp_')) {
            sessionStorage.removeItem(k);
            count++;
          }
        }
      }
      toast.success(
        `Cleared ${count} cached test flags. Published campaigns will now display immediately on the homepage!`,
        'Testing Cache Reset'
      );
    } catch (e: any) {
      toast.error('Could not clear storage: ' + (e?.message || 'Access denied'), 'Error');
    }
  };

  // Filtered and Sorted Campaigns
  const filteredCampaigns = campaigns
    .filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.headline || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.badge || '').toLowerCase().includes(q);

      const effectiveStatus = c.effectiveStatus || c.status;
      const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return (b.priority ?? 0) - (a.priority ?? 0);
      }
      if (sortBy === 'impressions') {
        return (b.impressions ?? 0) - (a.impressions ?? 0);
      }
      if (sortBy === 'clicks') {
        return (b.clicks ?? 0) - (a.clicks ?? 0);
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // Convert current form data into PublicCampaign for live preview
  const livePreviewCampaign: PublicCampaign = {
    id: editingId || 'preview-temp-id',
    headline: formData.headline || null,
    description: formData.description || null,
    supportingText: formData.supportingText || null,
    badge: formData.badge || null,
    type: formData.type || 'IMAGE_POPUP',
    imageUrl: formData.imageUrl || null,
    imageAlt: formData.imageAlt || null,
    mobileImageUrl: formData.mobileImageUrl || null,
    ctaLabel: formData.ctaLabel || null,
    destinationUrl: formData.destinationUrl || null,
    openInNewTab: Boolean(formData.openInNewTab),
    autoDismiss: Boolean(formData.autoDismiss),
    dismissDuration: formData.dismissDuration || 5,
    showProgress: Boolean(formData.showProgress),
    repeatPolicy: formData.repeatPolicy || 'SESSION',
    cooldownMinutes: formData.cooldownMinutes || 1440,
    displayPosition: formData.displayPosition || 'TOP_RIGHT',
    allowClickEmptySpace: Boolean(formData.allowClickEmptySpace),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div style={{ color: '#FFFFFF', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── TOP HEADER & TAB BAR ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.18)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📢</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Announcements &amp; Ads
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                color: '#67E8F9',
                padding: '2px 9px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
              }}
            >
              PROD ENGINE
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0.35rem 0 0 0' }}>
            Control promotional popups, notifications, countdown banners, and advertisement creatives across the public website.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (isEditing) handleCancelEdit();
              setActiveTab('overview');
            }}
            style={{
              backgroundColor: activeTab === 'overview' ? '#1677FF' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid ' + (activeTab === 'overview' ? '#1677FF' : 'rgba(255, 255, 255, 0.15)'),
              color: '#FFFFFF',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            📊 Overview
          </button>

          <button
            type="button"
            onClick={() => {
              if (isEditing) handleCancelEdit();
              setActiveTab('all');
            }}
            style={{
              backgroundColor: activeTab === 'all' ? '#1677FF' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid ' + (activeTab === 'all' ? '#1677FF' : 'rgba(255, 255, 255, 0.15)'),
              color: '#FFFFFF',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            📋 All Campaigns ({campaigns.length})
          </button>

          <button
            type="button"
            onClick={() => {
              if (isEditing) handleCancelEdit();
              setActiveTab('settings');
            }}
            style={{
              backgroundColor: activeTab === 'settings' ? '#1677FF' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid ' + (activeTab === 'settings' ? '#1677FF' : 'rgba(255, 255, 255, 0.15)'),
              color: '#FFFFFF',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            ⚙️ Settings
          </button>

          <button
            type="button"
            onClick={handleStartCreate}
            style={{
              backgroundColor: '#14B8A6',
              border: 'none',
              color: '#020708',
              padding: '0.5rem 1.15rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)',
            }}
          >
            + Create Campaign
          </button>
        </div>
      </div>

      {/* ── VIEW 1: OVERVIEW DASHBOARD ── */}
      {activeTab === 'overview' && !isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* KPI Stat Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={kpiCardStyle}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                Total Campaigns
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#FFFFFF', margin: '0.35rem 0' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>In system repository</div>
            </div>

            <div style={{ ...kpiCardStyle, borderLeft: '3px solid #10B981' }}>
              <div style={{ fontSize: '0.72rem', color: '#10B981', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                ● Live &amp; Published
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#FFFFFF', margin: '0.35rem 0' }}>
                {stats.published}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Serving to eligible visitors</div>
            </div>

            <div style={{ ...kpiCardStyle, borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontSize: '0.72rem', color: '#38BDF8', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                ⏱ Scheduled
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#FFFFFF', margin: '0.35rem 0' }}>
                {stats.scheduled}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Auto-triggers when ready</div>
            </div>

            <div style={{ ...kpiCardStyle, borderLeft: '3px solid #F59E0B' }}>
              <div style={{ fontSize: '0.72rem', color: '#F59E0B', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                Drafts &amp; Inactive
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#FFFFFF', margin: '0.35rem 0' }}>
                {stats.draft + stats.disabled}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{stats.draft} drafts, {stats.disabled} disabled</div>
            </div>

            <div style={{ ...kpiCardStyle, borderLeft: '3px solid #67E8F9' }}>
              <div style={{ fontSize: '0.72rem', color: '#67E8F9', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                Telemetry &amp; CTR
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#FFFFFF', margin: '0.35rem 0' }}>
                {stats.ctr}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {stats.totalClicks} clicks / {stats.totalImpressions} views
              </div>
            </div>
          </div>

          {/* Active Campaign Spotlight */}
          <div
            style={{
              backgroundColor: 'rgba(6, 21, 43, 0.75)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Currently Active Public Spotlight
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  The highest-priority eligible campaign currently greeting eligible website visitors.
                </div>
              </div>
            </div>

            {(() => {
              const active = campaigns.find((c) => (c.effectiveStatus || c.status) === 'PUBLISHED');
              if (!active) {
                return (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFFFFF' }}>No campaign is currently active</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                      Publish a draft campaign or create a new announcement to begin displaying it to visitors.
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      style={{
                        marginTop: '1rem',
                        backgroundColor: '#14B8A6',
                        color: '#020708',
                        padding: '0.45rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      + Create First Campaign
                    </button>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {active.imageUrl && (
                    <div style={{ width: '180px', aspectRatio: '16/9', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(103, 232, 249, 0.3)' }}>
                      <Image src={active.imageUrl} alt={active.name} fill sizes="180px" style={{ objectFit: 'cover' }} unoptimized={true} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid #10B981', padding: '1px 7px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                        LIVE NOW
                      </span>
                      {active.badge && (
                        <span style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#67E8F9', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)' }}>
                          [{active.badge}]
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                        Priority: {active.priority ?? 0}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                      {active.name} {active.headline ? `— ${active.headline}` : ''}
                    </h3>

                    {active.description && (
                      <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 0.65rem 0', maxWidth: '650px' }}>
                        {active.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748B' }}>
                      <span>Type: <strong>{active.type}</strong></span>
                      <span>Auto-dismiss: <strong>{active.dismissDuration || 5}s</strong></span>
                      <span>Policy: <strong>{active.repeatPolicy}</strong></span>
                      <span>Views: <strong>{active.impressions ?? 0}</strong></span>
                      <span>Clicks: <strong>{active.clicks ?? 0}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewCampaign(active);
                        setPreviewKey((k) => k + 1);
                      }}
                      style={actionBtnStyle}
                    >
                      👁 Live Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(active)}
                      style={{ ...actionBtnStyle, backgroundColor: '#1677FF', borderColor: '#1677FF' }}
                    >
                      ✏ Edit Campaign
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── VIEW 2: ALL CAMPAIGNS TABLE ── */}
      {activeTab === 'all' && !isEditing && (
        <div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.65rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search campaigns by name, headline, badge, or keyword…"
                aria-label="Search campaigns"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={inputStyle}
              />
            </div>

            <select
              value={statusFilter}
              aria-label="Filter by status"
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published (Live)</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="DRAFT">Draft</option>
              <option value="DISABLED">Disabled</option>
              <option value="EXPIRED">Expired</option>
            </select>

            <select
              value={typeFilter}
              aria-label="Filter by type"
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '170px' }}
            >
              <option value="ALL">All Formats</option>
              <option value="IMAGE_POPUP">Image Popup</option>
              <option value="ANNOUNCEMENT_POPUP">Announcement Popup</option>
              <option value="COMPACT_NOTIFICATION">Compact Notification</option>
              <option value="PROMOTIONAL_BANNER">Promotional Banner</option>
              <option value="IMAGE_ONLY">Image Only</option>
            </select>

            <select
              value={sortBy}
              aria-label="Sort campaigns"
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}
            >
              <option value="priority">Sort by Priority (High to Low)</option>
              <option value="updated">Sort by Recently Updated</option>
              <option value="created">Sort by Newest Created</option>
              <option value="impressions">Sort by Impressions</option>
              <option value="clicks">Sort by Clicks</option>
            </select>
          </div>

          {/* Campaigns Table */}
          {filteredCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: 'rgba(6, 21, 43, 0.5)', borderRadius: '8px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF' }}>No matching campaigns found</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Try adjusting your search terms or filters.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: '8px', backgroundColor: 'rgba(6, 21, 43, 0.65)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.2)', backgroundColor: 'rgba(2, 7, 18, 0.85)', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono, monospace)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Campaign</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Format</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Telemetry</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Schedule</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c) => {
                    const eff = c.effectiveStatus || c.status;
                    const statusColor =
                      eff === 'PUBLISHED' ? '#10B981' :
                      eff === 'SCHEDULED' ? '#38BDF8' :
                      eff === 'EXPIRED' ? '#94A3B8' :
                      eff === 'DISABLED' ? '#EF4444' : '#F59E0B';

                    const ctr = (c.impressions ?? 0) > 0
                      ? (((c.clicks ?? 0) / c.impressions) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Title and Thumbnail */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '32px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(22, 119, 255, 0.25)',
                                position: 'relative',
                                overflow: 'hidden',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                              }}
                            >
                              {c.imageUrl ? (
                                <Image src={c.imageUrl} alt={c.name} fill sizes="48px" style={{ objectFit: 'cover' }} unoptimized={true} />
                              ) : (
                                '📢'
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.9rem' }}>
                                {c.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                {c.headline || c.description || 'No public headline'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Format */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.75rem', color: '#67E8F9', backgroundColor: 'rgba(20, 184, 166, 0.12)', border: '1px solid rgba(20, 184, 166, 0.25)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
                            {c.type}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: statusColor,
                              backgroundColor: `${statusColor}18`,
                              border: `1px solid ${statusColor}40`,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }} />
                            {eff}
                          </span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#FFFFFF' }}>
                            {c.priority ?? 0}
                          </span>
                        </td>

                        {/* Telemetry */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)' }}>
                            {c.impressions ?? 0} views • {c.clicks ?? 0} clicks
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                            CTR: {ctr}%
                          </div>
                        </td>

                        {/* Schedule */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                          {c.startDate ? (
                            <div>Start: {new Date(c.startDate).toLocaleDateString()}</div>
                          ) : (
                            <div>Immediate</div>
                          )}
                          {c.endDate && (
                            <div>End: {new Date(c.endDate).toLocaleDateString()}</div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Link
                              href={`/announcements/${c.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View Dedicated Public Announcement Page"
                              style={{
                                ...actionBtnStyle,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                color: '#67E8F9',
                                borderColor: 'rgba(103, 232, 249, 0.3)',
                              }}
                            >
                              🔗 Page
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewCampaign(c);
                                setPreviewKey((k) => k + 1);
                              }}
                              title="Live Interactive Preview"
                              style={actionBtnStyle}
                            >
                              👁 Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(c)}
                              title="Edit Campaign Configuration"
                              style={{ ...actionBtnStyle, backgroundColor: 'rgba(22, 119, 255, 0.15)', borderColor: 'rgba(22, 119, 255, 0.35)', color: '#FFFFFF' }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c)}
                              title={eff === 'PUBLISHED' ? 'Disable Campaign' : 'Publish Campaign'}
                              style={{
                                ...actionBtnStyle,
                                color: eff === 'PUBLISHED' ? '#F59E0B' : '#10B981',
                                borderColor: eff === 'PUBLISHED' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              {eff === 'PUBLISHED' ? 'Disable' : 'Publish'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(c)}
                              title="Duplicate as draft copy"
                              style={actionBtnStyle}
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              title="Move to Recently Deleted"
                              style={{ ...actionBtnStyle, color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
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
          )}
        </div>
      )}

      {/* ── VIEW 3: CREATE & EDIT CAMPAIGN INTERFACE ── */}
      {isEditing && (
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.94)',
            border: '1px solid rgba(22, 119, 255, 0.28)',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(22, 119, 255, 0.18)',
              paddingBottom: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                {editingId ? `Edit Campaign: ${formData.name}` : 'Create New Campaign'}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Configure advertisement visuals, public messaging, timing schedule, and dismissal policies.
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelEdit}
              aria-label="Close campaign editor"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 1. Basic Information */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>1. Campaign Identity &amp; Public Messaging</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label htmlFor="cmp-name" style={labelStyle}>
                    Internal Campaign Name * (Admin only)
                  </label>
                  <input
                    id="cmp-name"
                    type="text"
                    required
                    placeholder="e.g. Q4 2026 Engineering Copilot Launch"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>Shown only within the admin panel to organize campaigns.</span>
                </div>

                <div>
                  <label htmlFor="cmp-headline" style={labelStyle}>
                    Public Headline (Shown to visitors)
                  </label>
                  <input
                    id="cmp-headline"
                    type="text"
                    placeholder="e.g. Introducing Mechanical Engineering Copilot"
                    value={formData.headline || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, headline: e.target.value });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="cmp-badge" style={labelStyle}>
                    Promotional Badge (Optional)
                  </label>
                  <input
                    id="cmp-badge"
                    type="text"
                    placeholder="e.g. NEW, ANNOUNCEMENT, SPECIAL OFFER, BETA"
                    value={formData.badge || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, badge: e.target.value });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="cmp-ctaLabel" style={labelStyle}>
                    Call to Action Button Label
                  </label>
                  <input
                    id="cmp-ctaLabel"
                    type="text"
                    placeholder="e.g. Explore Now, View Project, Contact Team"
                    value={formData.ctaLabel || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, ctaLabel: e.target.value });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="cmp-description" style={labelStyle}>
                  Short Promotional Description
                </label>
                <textarea
                  id="cmp-description"
                  rows={2}
                  placeholder="e.g. Accelerate engineering calculations, shaft design, and component validation with Quantum AI's dedicated reasoning assistant."
                  value={formData.description || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setIsDirty(true);
                  }}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="cmp-supportingText" style={labelStyle}>
                  Supporting Text / Disclaimer (Optional small secondary note)
                </label>
                <input
                  id="cmp-supportingText"
                  type="text"
                  placeholder="e.g. Limited prototype access for verified aerospace and mechanical engineers."
                  value={formData.supportingText || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, supportingText: e.target.value });
                    setIsDirty(true);
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 2. Campaign Format */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>2. Campaign Type &amp; Display Format</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                {CAMPAIGN_TYPES.map((t) => {
                  const isSelected = formData.type === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setFormData({ ...formData, type: t.id });
                        setIsDirty(true);
                      }}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid ' + (isSelected ? '#14B8A6' : 'rgba(255, 255, 255, 0.12)'),
                        backgroundColor: isSelected ? 'rgba(20, 184, 166, 0.12)' : 'rgba(2, 7, 18, 0.65)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 14px rgba(20, 184, 166, 0.2)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>{t.icon}</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? '#67E8F9' : '#FFFFFF', marginBottom: '0.25rem' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.4 }}>
                        {t.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label htmlFor="cmp-position" style={labelStyle}>
                  Viewport Display Position
                </label>
                <select
                  id="cmp-position"
                  value={formData.displayPosition}
                  onChange={(e) => {
                    setFormData({ ...formData, displayPosition: e.target.value as DisplayPosition });
                    setIsDirty(true);
                  }}
                  style={{ ...inputStyle, maxWidth: '320px' }}
                >
                  <option value="TOP_RIGHT">Top Right (Recommended for Popups)</option>
                  <option value="TOP_CENTER">Top Center (Prominent Floating)</option>
                  <option value="TOP_BANNER">Top Banner (Header Fixed Bar)</option>
                  <option value="BOTTOM_RIGHT">Bottom Right (Subtle Floating)</option>
                </select>
              </div>
            </div>

            {/* 3. Media & Uploads */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>3. Visual Creative &amp; Media Upload</div>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '160px',
                    height: '90px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(2, 7, 18, 0.8)',
                    border: '1px solid rgba(103, 232, 249, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {formData.imageUrl ? (
                    <Image
                      src={formData.imageUrl}
                      alt="Creative preview"
                      fill
                      sizes="160px"
                      style={{ objectFit: 'cover' }}
                      unoptimized={true}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem', color: '#64748B' }}>🖼️</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={(e) => handleFileUpload(e, false)}
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundColor: '#1677FF',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '0.45rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {isUploading ? 'Uploading & Optimizing…' : '📁 Upload Creative Image'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('desktop')}
                      style={{
                        backgroundColor: 'rgba(20, 184, 166, 0.15)',
                        border: '1px solid rgba(20, 184, 166, 0.35)',
                        color: '#67E8F9',
                        padding: '0.45rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      🗂️ Browse Media Library
                    </button>

                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '' });
                          setIsDirty(true);
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    id="cmp-imageUrl"
                    type="text"
                    placeholder="Or paste direct image URL (e.g. /uploads/banner.webp or https://…)"
                    value={formData.imageUrl || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      setIsDirty(true);
                    }}
                    style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                  />
                  <div style={hintStyle}>
                    Supported formats: WebP, PNG, JPEG, SVG. Maximum file size: 10MB. Recommended resolution: 1200×675 (16:9).
                  </div>
                </div>
              </div>

              {/* Alt Text */}
              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="cmp-imageAlt" style={labelStyle}>
                  Image Alt Text (Accessibility)
                </label>
                <input
                  id="cmp-imageAlt"
                  type="text"
                  placeholder="Describe the image content for screen readers"
                  value={formData.imageAlt || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, imageAlt: e.target.value });
                    setIsDirty(true);
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 4. Click Destination */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>4. Click Destination &amp; Navigation</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label htmlFor="cmp-destinationUrl" style={labelStyle}>
                    Destination URL
                  </label>
                  <input
                    id="cmp-destinationUrl"
                    type="text"
                    placeholder="e.g. /work/mechanical-engineering-design-copilot or https://…"
                    value={formData.destinationUrl || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, destinationUrl: e.target.value });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>Supports internal pages (/work, /contact) or verified external links (https://).</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      id="cmp-openInNewTab"
                      type="checkbox"
                      checked={Boolean(formData.openInNewTab)}
                      onChange={(e) => {
                        setFormData({ ...formData, openInNewTab: e.target.checked });
                        setIsDirty(true);
                      }}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="cmp-openInNewTab" style={{ fontSize: '0.82rem', color: '#FFFFFF', cursor: 'pointer' }}>
                      Open destination in a new browser tab (target="_blank")
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      id="cmp-allowClickEmptySpace"
                      type="checkbox"
                      checked={Boolean(formData.allowClickEmptySpace)}
                      onChange={(e) => {
                        setFormData({ ...formData, allowClickEmptySpace: e.target.checked });
                        setIsDirty(true);
                      }}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="cmp-allowClickEmptySpace" style={{ fontSize: '0.82rem', color: '#FFFFFF', cursor: 'pointer' }}>
                      Make entire card backdrop clickable to destination URL
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Publication & Timing */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>5. Publication &amp; Scheduling Settings</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label htmlFor="cmp-status" style={labelStyle}>
                    Publication Status *
                  </label>
                  <select
                    id="cmp-status"
                    value={formData.status}
                    onChange={(e) => {
                      setFormData({ ...formData, status: e.target.value as CampaignStatus });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  >
                    <option value="DRAFT">Draft (Hidden from visitors)</option>
                    <option value="PUBLISHED">Published Now (Live)</option>
                    <option value="SCHEDULED">Scheduled (Activates automatically)</option>
                    <option value="DISABLED">Disabled (Deactivated)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cmp-priority" style={labelStyle}>
                    Display Priority (0 - 100)
                  </label>
                  <input
                    id="cmp-priority"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.priority ?? 10}
                    onChange={(e) => {
                      setFormData({ ...formData, priority: Number(e.target.value) });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>Higher number = prioritized over lower priority campaigns.</span>
                </div>

                <div>
                  <label htmlFor="cmp-startDate" style={labelStyle}>
                    Scheduled Start Date &amp; Time
                  </label>
                  <input
                    id="cmp-startDate"
                    type="datetime-local"
                    value={formData.startDate ? String(formData.startDate) : ''}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="cmp-endDate" style={labelStyle}>
                    Scheduled End Date &amp; Time (Expiry)
                  </label>
                  <input
                    id="cmp-endDate"
                    type="datetime-local"
                    value={formData.endDate ? String(formData.endDate) : ''}
                    onChange={(e) => {
                      setFormData({ ...formData, endDate: e.target.value });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* 6. Dismissal & Repeat Controls */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>6. Dismissal Timing &amp; Repeat Policy</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      id="cmp-autoDismiss"
                      type="checkbox"
                      checked={Boolean(formData.autoDismiss)}
                      onChange={(e) => {
                        setFormData({ ...formData, autoDismiss: e.target.checked });
                        setIsDirty(true);
                      }}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="cmp-autoDismiss" style={{ fontSize: '0.82rem', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600 }}>
                      Enable Automatic Dismissal
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <label htmlFor="cmp-duration" style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      Duration:
                    </label>
                    <select
                      id="cmp-duration"
                      value={formData.dismissDuration || 5}
                      disabled={!formData.autoDismiss}
                      onChange={(e) => {
                        setFormData({ ...formData, dismissDuration: Number(e.target.value) });
                        setIsDirty(true);
                      }}
                      style={{ ...inputStyle, width: '120px', padding: '0.45rem' }}
                    >
                      <option value={4}>4 seconds</option>
                      <option value={5}>5 seconds (Default)</option>
                      <option value={6}>6 seconds</option>
                      <option value={8}>8 seconds</option>
                      <option value={10}>10 seconds</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      id="cmp-showProgress"
                      type="checkbox"
                      checked={Boolean(formData.showProgress)}
                      onChange={(e) => {
                        setFormData({ ...formData, showProgress: e.target.checked });
                        setIsDirty(true);
                      }}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="cmp-showProgress" style={{ fontSize: '0.82rem', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600 }}>
                      Display Countdown Progress Line
                    </label>
                  </div>
                  <span style={hintStyle}>A glowing line that decreases over the popup lifetime.</span>
                </div>

                <div>
                  <label htmlFor="cmp-repeatPolicy" style={labelStyle}>
                    Visitor Reappearance Policy
                  </label>
                  <select
                    id="cmp-repeatPolicy"
                    value={formData.repeatPolicy}
                    onChange={(e) => {
                      setFormData({ ...formData, repeatPolicy: e.target.value as RepeatPolicy });
                      setIsDirty(true);
                    }}
                    style={inputStyle}
                  >
                    <option value="SESSION">Once per browser session (Recommended)</option>
                    <option value="ONCE_PERSISTENT">Once per browser permanently</option>
                    <option value="COOLDOWN">Show again after cooldown period</option>
                    <option value="EVERY_PAGE">Every eligible page load</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                borderTop: '1px solid rgba(22, 119, 255, 0.2)',
                paddingTop: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewCampaign(livePreviewCampaign);
                  setPreviewKey((k) => k + 1);
                }}
                style={{
                  backgroundColor: 'rgba(20, 184, 166, 0.15)',
                  border: '1px solid rgba(20, 184, 166, 0.35)',
                  color: '#67E8F9',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                👁 Live Preview Unsaved
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                onClick={(e) => handleSubmit(e, 'DRAFT')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {isSubmitting ? 'Saving…' : 'Save as Draft'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                onClick={(e) => handleSubmit(e, 'PUBLISHED')}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.65rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                {isSubmitting ? 'Publishing…' : 'Save & Publish Live'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── VIEW 4: SETTINGS ── */}
      {activeTab === 'settings' && !isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Header Card */}
          <div style={sectionBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  ⚙️ System &amp; Delivery Settings
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0.35rem 0 0 0' }}>
                  Manage delivery runtime configurations, media storage resilience, public cache revalidation, and browser testing tools.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearTestCache}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#FCA5A5',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)',
                }}
              >
                🧹 Reset Local Testing Cache
              </button>
            </div>
          </div>

          {/* Grid of Settings Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {/* Panel 1: Live Public Delivery Diagnostics */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>🛰️ Live Public Delivery Status</div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
                Verify what the public layout and visitor clients receive when querying active campaigns.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>Active Delivery API:</span>
                  <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    /api/campaigns/active (HTTP 200)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>Telemetry API:</span>
                  <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    /api/campaigns/track (Live)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>Page Revalidation:</span>
                  <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    revalidate = 0 (Real-time SSR)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>Media Storage Engine:</span>
                  <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    Vercel Blob + Base64 Fallback
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={isCheckingActive}
                  onClick={handleCheckActiveCampaign}
                  style={{
                    backgroundColor: '#1677FF',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: isCheckingActive ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {isCheckingActive ? 'Probing…' : '📡 Probe Active Delivery API'}
                </button>
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-mono, monospace)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Open Live Homepage ↗
                </Link>
              </div>

              {activeCheckResult && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#020708', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.2)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#67E8F9', marginBottom: '0.35rem', fontFamily: 'var(--font-mono, monospace)' }}>
                    {activeCheckResult.campaign ? `Active: "${activeCheckResult.campaign.headline || activeCheckResult.campaign.name}"` : 'No active campaign returned.'}
                  </div>
                  <pre style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8', maxHeight: '140px', overflowY: 'auto' }}>
                    {JSON.stringify(activeCheckResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Panel 2: Browser Testing & Dismissal Policies */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>🧪 Testing &amp; Visitor Repeat Rules</div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
                How campaigns are recorded on visitor browsers to prevent annoyance and ensure smooth delivery.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    1. Session Once (Default)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Stored in browser <code style={{ color: '#67E8F9' }}>sessionStorage</code>. The popup shows once per tab session. Closing the tab or resetting test cache shows it again.
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    2. Once Persistent
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Stored in browser <code style={{ color: '#67E8F9' }}>localStorage</code>. Visitors never see it again after closing, unless you edit and save the campaign (which creates a new version key).
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    3. Cooldown Interval
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Shows once, then suppresses for the configured cooldown minutes (e.g. 1440 min = 24 hours), then shows again.
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#070B14', borderRadius: '6px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    4. Always Show (Testing)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Bypasses all dismissal cache on every single page load. Perfect for QA testing and demonstrations.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE INTERACTIVE PREVIEW MODAL ── */}
      {previewCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setPreviewCampaign(null)}
        >
          <div
            style={{
              backgroundColor: '#070B14',
              border: '1px solid rgba(103, 232, 249, 0.35)',
              borderRadius: '14px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: previewDevice === 'mobile' ? '420px' : '900px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(20, 184, 166, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Control Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.1rem' }}>👁</span>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFFFFF', fontFamily: 'var(--font-mono, monospace)' }}>
                  Interactive Simulator: {previewCampaign.name || 'Campaign'}
                </span>
              </div>

              {/* Device and Action Controls */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    style={{
                      backgroundColor: previewDevice === 'desktop' ? '#1677FF' : 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    🖥 Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    style={{
                      backgroundColor: previewDevice === 'mobile' ? '#1677FF' : 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    📱 Mobile
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  style={{
                    backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    border: '1px solid #14B8A6',
                    color: '#67E8F9',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  ↻ Replay Timer
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewCampaign(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    marginLeft: '0.5rem',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Simulator Viewport Container */}
            <div
              style={{
                backgroundColor: '#020708',
                backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(15, 118, 110, 0.15) 0%, transparent 60%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '2.5rem 1.5rem',
                minHeight: '340px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Actual Reusable Campaign Component in Preview Mode */}
              <CampaignDisplay
                key={previewKey}
                campaign={previewCampaign}
                previewMode={true}
                previewDevice={previewDevice}
                onPreviewClose={() => setPreviewKey((k) => k + 1)}
              />
            </div>

            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
              <span>* Preview runs identical production code without recording telemetry impressions.</span>
              <button
                type="button"
                onClick={() => setPreviewCampaign(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#38BDF8', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MEDIA LIBRARY PICKER MODAL ── */}
      {mediaPickerTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 10005,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setMediaPickerTarget(null)}
        >
          <div
            style={{
              backgroundColor: '#070B14',
              border: '1px solid rgba(22, 119, 255, 0.35)',
              borderRadius: '12px',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(22, 119, 255, 0.2)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.15rem', fontWeight: 600 }}>Select Asset from Media Library</h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Click any asset to link it directly to this campaign creative.</span>
              </div>
              <button
                type="button"
                onClick={() => setMediaPickerTarget(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <MediaLibrary
              selectable={true}
              onSelect={(item) => {
                if (mediaPickerTarget === 'mobile') {
                  setFormData((prev) => ({ ...prev, mobileImageUrl: item.url }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    imageUrl: item.url,
                    imageAlt: prev.imageAlt || prev.headline || prev.name,
                  }));
                }
                setIsDirty(true);
                setMediaPickerTarget(null);
                toast.success('Asset selected from Media Library!', 'Asset Ready');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── SHARED STYLES ──
const kpiCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(6, 21, 43, 0.65)',
  border: '1px solid rgba(22, 119, 255, 0.2)',
  borderRadius: '8px',
  padding: '1.15rem',
};

const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(3, 10, 24, 0.65)',
  border: '1px solid rgba(22, 119, 255, 0.2)',
  borderRadius: '8px',
  padding: '1.35rem',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#38BDF8',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '1rem',
  fontFamily: 'var(--font-mono, monospace)',
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  backgroundColor: '#070B14',
  border: '1px solid rgba(22, 119, 255, 0.22)',
  borderRadius: '6px',
  color: '#FFFFFF',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-d-din, sans-serif)',
};

const hintStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  color: '#64748B',
  marginTop: '0.25rem',
};

const actionBtnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#94A3B8',
  padding: '0.3rem 0.65rem',
  borderRadius: '4px',
  fontSize: '0.72rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-mono, monospace)',
};
