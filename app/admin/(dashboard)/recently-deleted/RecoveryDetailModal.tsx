'use client';

import React from 'react';
import Link from 'next/link';

interface RecoveryDetailModalProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  isProcessing: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CASE_STUDY: { label: 'Case Study', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.35)' },
  PRODUCT: { label: 'Product', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)' },
  LEADERSHIP: { label: 'Leadership', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.35)' },
  TESTIMONIAL: { label: 'Testimonial', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
  SERVICE: { label: 'Service', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
  TECHNOLOGY: { label: 'Technology', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.35)' },
  BLOG_POST: { label: 'Blog Article', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)' },
  CLIENT: { label: 'Client / Worked With', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.35)' },
  CAREER_APPLICATION: { label: 'Career Application', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.35)' },
  PARTNERSHIP_REQUEST: { label: 'Partnership', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
  CAREER_POSITION: { label: 'Career Opening', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)' },
  CONTACT_SUBMISSION: { label: 'Contact Message', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.35)' },
  MEDIA: { label: 'Media Asset', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.35)' },
  NOTIFICATION: { label: 'Notification', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.35)' },
  TEAM_MEMBER: { label: 'Team Member', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.35)' },
  FOUNDER: { label: 'Founder', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.35)' },
};

export function RecoveryDetailModal({
  item,
  isOpen,
  onClose,
  onRestore,
  onPermanentDelete,
  isProcessing,
}: RecoveryDetailModalProps) {
  if (!isOpen || !item) return null;

  let parsedData: any = {};
  if (typeof item.data === 'string') {
    try {
      parsedData = JSON.parse(item.data);
    } catch {
      parsedData = { raw: item.data };
    }
  } else if (item.data && typeof item.data === 'object') {
    parsedData = item.data;
  }

  let mediaUrls: string[] = [];
  if (Array.isArray(item.mediaUrls)) {
    mediaUrls = item.mediaUrls;
  } else if (typeof item.mediaUrls === 'string') {
    try {
      mediaUrls = JSON.parse(item.mediaUrls);
    } catch {
      mediaUrls = [];
    }
  }

  const config = TYPE_CONFIG[item.entityType] || {
    label: item.entityType,
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
  };

  const formatDate = (val: string | Date | null | undefined) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(val);
    }
  };

  // Identify metrics, features, notes if any
  const metrics = Array.isArray(parsedData.metrics) ? parsedData.metrics : [];
  const features = Array.isArray(parsedData.features) ? parsedData.features : [];
  const notes = Array.isArray(parsedData.notes) ? parsedData.notes : [];

  // Important fields to highlight in attributes
  const primaryKeys = [
    'title', 'name', 'fullName', 'slug', 'publicId', 'referenceId', 'category', 'status',
    'email', 'phone', 'company', 'industry', 'client', 'role', 'position', 'department',
    'location', 'rating', 'workType', 'experienceLevel', 'skills', 'budget', 'budgetRange',
    'year', 'order', 'displayOrder', 'published', 'isActive',
  ];

  const attributeEntries = Object.entries(parsedData).filter(
    ([k, v]) =>
      !['id', 'createdAt', 'updatedAt', 'metrics', 'features', 'notes', 'gallery', 'raw'].includes(k) &&
      typeof v !== 'object' &&
      v !== null &&
      v !== undefined &&
      String(v).length < 200
  );

  const longTextEntries = Object.entries(parsedData).filter(
    ([k, v]) =>
      ['problem', 'solution', 'implementation', 'results', 'technologies', 'description', 'content', 'message', 'introduction', 'whyQuantumAI', 'shortBio', 'fullBio', 'notes'].includes(k) &&
      typeof v === 'string' &&
      v.trim().length > 0
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#070E1E',
          border: '1px solid rgba(22, 119, 255, 0.35)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(6, 182, 212, 0.15)',
          color: '#F8FAFC',
          overflow: 'hidden',
          animation: 'modalSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(7, 14, 30, 0) 100%)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: config.bg,
                  color: config.color,
                  border: `1px solid ${config.border}`,
                }}
              >
                {config.label}
              </span>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#94A3B8',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(148, 163, 184, 0.08)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              >
                {item.originalSection}
              </span>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#34D399',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                }}
              >
                RECOVERABLE
              </span>
            </div>

            <h2 style={{ fontSize: '1.28rem', fontWeight: 700, margin: '0 0 0.2rem 0', color: '#F8FAFC' }}>
              {item.title}
            </h2>
            {item.subtitle && (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8' }}>{item.subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Deletion Context Card */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(22, 119, 255, 0.2)',
              borderRadius: '10px',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)', color: '#64748B', textTransform: 'uppercase' }}>
                DELETED AT
              </div>
              <div style={{ fontSize: '0.84rem', color: '#E2E8F0', fontWeight: 600, marginTop: '0.2rem' }}>
                {formatDate(item.deletedAt)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)', color: '#64748B', textTransform: 'uppercase' }}>
                DELETED BY
              </div>
              <div style={{ fontSize: '0.84rem', color: '#E2E8F0', fontWeight: 600, marginTop: '0.2rem' }}>
                {item.adminName || 'Admin'} {item.adminEmail ? `(${item.adminEmail})` : ''}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)', color: '#64748B', textTransform: 'uppercase' }}>
                ORIGINAL ID
              </div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono, monospace)', color: '#06B6D4', marginTop: '0.2rem' }}>
                {item.originalId}
              </div>
            </div>

            {item.originalSlug && (
              <div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)', color: '#64748B', textTransform: 'uppercase' }}>
                  SLUG / REFERENCE
                </div>
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono, monospace)', color: '#A855F7', marginTop: '0.2rem' }}>
                  {item.originalSlug}
                </div>
              </div>
            )}
          </div>

          {/* Attributes Grid */}
          <div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 700 }}>
              RECORD ATTRIBUTES &amp; METADATA
            </div>
            <div
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.45)',
                border: '1px solid rgba(22, 119, 255, 0.15)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {attributeEntries.map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>
                    {k.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <div style={{ fontSize: '0.82rem', color: '#F8FAFC', fontWeight: 500, wordBreak: 'break-word', marginTop: '0.15rem' }}>
                    {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Long Text / Content Blocks */}
          {longTextEntries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                CONTENT &amp; MESSAGE DETAILS
              </div>
              {longTextEntries.map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.45)',
                    border: '1px solid rgba(22, 119, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.4rem' }}>
                    {k.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Relational Records (Metrics / Features / Notes) */}
          {metrics.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 700 }}>
                PRESERVED METRICS ({metrics.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                {metrics.map((m: any, idx: number) => (
                  <div key={idx} style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#06B6D4' }}>{m.value}</div>
                    <div style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 600 }}>{m.label}</div>
                    {m.description && <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>{m.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {features.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#3B82F6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 700 }}>
                PRESERVED FEATURES ({features.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {features.map((f: any, idx: number) => (
                  <div key={idx} style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#60A5FA' }}>{f.title}</div>
                    {f.description && <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem' }}>{f.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#A855F7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 700 }}>
                PRESERVED NOTES ({notes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notes.map((n: any, idx: number) => (
                  <div key={idx} style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#C084FC', fontFamily: 'var(--font-mono, monospace)' }}>
                      {n.authorName} ({n.authorEmail}) • {formatDate(n.createdAt)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#E2E8F0', marginTop: '0.25rem' }}>{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media & Attachments */}
          {mediaUrls.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#EC4899', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 700 }}>
                ASSOCIATED MEDIA &amp; STORAGE FILES ({mediaUrls.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.65rem' }}>
                {mediaUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(236, 72, 153, 0.25)',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      textDecoration: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {url.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
                      <div
                        style={{
                          width: '100%',
                          height: '75px',
                          borderRadius: '4px',
                          backgroundImage: `url(${url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          marginBottom: '0.35rem',
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.6rem', margin: '0.5rem 0' }}>📄</div>
                    )}
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8', wordBreak: 'break-all', textAlign: 'center', fontFamily: 'var(--font-mono, monospace)' }}>
                      {url.split('/').pop()?.slice(0, 20)}...
                    </span>
                  </a>
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0.4rem 0 0 0' }}>
                Files in storage are preserved and will be automatically reconnected when restored.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(22, 119, 255, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: 'rgba(7, 14, 30, 0.95)',
          }}
        >
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onPermanentDelete(item.id)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              padding: '0.55rem 1rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            Delete Permanently
          </button>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#94A3B8',
                padding: '0.55rem 1.15rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              Close
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onRestore(item.id)}
              style={{
                backgroundColor: '#1677FF',
                border: 'none',
                color: '#FFFFFF',
                padding: '0.55rem 1.4rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 15px rgba(22, 119, 255, 0.4)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {isProcessing ? 'Restoring...' : 'Restore to Original Section'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
