'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('System error:', error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#7f1d1d', opacity: 0.5, userSelect: 'none', marginBottom: '1rem' }}>ERR</div>
      
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', marginBottom: '1rem' }}>SYSTEM ERROR</h1>
      <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3rem', maxWidth: '28rem' }}>
        {error.message || 'A critical failure occurred in this module.'}
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => reset()}
          style={{ padding: '1rem 2rem', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
        >
          Reboot Module
        </button>
        <Link href="/" style={{ padding: '1rem 2rem', border: '1px solid var(--color-border)', color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', textDecoration: 'none' }}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
