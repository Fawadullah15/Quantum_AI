'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/products?new=1');
  }, [router]);

  return (
    <div
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        color: '#94A3B8',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '0.85rem',
      }}
    >
      Redirecting to Product editor...
    </div>
  );
}
