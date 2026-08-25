'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  'aria-label'?: string;
}

// ─── NovaButton — Primary CTA with animated liquid blue edge ─────────────────

export function NovaButton({ href, children, onClick, className = '', style, type = 'button', disabled, ...rest }: ButtonProps) {
  const reduce = useReducedMotion();

  const inner = (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', zIndex: 2, gap: '0.5rem' }}>
      {children}
    </span>
  );

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
    color: '#F8FAFF',
    borderRadius: 999,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    overflow: 'hidden',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    background: 'transparent',
    ...style,
  };

  const content = (
    <>
      {/* Spinning edge ring */}
      <span style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 999,
        overflow: 'hidden',
        zIndex: 0,
      }}>
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: reduce
            ? 'rgba(79, 70, 229, 0.6)'
            : undefined,
          animation: reduce ? 'none' : 'novaSpin 3s linear infinite',
          backgroundImage: reduce ? undefined : 'conic-gradient(from var(--nova-angle, 0deg), transparent 0%, transparent 60%, #4F46E5 80%, #3B82F6 90%, transparent 100%)',
        }} />
      </span>

      {/* Surface */}
      <span style={{
        position: 'absolute',
        inset: '1.5px',
        borderRadius: 999,
        backgroundColor: '#020F25',
        zIndex: 1,
        overflow: 'hidden',
      }}>
        {/* Shine on hover */}
        <span className="nova-shine" style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(120deg, transparent 30%, rgba(85,214,255,0.12) 50%, transparent 70%)',
          transform: 'translateX(-100%)',
          transition: 'transform 0.6s ease',
        }} />
      </span>

      {/* Text */}
      <span style={{
        position: 'relative',
        zIndex: 2,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        {children}
      </span>
    </>
  );

  const motionProps = {
    whileHover: !reduce && !disabled ? { scale: 1.02 } : {},
    whileTap: !reduce && !disabled ? { scale: 0.98 } : {},
    onHoverStart: (e: any) => {
      const shine = e.target?.closest?.('.nova-btn')?.querySelector?.('.nova-shine');
      if (shine) shine.style.transform = 'translateX(100%)';
      const el = e.target?.closest?.('.nova-btn');
      if (el) el.style.boxShadow = '0 0 20px rgba(79, 70, 229, 0.4)';
    },
    onHoverEnd: (e: any) => {
      const shine = e.target?.closest?.('.nova-btn')?.querySelector?.('.nova-shine');
      if (shine) { shine.style.transition = 'none'; shine.style.transform = 'translateX(-100%)'; setTimeout(() => { shine.style.transition = 'transform 0.6s ease'; }, 50); }
      const el = e.target?.closest?.('.nova-btn');
      if (el) el.style.boxShadow = 'none';
    },
  };

  if (href) {
    const MotionLink = motion(Link);
    return (
      <MotionLink
        href={href}
        className={`nova-btn ${className}`}
        style={baseStyle}
        {...motionProps}
        {...(rest as any)}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`nova-btn ${className}`}
      style={baseStyle}
      {...motionProps}
      {...(rest as any)}
    >
      {content}
    </motion.button>
  );
}

// ─── GalaxyButton — Secondary CTA with star-field hover ──────────────────────

export function GalaxyButton({ href, children, onClick, className = '', style, type = 'button', disabled, ...rest }: ButtonProps) {
  const reduce = useReducedMotion();
  const btnRef = useRef<HTMLElement | null>(null);

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
    color: '#E2E8F0',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    overflow: 'hidden',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    background: '#06152B',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    transition: 'box-shadow 0.3s, border-color 0.3s',
    ...style,
  };

  const content = (
    <>
      {/* Galaxy background */}
      <span className="galaxy-bg" style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        opacity: 0,
        transition: reduce ? 'none' : 'opacity 0.5s ease',
        backgroundImage: [
          'radial-gradient(circle at 30% 40%, rgba(124, 58, 237, 0.25) 0%, transparent 50%)',
          'radial-gradient(circle at 70% 60%, rgba(79, 70, 229, 0.2) 0%, transparent 50%)',
          'radial-gradient(1.5px 1.5px at 18% 22%, rgba(255,255,255,0.85), transparent)',
          'radial-gradient(1px 1px at 75% 35%, rgba(255,255,255,0.7), transparent)',
          'radial-gradient(2px 2px at 55% 78%, rgba(255,255,255,0.6), transparent)',
          'radial-gradient(1px 1px at 28% 68%, rgba(255,255,255,0.9), transparent)',
          'radial-gradient(1.5px 1.5px at 48% 18%, rgba(255,255,255,0.55), transparent)',
          'radial-gradient(1px 1px at 88% 88%, rgba(255,255,255,0.65), transparent)',
          'radial-gradient(1.5px 1.5px at 8% 82%, rgba(255,255,255,0.5), transparent)',
        ].join(', '),
      }} />

      {/* Text */}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </>
  );

  const motionProps = {
    whileHover: !reduce && !disabled ? { scale: 1.02 } : {},
    whileTap: !reduce && !disabled ? { scale: 0.98 } : {},
    onHoverStart: (e: any) => {
      const el = e.target?.closest?.('.galaxy-btn');
      if (!el) return;
      const bg = el.querySelector('.galaxy-bg');
      if (bg) bg.style.opacity = '1';
      el.style.borderColor = 'rgba(124, 58, 237, 0.35)';
      el.style.boxShadow = '0 6px 32px rgba(124, 58, 237, 0.2)';
    },
    onHoverEnd: (e: any) => {
      const el = e.target?.closest?.('.galaxy-btn');
      if (!el) return;
      const bg = el.querySelector('.galaxy-bg');
      if (bg) bg.style.opacity = '0';
      el.style.borderColor = 'rgba(255,255,255,0.1)';
      el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    },
  };

  if (href) {
    const MotionLink = motion(Link);
    return (
      <MotionLink
        href={href}
        className={`galaxy-btn ${className}`}
        style={baseStyle}
        {...motionProps}
        {...(rest as any)}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`galaxy-btn ${className}`}
      style={baseStyle}
      {...motionProps}
      {...(rest as any)}
    >
      {content}
    </motion.button>
  );
}

// ─── Global Button Styles ─────────────────────────────────────────────────────
// Inject once into the document
const BUTTON_STYLES = `
  @property --nova-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes novaSpin {
    to { --nova-angle: 360deg; }
  }
`;

export function ButtonStyles() {
  return <style suppressHydrationWarning>{BUTTON_STYLES}</style>;
}
