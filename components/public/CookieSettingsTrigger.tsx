'use client';

import React from 'react';
import { openCookiePreferencesModal } from '@/lib/consent';

export function CookieSettingsTrigger({
  label = 'Open Cookie Settings',
  className,
  style,
}: {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferencesModal()}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1.25rem',
        backgroundColor: '#14B8A6',
        color: '#030712',
        border: '1px solid #14B8A6',
        borderRadius: '6px',
        fontFamily: 'var(--font-d-din)',
        fontSize: '0.8125rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background-color 0.2s, transform 0.1s',
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2DD4BF')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14B8A6')}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01" />
        <path d="M16 15.5v.01" />
        <path d="M12 12v.01" />
        <path d="M11 17v.01" />
        <path d="M7 14v.01" />
      </svg>
      {label}
    </button>
  );
}
