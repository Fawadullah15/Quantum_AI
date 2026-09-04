'use client';

import React, { useState, useEffect } from 'react';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import { createBackup, listBackups, deleteBackup, restoreBackup, uploadBackup } from './actions';

interface BackupRecord {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

export default function BackupClient() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    setIsLoading(true);
    const res = await listBackups();
    if (res.success && res.backups) {
      setBackups(res.backups);
    } else {
      toast.error(res.error || 'Failed to fetch backups');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    toast.info('Creating backup...', 'This may take a moment.');
    const res = await createBackup();
    if (res.success) {
      toast.success('Backup completed successfully!');
      fetchBackups();
    } else {
      toast.error(res.error || 'Backup creation failed');
    }
    setIsCreating(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await confirm({
      title: 'Upload External Backup',
      message: 'You are about to upload an external backup file. After uploading, you will still need to manually click "Restore" to apply it to the database.',
      confirmText: 'Upload File',
      confirmVariant: 'primary',
    });

    if (!confirmed) {
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    toast.info('Uploading backup file...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadBackup(formData);
      
      if (res.success) {
        toast.success('Backup file uploaded successfully. You can now restore it.');
        fetchBackups();
      } else {
        toast.error(res.error || 'Failed to upload backup file.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Upload failed. The file might be too large (max 15MB) or network disconnected.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRestore = async (b: BackupRecord) => {
    const confirmed = await confirm({
      title: 'CRITICAL WARNING: Restore Backup',
      message: 'Restoring this backup will COMPLETELY WIPE the current database and replace it with the data from this backup. All new data since this backup will be PERMANENTLY LOST. Are you absolutely sure you want to proceed?',
      confirmText: 'YES, WIPE AND RESTORE',
      confirmVariant: 'danger',
    });
    
    if (!confirmed) return;

    // Optional safety: auto-backup before restore
    toast.info('Creating safety backup before restore...');
    await createBackup();

    setIsRestoring(true);
    toast.info('Restoring database...', 'Please wait. Do not close this page.');
    
    const res = await restoreBackup(b.url);
    if (res.success) {
      toast.success('Database restored successfully!', 'The system has been reverted to the selected state.');
    } else {
      toast.error(res.error || 'Database restoration failed. Some data might be incomplete.');
    }
    setIsRestoring(false);
    fetchBackups();
  };

  const handleDelete = async (pathname: string) => {
    const confirmed = await confirm({
      title: 'Delete Backup',
      message: 'Are you sure you want to permanently delete this backup file? This action cannot be undone.',
      confirmText: 'Delete Backup',
      confirmVariant: 'danger',
    });
    
    if (!confirmed) return;

    const res = await deleteBackup(pathname);
    if (res.success) {
      toast.success('Backup deleted.');
      fetchBackups();
    } else {
      toast.error(res.error || 'Failed to delete backup');
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info('Starting download...', 'Fetching file');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download backup file.', 'Download Error');
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  return (
    <div style={{ color: '#F8FAFC' }}>
      {(isCreating || isRestoring || isUploading) && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(22, 119, 255, 0.2)', borderTopColor: '#38BDF8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ marginTop: '1.5rem', fontFamily: 'var(--font-mono, monospace)', color: '#38BDF8' }}>
            {isCreating ? 'CREATING BACKUP...' : isRestoring ? 'RESTORING DATABASE...' : 'UPLOADING...'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Please do not close this window.</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>System Backups</h2>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isCreating || isRestoring || isUploading}
            style={{
              backgroundColor: 'transparent',
              color: '#38BDF8',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid rgba(56, 189, 248, 0.35)',
              cursor: isCreating || isRestoring || isUploading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            UPLOAD BACKUP
          </button>

          <button
            onClick={handleCreate}
            disabled={isCreating || isRestoring || isUploading}
            style={{
              backgroundColor: '#1677FF',
              color: '#FFFFFF',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              cursor: isCreating || isRestoring || isUploading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isCreating ? 'CREATING...' : '+ CREATE NEW BACKUP'}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.4)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.6)', borderBottom: '1px solid rgba(22, 119, 255, 0.15)' }}>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>BACKUP DATE</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>SIZE</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Loading backups...</td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No backups found. Create one to get started.</td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.pathname} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{new Date(b.uploadedAt).toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)', marginTop: '0.2rem' }}>{b.pathname.split('/').pop()}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#CBD5E1', fontSize: '0.85rem' }}>
                    {formatSize(b.size)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDownload(b.url, b.pathname.split('/').pop() || 'backup.json')}
                        style={{
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38BDF8',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        DOWNLOAD
                      </button>
                      <button
                        onClick={() => handleRestore(b)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#F87171',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        RESTORE
                      </button>
                      <button
                        onClick={() => handleDelete(b.pathname)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#64748B',
                          padding: '0.35rem 0.5rem',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          cursor: 'pointer',
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
    </div>
  );
}
