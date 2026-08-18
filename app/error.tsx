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
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.3em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '1rem' }}>QUANTUM AI</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '1rem' }}>Something went wrong</h1>
        <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: '28rem', lineHeight: 1.7, margin: '0 auto 2.5rem' }}>We encountered an unexpected error. Our team has been notified. Please try again or return to the homepage.</p>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => reset()}
          style={{ padding: '0.875rem 2rem', backgroundColor: '#1677FF', color: 'white', fontWeight: 600, fontSize: '0.875rem', border: 'none', borderRadius: 8, cursor: 'pointer', letterSpacing: '0.05em' }}
        >
          Try Again
        </button>
        <Link href="/" style={{ padding: '0.875rem 2rem', border: '1px solid rgba(22,119,255,0.3)', color: '#94A3B8', fontWeight: 600, fontSize: '0.875rem', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
