'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdminToast } from '@/components/admin/AdminToast';
import {
  createBackup,
  listBackups,
  deleteBackup,
  restoreBackup,
  uploadBackup,
  getDatabaseStatusAction,
  preflightValidateAction,
} from './actions';
import { PreflightValidationResult } from '@/lib/backup-engine';

interface BackupRecord {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

interface DatabaseStatus {
  label: string;
  provider: 'neon' | 'local' | 'postgresql';
  target: 'production' | 'development' | 'preview' | 'unknown';
  isProduction: boolean;
  isConnected: boolean;
  sampleRecordCount: number;
}

export default function BackupClient() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Preflight and Restore Confirmation Modal State
  const [preflightData, setPreflightData] = useState<{
    source: string | object;
    title: string;
    result: PreflightValidationResult;
  } | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  const toast = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        getDatabaseStatusAction(),
        listBackups(),
      ]);
      setDbStatus(statusRes);
      if (listRes.success && listRes.backups) {
        setBackups(listRes.backups);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to load backup dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * DIRECT EXPORT & DOWNLOAD:
   * Generates a complete database snapshot and triggers native browser download
   * using a verified fetch blob pipeline (with explicit error handling).
   */
  const handleDirectExport = async () => {
    setIsDownloading(true);
    toast.info('Generating backup...', 'Querying all database models and calculating integrity hash.');

    try {
      const response = await fetch('/api/admin/backup/download?direct=true', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Download failed with HTTP ${response.status}`);
      }

      // Extract filename from headers or default to timestamped name
      const disposition = response.headers.get('content-disposition');
      let filename = `quantum-ai-backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(link);

      const sizeKb = (blob.size / 1024).toFixed(1);
      toast.success('Backup downloaded successfully!', `${filename} (${sizeKb} KB)`);
    } catch (err: unknown) {
      console.error('[Backup Download Error]:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download backup';
      toast.error('Download Failed', msg);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * DOWNLOAD STORED SNAPSHOT FROM VERCEL BLOB
   */
  const handleDownloadStored = async (b: BackupRecord) => {
    const rawFilename = b.pathname.split('/').pop() || 'backup.json';
    const downloadUrl = `/api/admin/backup/download?pathname=${encodeURIComponent(
      b.pathname
    )}&url=${encodeURIComponent(b.url)}&filename=${encodeURIComponent(rawFilename)}`;

    toast.info('Retrieving snapshot...', 'Streaming file from storage.');

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to download snapshot (HTTP ${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = rawFilename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(link);

      toast.success('Snapshot downloaded successfully!');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to download snapshot';
      toast.error('Download Failed', msg);
    }
  };

  /**
   * CREATE PERSISTENT SNAPSHOT IN VERCEL BLOB
   */
  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    toast.info('Creating cloud snapshot...', 'Preserving snapshot in cloud storage.');
    try {
      const res = await createBackup();
      if (res.success) {
        toast.success('Snapshot created successfully!', `${res.totalRecords} total records preserved.`);
        await loadData();
      } else {
        toast.error('Snapshot failed', res.error || 'Failed to create cloud snapshot.');
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to create snapshot.');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * UPLOAD AND PREFLIGHT LOCAL BACKUP FILE
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Invalid File', 'Backup file must have a .json extension.');
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum supported backup size is 50MB.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    toast.info('Reading file...', 'Inspecting backup structure and checksum.');

    try {
      const text = await file.text();
      const preflight = await preflightValidateAction(text);

      if (!preflight.valid || !preflight.summary) {
        toast.error('Invalid Backup File', preflight.error || 'Corrupted or incompatible format.');
        return;
      }

      // Open preflight inspector modal
      setPreflightData({
        source: text,
        title: file.name,
        result: preflight,
      });
      setConfirmInput('');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to parse backup file. Please ensure it is valid JSON.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * PREFLIGHT STORED SNAPSHOT FOR RESTORATION
   */
  const handleSelectStoredForRestore = async (b: BackupRecord) => {
    toast.info('Inspecting snapshot...', 'Validating integrity before restoration.');
    try {
      const preflight = await preflightValidateAction(b.url);
      if (!preflight.valid || !preflight.summary) {
        toast.error('Invalid Backup Snapshot', preflight.error || 'Snapshot validation failed.');
        return;
      }

      setPreflightData({
        source: b.url,
        title: b.pathname.split('/').pop() || 'Remote Snapshot',
        result: preflight,
      });
      setConfirmInput('');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to inspect remote snapshot.');
    }
  };

  /**
   * EXECUTE RESTORE ONCE PREFLIGHT AND USER CONFIRMATION ARE SATISFIED
   */
  const handleExecuteRestore = async () => {
    if (!preflightData) return;
    if (confirmInput.trim().toUpperCase() !== 'RESTORE') {
      toast.error('Confirmation Required', 'You must type RESTORE in capital letters to confirm.');
      return;
    }

    setIsRestoring(true);
    toast.info('Restoring database...', 'Executing atomic transaction. Please do not close or refresh this tab.');

    try {
      const res = await restoreBackup(preflightData.source);
      if (res.success) {
        toast.success(
          'Database restored successfully!',
          `Restored ${res.totalRestored} records. Current admin session preserved.`
        );
        setPreflightData(null);
        await loadData();
      } else {
        toast.error('Restore Failed', res.error || 'Failed to restore database.');
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Restore failed';
      toast.error('Restore Failed', msg);
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * DELETE STORED SNAPSHOT
   */
  const handleDeleteSnapshot = async (pathname: string) => {
    if (!window.confirm(`Are you sure you want to delete "${pathname}"?`)) return;

    try {
      const res = await deleteBackup(pathname);
      if (res.success) {
        toast.success('Snapshot deleted.');
        await loadData();
      } else {
        toast.error('Delete failed', res.error || 'Could not delete backup snapshot.');
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to delete snapshot.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const isBusy = isCreating || isDownloading || isRestoring || isUploading;

  return (
    <div style={{ color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ─── FULL-SCREEN SPINNER DURING BLOCKING OPERATIONS ─── */}
      {isBusy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 7, 8, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38BDF8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1rem', fontWeight: 600, color: '#38BDF8' }}>
            {isDownloading
              ? 'GENERATING & DOWNLOADING BACKUP...'
              : isRestoring
              ? 'RESTORING DATABASE (TRANSACTION IN PROGRESS)...'
              : isCreating
              ? 'CREATING CLOUD SNAPSHOT...'
              : 'INSPECTING FILE...'}
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
            Do not refresh or navigate away from this page.
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ─── TARGET DATABASE STATUS BANNER ─── */}
      {dbStatus && (
        <div
          style={{
            backgroundColor: dbStatus.isProduction ? 'rgba(239, 68, 68, 0.08)' : 'rgba(20, 184, 166, 0.08)',
            border: `1px solid ${dbStatus.isProduction ? 'rgba(239, 68, 68, 0.3)' : 'rgba(20, 184, 166, 0.3)'}`,
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{dbStatus.isProduction ? '🛡️' : '💻'}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: dbStatus.isProduction ? '#F87171' : '#5EEAD4' }}>
                TARGET DATABASE: {dbStatus.label}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                Status: {dbStatus.isConnected ? 'Connected & Operational' : 'Offline / Unreachable'} | Active records:{' '}
                {dbStatus.sampleRecordCount}
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.72rem',
              backgroundColor: dbStatus.isProduction ? 'rgba(239, 68, 68, 0.2)' : 'rgba(20, 184, 166, 0.2)',
              color: dbStatus.isProduction ? '#FCA5A5' : '#5EEAD4',
              padding: '0.35rem 0.75rem',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            {dbStatus.isProduction ? 'PRODUCTION ENVIRONMENT' : 'LOCAL ENVIRONMENT'}
          </div>
        </div>
      )}

      {/* ─── ACTIONS TOOLBAR ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#071214',
          border: '1px solid rgba(22, 119, 255, 0.2)',
          borderRadius: '8px',
          padding: '1.25rem',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600 }}>
            Database Operations
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8' }}>
            Download live snapshots directly or restore a previous verified state.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* PRIMARY: DOWNLOAD BACKUP (.JSON) */}
          <button
            onClick={handleDirectExport}
            disabled={isBusy}
            style={{
              backgroundColor: '#1677FF',
              color: '#FFFFFF',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(22, 119, 255, 0.35)',
            }}
          >
            <span>↓</span> DOWNLOAD BACKUP (.JSON)
          </button>

          {/* SECONDARY: RESTORE FROM FILE */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#F87171',
              padding: '0.6rem 1.15rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid rgba(239, 68, 68, 0.35)',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <span>↺</span> RESTORE FROM FILE
          </button>

          {/* TERTIARY: SAVE CLOUD SNAPSHOT */}
          <button
            onClick={handleCreateSnapshot}
            disabled={isBusy}
            style={{
              backgroundColor: 'transparent',
              color: '#38BDF8',
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            + CLOUD SNAPSHOT
          </button>
        </div>
      </div>

      {/* ─── CLOUD SNAPSHOT ARCHIVES TABLE ─── */}
      <div
        style={{
          backgroundColor: '#071214',
          border: '1px solid rgba(22, 119, 255, 0.15)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF' }}>
            Cloud Snapshot History ({backups.length})
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#38BDF8',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            REFRESH
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(2, 7, 8, 0.6)', borderBottom: '1px solid rgba(22, 119, 255, 0.15)' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                SNAPSHOT CREATED
              </th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                SIZE
              </th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', textAlign: 'right' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  Loading snapshot records...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  No stored cloud snapshots found. Use &quot;DOWNLOAD BACKUP (.JSON)&quot; to export your database directly.
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.pathname} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.08)' }}>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.88rem' }}>
                      {new Date(b.uploadedAt).toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: '#64748B',
                        fontFamily: 'var(--font-mono, monospace)',
                        marginTop: '0.2rem',
                      }}
                    >
                      {b.pathname.split('/').pop()}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                    {formatSize(b.size)}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDownloadStored(b)}
                        disabled={isBusy}
                        style={{
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38BDF8',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                        }}
                      >
                        DOWNLOAD
                      </button>
                      <button
                        onClick={() => handleSelectStoredForRestore(b)}
                        disabled={isBusy}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                        }}
                      >
                        RESTORE
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(b.pathname)}
                        disabled={isBusy}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#64748B',
                          padding: '0.35rem 0.5rem',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── PREFLIGHT INSPECTOR & DESTRUCTIVE RESTORE MODAL ─── */}
      {preflightData && preflightData.result.summary && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 7, 8, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#071214',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              maxWidth: '640px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.7rem',
                    color: '#EF4444',
                    letterSpacing: '0.15em',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  ⚠️ PREFLIGHT SAFETY INSPECTOR
                </span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Restore Database Snapshot
                </h3>
              </div>
              <button
                onClick={() => setPreflightData(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Target Warning */}
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#FCA5A5',
                lineHeight: 1.5,
              }}
            >
              <strong>CRITICAL WARNING:</strong> Restoring will wipe existing database records and replace them
              with data from this snapshot. Your current admin account credentials will be preserved so you
              remain logged in.
            </div>

            {/* Inspection Details */}
            <div
              style={{
                backgroundColor: 'rgba(2, 7, 8, 0.6)',
                border: '1px solid rgba(22, 119, 255, 0.15)',
                borderRadius: '8px',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.85rem',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <span style={{ color: '#64748B' }}>Source File:</span>
                <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{preflightData.title}</div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Snapshot Created:</span>
                <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
                  {new Date(preflightData.result.summary.timestamp).toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Format Version:</span>
                <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
                  v{preflightData.result.summary.formatVersion}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Integrity Status:</span>
                <div style={{ color: preflightData.result.summary.checksumVerified ? '#5EEAD4' : '#FCD34D', fontWeight: 600 }}>
                  {preflightData.result.summary.checksumVerified
                    ? '✓ SHA-256 Checksum Verified'
                    : 'Legacy Unsigned Backup'}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748B' }}>Total Records to Restore:</span>
                <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.95rem' }}>
                  {preflightData.result.summary.totalRecords} records across{' '}
                  {Object.keys(preflightData.result.summary.tableCounts).length} tables
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Type <strong style={{ color: '#EF4444' }}>RESTORE</strong> to confirm destructive restoration:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="RESTORE"
                style={{
                  backgroundColor: 'rgba(2, 7, 8, 0.8)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setPreflightData(null)}
                disabled={isRestoring}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={confirmInput.trim().toUpperCase() !== 'RESTORE' || isRestoring}
                style={{
                  backgroundColor:
                    confirmInput.trim().toUpperCase() === 'RESTORE' && !isRestoring
                      ? '#EF4444'
                      : 'rgba(239, 68, 68, 0.3)',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor:
                    confirmInput.trim().toUpperCase() === 'RESTORE' && !isRestoring
                      ? 'pointer'
                      : 'not-allowed',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {isRestoring ? 'RESTORING...' : 'CONFIRM & RESTORE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
