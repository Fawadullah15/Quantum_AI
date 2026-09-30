'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: React.ReactNode;
}

export function NovaButton({ href, children, onClick, className = '', style, type = 'button', disabled, ...rest }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.7rem 1.75rem',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#FFFFFF',
    borderRadius: 999,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    overflow: 'hidden',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    background: 'transparent',
    maxWidth: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
    ...style,
  };

  const content = (
    <>
      <span className="nova-ring" />
      <span style={{
        position: 'absolute',
        inset: '1.5px',
        borderRadius: 999,
        backgroundColor: '#020708',
        zIndex: 1,
        overflow: 'hidden',
      }}>
        <span className="nova-shine" />
      </span>
      <span style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`nova-btn ${className}`} style={baseStyle} {...(rest as any)}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`nova-btn ${className}`} style={baseStyle} {...(rest as any)}>
      {content}
    </button>
  );
}

export function GalaxyButton({ href, children, onClick, className = '', style, type = 'button', disabled, ...rest }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.7rem 1.75rem',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#FFFFFF',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    overflow: 'hidden',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    background: '#050C0E',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    maxWidth: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
    ...style,
  };

  const content = (
    <>
      <span className="galaxy-bg" style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        backgroundImage: [
          'radial-gradient(circle at 30% 40%, rgba(124, 58, 237, 0.25) 0%, transparent 50%)',
          'radial-gradient(circle at 70% 60%, rgba(15, 118, 110, 0.2) 0%, transparent 50%)',
          'radial-gradient(1.5px 1.5px at 18% 22%, rgba(255,255,255,0.85), transparent)',
          'radial-gradient(1px 1px at 75% 35%, rgba(255,255,255,0.7), transparent)',
          'radial-gradient(2px 2px at 55% 78%, rgba(255,255,255,0.6), transparent)',
          'radial-gradient(1px 1px at 28% 68%, rgba(255,255,255,0.9), transparent)',
          'radial-gradient(1.5px 1.5px at 48% 18%, rgba(255,255,255,0.55), transparent)',
          'radial-gradient(1px 1px at 88% 88%, rgba(255,255,255,0.65), transparent)',
          'radial-gradient(1.5px 1.5px at 8% 82%, rgba(255,255,255,0.5), transparent)',
        ].join(', '),
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`galaxy-btn ${className}`} style={baseStyle} {...(rest as any)}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`galaxy-btn ${className}`} style={baseStyle} {...(rest as any)}>
      {content}
    </button>
  );
}

const BUTTON_STYLES = `
  @property --nova-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes novaSpin {
    to { --nova-angle: 360deg; }
  }
  
  .nova-btn, .galaxy-btn {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease;
  }
  
  .nova-btn:hover:not(:disabled), .galaxy-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }
  
  .nova-btn:active:not(:disabled), .galaxy-btn:active:not(:disabled) {
    transform: scale(0.98);
  }
  
  /* Nova Button specifics */
  .nova-btn:hover:not(:disabled) {
    box-shadow: 0 0 20px rgba(15, 118, 110, 0.4);
  }
  
  .nova-ring {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: conic-gradient(from var(--nova-angle, 0deg), transparent 0%, transparent 60%, #0F766E 80%, #14B8A6 90%, transparent 100%);
    animation: novaSpin 3s linear infinite;
    z-index: 0;
  }
  
  .nova-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(103, 232, 249,0.12) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  .nova-btn:hover:not(:disabled) .nova-shine {
    transform: translateX(100%);
  }
  
  /* Galaxy Button specifics */
  .galaxy-btn:hover:not(:disabled) {
    border-color: rgba(124, 58, 237, 0.35) !important;
    box-shadow: 0 6px 32px rgba(124, 58, 237, 0.2) !important;
  }
  
  .galaxy-bg {
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  
  .galaxy-btn:hover:not(:disabled) .galaxy-bg {
    opacity: 1;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .nova-ring { animation: none; background: rgba(15, 118, 110, 0.6); }
    .nova-btn:hover:not(:disabled), .galaxy-btn:hover:not(:disabled) { transform: none; }
    .nova-btn:active:not(:disabled), .galaxy-btn:active:not(:disabled) { transform: none; }
    .nova-shine { display: none; }
    .galaxy-bg { transition: none; }
  }
`;

export function ButtonStyles() {
  return <style suppressHydrationWarning>{BUTTON_STYLES}</style>;
}
