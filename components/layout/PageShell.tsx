import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Whether to add standard top padding to clear the fixed global header */
  withHeaderClearance?: boolean;
}

/**
 * A reusable page shell component for Phase 2 global layout standardization.
 * Future page redesigns should wrap their content in this to automatically
 * inherit correct global container sizing and standard header clearance.
 */
export function PageShell({ children, className = '', withHeaderClearance = true }: PageShellProps) {
  return (
    <main 
      className={`q-container ${withHeaderClearance ? 'pt-24 md:pt-32 pb-16 md:pb-24' : ''} ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}
    >
      {children}
    </main>
  );
}
