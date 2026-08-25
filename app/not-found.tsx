import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The requested system path does not exist on Quantum AI.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{ fontSize: '12rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--color-surface)', opacity: 0.5, userSelect: 'none' }}>404</div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--color-primary)', boxShadow: '0 0 30px rgba(var(--color-primary-rgb),0.8)' }}></div>
        </div>
      </div>
      
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)', marginBottom: '1rem' }}>PAGE NOT FOUND</h1>
      <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3rem', maxWidth: '28rem' }}>
        This part of the system does not exist or has been relocated.
      </p>
      
      <Link href="/" style={{ padding: '1rem 2rem', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', textDecoration: 'none' }}>
        Return to Core
      </Link>
    </div>
  );
}
