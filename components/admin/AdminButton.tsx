'use client';

import React from 'react';
import Link from 'next/link';

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  href?: string;
  target?: string;
}

export default function AdminButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  href,
  target,
  disabled,
  style,
  className = '',
  ...props
}: AdminButtonProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#1677FF',
          color: '#FFFFFF',
          border: '1px solid transparent',
          boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(22, 119, 255, 0.15)',
          color: '#38BDF8',
          border: '1px solid rgba(22, 119, 255, 0.35)',
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: '#F87171',
          border: '1px solid rgba(239, 68, 68, 0.35)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#CBD5E1',
          border: '1px solid rgba(148, 163, 184, 0.3)',
        };
      case 'ghost':
      default:
        return {
          backgroundColor: 'transparent',
          color: '#94A3B8',
          border: '1px solid transparent',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.35rem 0.65rem',
          fontSize: '0.75rem',
          borderRadius: '5px',
        };
      case 'lg':
        return {
          padding: '0.65rem 1.45rem',
          fontSize: '0.9rem',
          borderRadius: '8px',
        };
      case 'md':
      default:
        return {
          padding: '0.48rem 1rem',
          fontSize: '0.82rem',
          borderRadius: '6px',
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono, monospace)',
    letterSpacing: '0.03em',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.65 : 1,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    boxSizing: 'border-box',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  const content = (
    <>
      {isLoading ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spinButton 0.6s linear infinite',
          }}
        />
      ) : (
        icon && <span style={{ fontSize: '0.95em' }}>{icon}</span>
      )}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} target={target} style={baseStyles} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled || isLoading}
      style={baseStyles}
      className={className}
      {...props}
    >
      {content}
      <style>{`
        @keyframes spinButton {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
