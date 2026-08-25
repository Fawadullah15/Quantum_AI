'use client';

import React from 'react';
import Link from 'next/link';

export interface PageHeaderProps {
  tag?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  tag,
  title,
  description,
  backHref,
  backLabel = 'Back',
  actions,
}: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '1.75rem',
        borderBottom: '1px solid rgba(22, 119, 255, 0.12)',
        paddingBottom: '1.25rem',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {backHref && (
          <Link
            href={backHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#38BDF8',
              backgroundColor: 'rgba(22, 119, 255, 0.1)',
              border: '1px solid rgba(22, 119, 255, 0.25)',
              padding: '0.35rem 0.75rem',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'var(--font-mono, monospace)',
              marginBottom: '0.75rem',
            }}
          >
            ← {backLabel}
          </Link>
        )}

        {tag && (
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              color: '#1677FF',
              textTransform: 'uppercase',
              marginBottom: '0.3rem',
              fontWeight: 600,
            }}
          >
            {tag}
          </div>
        )}

        <h1
          style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
            fontWeight: 700,
            color: '#F8FAFC',
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              fontSize: '0.85rem',
              color: '#94A3B8',
              maxWidth: '680px',
              margin: 0,
              lineHeight: 1.5,
              fontWeight: 300,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
