'use client';

import React from 'react';

export type StatusType =
  | 'NEW'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PUBLISHED'
  | 'DRAFT'
  | 'PENDING'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const norm = String(status || '').toUpperCase();

  const getStyle = () => {
    switch (norm) {
      case 'NEW':
      case 'LIVE':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.35)' };
      case 'ACTIVE':
      case 'PUBLISHED':
      case 'RESOLVED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.35)' };
      case 'CONTACTED':
      case 'PENDING':
      case 'DRAFT':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.35)' };
      case 'CLOSED':
      case 'ARCHIVED':
      case 'INACTIVE':
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8', border: 'rgba(100, 116, 139, 0.35)' };
    }
  };

  const st = getStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '0.15rem 0.4rem' : '0.2rem 0.55rem',
        borderRadius: '4px',
        fontSize: size === 'sm' ? '0.62rem' : '0.68rem',
        fontWeight: 700,
        fontFamily: 'var(--font-mono, monospace)',
        letterSpacing: '0.05em',
        backgroundColor: st.bg,
        color: st.text,
        border: `1px solid ${st.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: st.text,
          display: 'inline-block',
        }}
      />
      {label || norm}
    </span>
  );
}
