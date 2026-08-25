'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  createdAt: string;
};

export default function MediaLibrary({
  onSelect,
  selectable = false,
}: {
  onSelect?: (item: MediaItem) => void;
  selectable?: boolean;
}) {
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'DOC'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'SIZE_DESC' | 'SIZE_ASC' | 'NAME'>('NEWEST');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
      toast.error('Failed to load media assets.', 'Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.warning('File exceeds the 10MB size limit.', 'File Too Large');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const newMedia = await res.json();
      setMedia((prev) => [newMedia, ...prev]);
      setShowUploader(false);
      setSelectedFile(null);
      toast.success(`Asset "${newMedia.filename}" uploaded successfully!`, 'Uploaded');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err?.message || 'Failed to upload media asset.', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    const confirmed = await confirm({
      title: 'Delete Media Asset',
      message: `Are you sure you want to permanently delete "${filename}"? If this image is used on any Case Study, Product, or Service page, it will be removed.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        const res = await fetch(`/api/media/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Delete failed');

        setMedia((prev) => prev.filter((m) => m.id !== id));
        if (previewItem?.id === id) setPreviewItem(null);
        toast.success(`"${filename}" was deleted.`, 'Asset Deleted');
      } catch (err) {
        toast.error('Failed to delete media asset.', 'Error');
      }
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.info('Direct asset URL copied to clipboard!', 'URL Copied');
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Filter & Sorting Logic
  const filteredMedia = media
    .filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.filename.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q);

      let matchesType = true;
      if (typeFilter === 'IMAGE') matchesType = item.type.startsWith('image/');
      else if (typeFilter === 'VIDEO') matchesType = item.type.startsWith('video/');
      else if (typeFilter === 'DOC') matchesType = item.type.includes('pdf') || item.type.includes('document');

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'SIZE_DESC') return b.size - a.size;
      if (sortBy === 'SIZE_ASC') return a.size - b.size;
      if (sortBy === 'NAME') return a.filename.localeCompare(b.filename);
      return 0;
    });

  return (
    <div style={{ color: '#F8FAFC', width: '100%' }}>
      {/* Top Toolbar */}
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
        <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '260px', maxWidth: '640px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '180px' }}>
            <input
              type="text"
              placeholder="Search assets by filename, type..."
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

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(['ALL', 'IMAGE', 'VIDEO', 'DOC'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                style={{
                  backgroundColor: typeFilter === t ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                  border: typeFilter === t ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                  color: typeFilter === t ? '#FFFFFF' : '#94A3B8',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {t === 'ALL' ? 'ALL' : t === 'IMAGE' ? 'IMAGES' : t === 'VIDEO' ? 'VIDEOS' : 'DOCS'}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
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
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="SIZE_DESC">Largest Size</option>
            <option value="SIZE_ASC">Smallest Size</option>
            <option value="NAME">Name (A-Z)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              style={{
                background: viewMode === 'GRID' ? '#1677FF' : 'transparent',
                border: 'none',
                color: viewMode === 'GRID' ? '#FFFFFF' : '#94A3B8',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
              title="Grid View"
            >
              ⊞ Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              style={{
                background: viewMode === 'LIST' ? '#1677FF' : 'transparent',
                border: 'none',
                color: viewMode === 'LIST' ? '#FFFFFF' : '#94A3B8',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
              title="List View"
            >
              ☰ List
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowUploader(!showUploader)}
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
            <span>{showUploader ? '✕' : '+'}</span> {showUploader ? 'CANCEL' : 'UPLOAD ASSET'}
          </button>
        </div>
      </div>

      {/* Uploader Dropzone */}
      {showUploader && (
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.85)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(22, 119, 255, 0.4)',
              borderRadius: '8px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
              transition: 'border-color 0.2s',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/*,video/*,application/pdf"
            />
            {selectedFile ? (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                <p style={{ fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.25rem 0' }}>{selectedFile.name}</p>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, fontFamily: 'var(--font-mono, monospace)' }}>
                  {formatBytes(selectedFile.size)} · Click or Drop another file to change
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☁️</div>
                <p style={{ fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.25rem 0' }}>
                  Drag &amp; Drop media files here, or click to browse
                </p>
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, fontFamily: 'var(--font-mono, monospace)' }}>
                  Supports JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF up to 10MB
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.5rem 1rem',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.5rem 1.45rem',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {isUploading ? 'Uploading to Storage...' : 'Confirm Upload'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Asset View */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '180px',
                backgroundColor: 'rgba(6, 21, 43, 0.75)',
                borderRadius: '8px',
                border: '1px solid rgba(22, 119, 255, 0.12)',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <EmptyState
          icon="🖼️"
          title="No media assets found"
          description={
            searchQuery || typeFilter !== 'ALL'
              ? 'No media assets match your active search and filter criteria.'
              : 'Upload corporate photography, diagrams, logos, and case study hero assets.'
          }
          action={
            <button
              type="button"
              onClick={() => setShowUploader(true)}
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
              + Upload First Asset
            </button>
          }
        />
      ) : viewMode === 'GRID' ? (
        /* GRID VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.75)',
                border: '1px solid rgba(22, 119, 255, 0.18)',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Asset Thumbnail Box */}
              <div
                onClick={() => (selectable && onSelect ? onSelect(item) : setPreviewItem(item))}
                style={{
                  height: '140px',
                  backgroundColor: '#030712',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {item.type.startsWith('image/') ? (
                  <Image
                    src={item.url}
                    alt={item.filename}
                    fill
                    sizes="240px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : item.type.startsWith('video/') ? (
                  <span style={{ fontSize: '2.5rem' }}>🎥</span>
                ) : (
                  <span style={{ fontSize: '2.5rem' }}>📄</span>
                )}
              </div>

              {/* Asset Metadata */}
              <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div
                    title={item.filename}
                    style={{
                      fontWeight: 600,
                      color: '#F8FAFC',
                      fontSize: '0.82rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.filename}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                    <span>{formatBytes(item.size)}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.65rem', borderTop: '1px solid rgba(22, 119, 255, 0.1)', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    title="Preview Asset"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(22, 119, 255, 0.12)',
                      border: '1px solid rgba(22, 119, 255, 0.25)',
                      color: '#38BDF8',
                      padding: '0.3rem 0.45rem',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    Inspect
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.url)}
                    title="Copy Public URL"
                    style={{
                      backgroundColor: 'rgba(22, 119, 255, 0.12)',
                      border: '1px solid rgba(22, 119, 255, 0.25)',
                      color: '#CBD5E1',
                      padding: '0.3rem 0.55rem',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    🔗
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.filename)}
                    title="Delete Asset"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#F87171',
                      padding: '0.3rem 0.55rem',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.75)',
            border: '1px solid rgba(22, 119, 255, 0.18)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.8)', borderBottom: '1px solid rgba(22, 119, 255, 0.18)' }}>
                  <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Asset &amp; Preview
                  </th>
                  <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Type
                  </th>
                  <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Size
                  </th>
                  <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Uploaded
                  </th>
                  <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                    <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '36px',
                            borderRadius: '4px',
                            backgroundColor: '#030712',
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.type.startsWith('image/') ? (
                            <Image
                              src={item.url}
                              alt={item.filename}
                              fill
                              sizes="44px"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.1rem' }}>📄</span>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.88rem' }}>
                            {item.filename}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'var(--font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                            {item.url}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                      <span style={{ backgroundColor: 'rgba(22, 119, 255, 0.12)', border: '1px solid rgba(22, 119, 255, 0.25)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', color: '#CBD5E1', fontFamily: 'var(--font-mono, monospace)' }}>
                        {item.type}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem', color: '#94A3B8' }}>
                      {formatBytes(item.size)}
                    </td>

                    <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem', color: '#94A3B8' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          style={{
                            backgroundColor: 'rgba(22, 119, 255, 0.15)',
                            border: '1px solid rgba(22, 119, 255, 0.35)',
                            color: '#38BDF8',
                            padding: '0.3rem 0.65rem',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono, monospace)',
                          }}
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.url)}
                          style={{
                            backgroundColor: 'rgba(22, 119, 255, 0.15)',
                            border: '1px solid rgba(22, 119, 255, 0.35)',
                            color: '#CBD5E1',
                            padding: '0.3rem 0.55rem',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                          }}
                        >
                          🔗
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.filename)}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#F87171',
                            padding: '0.3rem 0.55rem',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
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

      {/* Interactive Asset Preview Modal */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#06152B',
              border: '1px solid rgba(22, 119, 255, 0.3)',
              borderRadius: '12px',
              padding: '1.75rem',
              maxWidth: '680px',
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewItem.filename}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Preview Stage */}
            <div
              style={{
                width: '100%',
                maxHeight: '340px',
                backgroundColor: '#030712',
                borderRadius: '8px',
                border: '1px solid rgba(22, 119, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {previewItem.type.startsWith('image/') ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.filename}
                  style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain' }}
                />
              ) : previewItem.type.startsWith('video/') ? (
                <video src={previewItem.url} controls style={{ maxWidth: '100%', maxHeight: '340px' }} />
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ fontSize: '3rem' }}>📄</div>
                  <p style={{ marginTop: '0.5rem' }}>Document Asset ({previewItem.type})</p>
                </div>
              )}
            </div>

            {/* Asset Details */}
            <div style={{ backgroundColor: 'rgba(3, 7, 18, 0.6)', padding: '0.85rem 1rem', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono, monospace)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Size: </span>
                <span style={{ color: '#F8FAFC' }}>{formatBytes(previewItem.size)}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>MIME: </span>
                <span style={{ color: '#38BDF8' }}>{previewItem.type}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Uploaded: </span>
                <span style={{ color: '#F8FAFC' }}>{new Date(previewItem.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Public URL Box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Direct CDN / Storage URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={previewItem.url}
                  style={{
                    flex: 1,
                    backgroundColor: '#030712',
                    border: '1px solid rgba(22, 119, 255, 0.2)',
                    borderRadius: 6,
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.78rem',
                    color: '#38BDF8',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(previewItem.url)}
                  style={{
                    backgroundColor: '#1677FF',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0.5rem 1rem',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Copy URL
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#38BDF8',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ↗ Open Original Asset
              </a>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleDelete(previewItem.id, previewItem.filename)}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#F87171',
                    padding: '0.45rem 0.95rem',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Delete Asset
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#94A3B8',
                    padding: '0.45rem 0.95rem',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
