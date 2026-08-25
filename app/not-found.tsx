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
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', color: '#F8FAFC' }}>
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 'clamp(6rem, 15vw, 10rem)', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'rgba(22, 119, 255, 0.15)', userSelect: 'none', lineHeight: 1 }}>
          404
        </div>
      </div>
      
      <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', letterSpacing: '0.2em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
        [SYS.ERROR // PAGE NOT FOUND]
      </div>
      <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#F8FAFC', marginBottom: '0.75rem' }}>
        Page Not Found
      </h1>
      <p style={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 2.5rem', lineHeight: 1.6, fontWeight: 300 }}>
        The system path you requested does not exist, has been relocated, or is no longer available.
      </p>
      
      <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.75rem 1.65rem',
            background: 'linear-gradient(135deg, #1677FF, #0050B3)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            letterSpacing: '0.08em',
            borderRadius: '6px',
            textDecoration: 'none',
            textTransform: 'uppercase',
            boxShadow: '0 4px 16px -2px rgba(22, 119, 255, 0.4)',
          }}
        >
          RETURN HOME
        </Link>
        <Link
          href="/work"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            background: 'rgba(56, 189, 248, 0.08)',
            color: '#38BDF8',
            fontWeight: 600,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            letterSpacing: '0.08em',
            borderRadius: '6px',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          VIEW OUR WORK
        </Link>
        <Link
          href="/contact"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            border: '1px solid rgba(22, 119, 255, 0.3)',
            background: 'rgba(6, 21, 43, 0.75)',
            color: '#94A3B8',
            fontWeight: 600,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            letterSpacing: '0.08em',
            borderRadius: '6px',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          START A PROJECT
        </Link>
      </div>
    </div>
  );
}
