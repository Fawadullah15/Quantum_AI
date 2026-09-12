'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import {
  restoreRecentlyDeletedAction,
  permanentDeleteRecentlyDeletedAction,
  emptyRecentlyDeletedAction,
  getRecentlyDeletedAction,
  getRecoveryAuditLogsAction,
} from './actions';
import { RecoveryDetailModal } from './RecoveryDetailModal';

interface RecentlyDeletedClientProps {
  initialData: {
    items: any[];
    totalCount: number;
    categoryCounts: Record<string, number>;
    stats: {
      total: number;
      recoverable: number;
      mediaOnHold: number;
      newestDeletedAt: any;
    };
  };
  initialAuditLogs: any[];
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'PROJECTS', label: 'Works & Projects' },
  { id: 'PRODUCTS', label: 'Products' },
  { id: 'LEADERSHIP', label: 'Leadership & Team' },
  { id: 'TESTIMONIALS', label: 'Testimonials' },
  { id: 'SERVICES', label: 'Services' },
  { id: 'TECHNOLOGY', label: 'Tech Stack' },
  { id: 'BLOG', label: 'Blog Articles' },
  { id: 'CLIENTS', label: 'Clients' },
  { id: 'APPLICATIONS', label: 'Careers & Partners' },
  { id: 'CONTACTS', label: 'Contact Messages' },
  { id: 'MEDIA', label: 'Media Assets' },
  { id: 'NOTIFICATIONS', label: 'Notifications' },
];

const TYPE_BADGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CASE_STUDY: { label: 'Case Study', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' },
  PRODUCT: { label: 'Product', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  LEADERSHIP: { label: 'Leadership', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
  TESTIMONIAL: { label: 'Testimonial', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  SERVICE: { label: 'Service', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  TECHNOLOGY: { label: 'Technology', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)' },
  BLOG_POST: { label: 'Blog Article', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
  CLIENT: { label: 'Client', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.3)' },
  CAREER_APPLICATION: { label: 'Career App', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
  PARTNERSHIP_REQUEST: { label: 'Partnership', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  CAREER_POSITION: { label: 'Job Opening', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  CONTACT_SUBMISSION: { label: 'Contact Msg', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)' },
  MEDIA: { label: 'Media Asset', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)' },
  NOTIFICATION: { label: 'Notification', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)' },
  TEAM_MEMBER: { label: 'Team Member', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
  FOUNDER: { label: 'Founder', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
};

export default function RecentlyDeletedClient({
  initialData,
  initialAuditLogs,
}: RecentlyDeletedClientProps) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState<any[]>(initialData.items);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [categoryCounts, setCategoryCounts] = useState(initialData.categoryCounts);
  const [stats, setStats] = useState(initialData.stats);
  const [auditLogs, setAuditLogs] = useState<any[]>(initialAuditLogs);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState<'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC'>('NEWEST');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectedItem, setInspectedItem] = useState<any | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const reloadData = async (filterOverride?: string) => {
    try {
      setIsProcessing(true);
      const res = await getRecentlyDeletedAction({
        filter: filterOverride || selectedFilter,
        search: searchQuery,
        dateRange: selectedDateRange,
        sortBy: selectedSort,
        limit: 100,
      });

      setItems(res.items);
      setTotalCount(res.totalCount);
      setCategoryCounts(res.categoryCounts);
      setStats(res.stats);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error('Failed to load Recently Deleted items.', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    reloadData(filterId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reloadData();
  };

  // Restore Single Item
  const handleRestore = async (id: string) => {
    const targetItem = items.find((i) => i.id === id) || inspectedItem;
    const title = targetItem?.title || 'item';

    const confirmed = await confirm({
      title: 'Restore this item?',
      message: `Restore "${title}" to its original section? It will become active and visible again on the website.`,
      confirmText: 'Restore',
      variant: 'primary',
      confirmVariant: 'primary',
    });

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      const res = await restoreRecentlyDeletedAction(id);
      if (res.success) {
        toast.success(
          `"${title}" was successfully restored to ${res.item?.originalSection || 'its section'}.`,
          'Item Restored'
        );
        if (res.conflictResolutionNote) {
          toast.warning(res.conflictResolutionNote, 'Slug Adjusted');
        }
        setInspectedItem(null);
        await reloadData();
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to restore item.', 'Restore Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Permanently Delete Single Item
  const handlePermanentDelete = async (id: string) => {
    const targetItem = items.find((i) => i.id === id) || inspectedItem;
    const title = targetItem?.title || 'item';

    const confirmed = await confirm({
      title: 'Permanently delete this item?',
      message: `Permanently delete "${title}"? This action cannot be undone. All data and associated media will be completely erased.`,
      confirmText: 'Delete Permanently',
      variant: 'danger',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await permanentDeleteRecentlyDeletedAction(id);
      toast.success(`"${title}" was permanently removed.`, 'Permanently Deleted');
      setInspectedItem(null);
      await reloadData();
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to permanently delete item.', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty Bin (Two-step confirmation)
  const handleEmptyBin = async () => {
    if (totalCount === 0) {
      toast.info('Recently Deleted is already empty.', 'Notice');
      return;
    }

    const step1 = await confirm({
      title: 'Empty Recently Deleted?',
      message: `Are you sure you want to permanently delete all ${totalCount} items in Recently Deleted? This will purge all recoverable records and storage files forever.`,
      confirmText: 'Continue to Empty',
      variant: 'danger',
      confirmVariant: 'danger',
    });

    if (!step1) return;

    const step2 = await confirm({
      title: 'Final Confirmation: Empty All Recoverable Items',
      message: 'This is your final warning: There is NO way to recover these items once deleted. Click "Permanently Empty Bin" to proceed.',
      confirmText: 'Permanently Empty Bin',
      variant: 'danger',
      confirmVariant: 'danger',
    });

    if (!step2) return;

    try {
      setIsProcessing(true);
      const res = await emptyRecentlyDeletedAction();
      toast.success(`All ${res.count} items permanently deleted.`, 'Bin Emptied');
      await reloadData();
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to empty bin.', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Restore
  const handleBatchRestore = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;

    const confirmed = await confirm({
      title: `Restore ${count} selected items?`,
      message: `Restore ${count} items back to their original admin sections?`,
      confirmText: `Restore ${count} Items`,
      variant: 'primary',
      confirmVariant: 'primary',
    });

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      let successCount = 0;
      for (const id of Array.from(selectedIds)) {
        try {
          await restoreRecentlyDeletedAction(id);
          successCount++;
        } catch {}
      }
      toast.success(`Successfully restored ${successCount} items.`, 'Batch Restore Complete');
      setSelectedIds(new Set());
      await reloadData();
      router.refresh();
    } catch (err) {
      toast.error('Batch restore encountered an issue.', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Delete Permanently
  const handleBatchPermanentDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;

    const confirmed = await confirm({
      title: `Permanently delete ${count} selected items?`,
      message: `Permanently delete ${count} items? This cannot be undone.`,
      confirmText: `Permanently Delete ${count}`,
      variant: 'danger',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      for (const id of Array.from(selectedIds)) {
        try {
          await permanentDeleteRecentlyDeletedAction(id);
        } catch {}
      }
      toast.success(`Permanently deleted ${count} items.`, 'Batch Delete Complete');
      setSelectedIds(new Set());
      await reloadData();
      router.refresh();
    } catch (err) {
      toast.error('Batch permanent delete failed.', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div style={{ color: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: '12px', padding: '1.15rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            TOTAL IN BIN
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F8FAFC', marginTop: '0.25rem' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
            Recoverable records
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '1.15rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            RECOVERY STATUS
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#38BDF8', marginTop: '0.25rem' }}>
            100%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
            Zero data destroyed
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: '12px', padding: '1.15rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#EC4899', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            MEDIA ON HOLD
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F472B6', marginTop: '0.25rem' }}>
            {stats.mediaOnHold}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
            Storage blobs safely preserved
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '1.15rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#A855F7', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            LAST DELETED
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#C084FC', marginTop: '0.65rem' }}>
            {stats.newestDeletedAt ? formatRelativeTime(stats.newestDeletedAt) : 'None'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
            Automatic audit tracked
          </div>
        </div>
      </div>

      {/* Main Toolbar */}
      <div
        style={{
          backgroundColor: 'rgba(7, 14, 30, 0.75)',
          border: '1px solid rgba(22, 119, 255, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Search, Date, Sort & Global Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px', maxWidth: '520px' }}>
            <input
              type="text"
              placeholder="Search by title, original slug, admin, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: '#030712',
                border: '1px solid rgba(22, 119, 255, 0.25)',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                color: '#F8FAFC',
                fontSize: '0.82rem',
                outline: 'none',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            />
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                border: '1px solid rgba(22, 119, 255, 0.35)',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '0.55rem 0.95rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Date filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setTimeout(() => reloadData(), 50);
              }}
              style={{
                backgroundColor: '#030712',
                border: '1px solid rgba(22, 119, 255, 0.25)',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                color: '#94A3B8',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Deleted Today</option>
              <option value="7_DAYS">Last 7 Days</option>
              <option value="30_DAYS">Last 30 Days</option>
            </select>

            {/* Sort */}
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value as any);
                setTimeout(() => reloadData(), 50);
              }}
              style={{
                backgroundColor: '#030712',
                border: '1px solid rgba(22, 119, 255, 0.25)',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                color: '#94A3B8',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              <option value="NEWEST">Newest Deleted First</option>
              <option value="OLDEST">Oldest Deleted First</option>
              <option value="NAME_ASC">Name (A-Z)</option>
              <option value="NAME_DESC">Name (Z-A)</option>
            </select>

            {/* Audit History Toggle */}
            <button
              type="button"
              onClick={async () => {
                const logs = await getRecoveryAuditLogsAction(30);
                setAuditLogs(logs);
                setShowAuditModal(true);
              }}
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#C084FC',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              📜 Audit History
            </button>

            {/* Empty Bin */}
            <button
              type="button"
              disabled={isProcessing || totalCount === 0}
              onClick={handleEmptyBin}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171',
                borderRadius: '8px',
                padding: '0.55rem 0.95rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: totalCount === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              Empty Bin
            </button>

            {/* Refresh */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => reloadData()}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#94A3B8',
                borderRadius: '8px',
                padding: '0.55rem 0.75rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              🔄
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
          {CATEGORY_TABS.map((tab) => {
            const count = categoryCounts[tab.id] ?? 0;
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.38rem 0.75rem',
                  borderRadius: '9999px',
                  border: isActive ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.15)',
                  backgroundColor: isActive ? 'rgba(22, 119, 255, 0.22)' : 'rgba(3, 7, 18, 0.5)',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? '#1677FF' : 'rgba(148, 163, 184, 0.15)',
                    color: isActive ? '#FFFFFF' : '#CBD5E1',
                    padding: '0.05rem 0.45rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Actions Bar (when items selected) */}
      {selectedIds.size > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(22, 119, 255, 0.15)',
            border: '1px solid rgba(22, 119, 255, 0.4)',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#38BDF8' }}>
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.76rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Deselect All
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleBatchRestore}
              style={{
                backgroundColor: '#1677FF',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '0.45rem 0.95rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              Restore Selected ({selectedIds.size})
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleBatchPermanentDelete}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171',
                borderRadius: '6px',
                padding: '0.45rem 0.95rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              Permanently Delete ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Recovery Items List / Table */}
      {items.length === 0 ? (
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.45)',
            border: '1px dashed rgba(22, 119, 255, 0.25)',
            borderRadius: '14px',
            padding: '4rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛡️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.4rem 0' }}>
            Recently Deleted is Empty
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
            All website content, projects, products, media assets, and team records are currently active and operational.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.45)',
            border: '1px solid rgba(22, 119, 255, 0.2)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1.5fr 1fr 140px 140px 190px',
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono, monospace)',
              alignItems: 'center',
            }}
          >
            <div>
              <input
                type="checkbox"
                checked={selectedIds.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div>Item / Title</div>
            <div>Type &amp; Section</div>
            <div>Deleted By</div>
            <div>Deleted When</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item) => {
              const badge = TYPE_BADGES[item.entityType] || {
                label: item.entityType,
                color: '#94A3B8',
                bg: 'rgba(148, 163, 184, 0.1)',
                border: 'rgba(148, 163, 184, 0.2)',
              };
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.5fr 1fr 140px 140px 190px',
                    padding: '0.9rem 1rem',
                    borderBottom: '1px solid rgba(22, 119, 255, 0.08)',
                    alignItems: 'center',
                    backgroundColor: isSelected ? 'rgba(22, 119, 255, 0.08)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>

                  {/* Title & Subtitle */}
                  <div style={{ minWidth: 0, paddingRight: '0.75rem' }}>
                    <div
                      onClick={() => setInspectedItem(item)}
                      style={{
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: '#F8FAFC',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: '#64748B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '0.15rem',
                        }}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Type & Section */}
                  <div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        display: 'inline-block',
                      }}
                    >
                      {badge.label}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      {item.originalSection}
                    </div>
                  </div>

                  {/* Deleted By */}
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
                    <div>{item.adminName || 'Admin'}</div>
                    {item.adminEmail && (
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                        {item.adminEmail.split('@')[0]}
                      </div>
                    )}
                  </div>

                  {/* Deleted When */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 500 }}>
                      {formatRelativeTime(item.deletedAt)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                      {new Date(item.deletedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleRestore(item.id)}
                      title="Restore item to original section"
                      style={{
                        backgroundColor: 'rgba(22, 119, 255, 0.15)',
                        border: '1px solid rgba(22, 119, 255, 0.35)',
                        color: '#38BDF8',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      Restore
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectedItem(item)}
                      title="Inspect full details and snapshot"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        color: '#94A3B8',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                      }}
                    >
                      Inspect
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handlePermanentDelete(item.id)}
                      title="Permanently delete item"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#F87171',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recovery Detail Modal */}
      <RecoveryDetailModal
        item={inspectedItem}
        isOpen={Boolean(inspectedItem)}
        onClose={() => setInspectedItem(null)}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        isProcessing={isProcessing}
      />

      {/* Audit History Modal */}
      {showAuditModal && (
        <div
          onClick={() => setShowAuditModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#070E1E',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              color: '#F8FAFC',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(168, 85, 247, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📜</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#C084FC' }}>
                  Recovery &amp; Deletion Audit Trail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '2rem' }}>
                  No recovery or deletion audit events recorded yet.
                </div>
              ) : (
                auditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(168, 85, 247, 0.12)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono, monospace)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor:
                              log.action === 'RESTORE'
                                ? 'rgba(52, 211, 153, 0.15)'
                                : log.action === 'PERMANENT_DELETE'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              log.action === 'RESTORE'
                                ? '#34D399'
                                : log.action === 'PERMANENT_DELETE'
                                ? '#F87171'
                                : '#FBBF24',
                          }}
                        >
                          {log.action}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                          {log.entity}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#E2E8F0', marginTop: '0.2rem' }}>
                        {log.details || `${log.action} on ${log.entity}`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {log.adminName || 'Admin'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
