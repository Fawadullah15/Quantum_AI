'use client';

import React from 'react';

export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon = '📦',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(6, 21, 43, 0.65)',
        border: '1px solid rgba(22, 119, 255, 0.18)',
        borderRadius: '12px',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', lineHeight: 1 }}>
        {icon}
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#F8FAFC', margin: '0 0 0.4rem 0' }}>
        {title}
      </h3>

      {description && (
        <p
          style={{
            color: '#94A3B8',
            fontSize: '0.85rem',
            maxWidth: '440px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.55,
            fontWeight: 300,
          }}
        >
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}
