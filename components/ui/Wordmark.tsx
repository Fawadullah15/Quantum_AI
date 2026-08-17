import React from 'react';

export interface WordmarkProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Wordmark({ className = '', style, ...props }: WordmarkProps) {
  return (
    <div 
      className={`wordmark ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        ...style
      }}
      {...props}
    >
      <span style={{
        fontWeight: 800,
        letterSpacing: '0.15em',
        color: 'var(--color-text-primary)',
        textTransform: 'uppercase'
      }}>
        QUANTUM
      </span>
      <span style={{
        fontWeight: 900,
        letterSpacing: '0.05em',
        background: 'linear-gradient(to bottom right, #20A8FF, #1677FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textTransform: 'uppercase'
      }}>
        AI
      </span>
    </div>
  );
}
