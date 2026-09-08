'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCaseStudyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/case-studies?new=1');
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
      Redirecting to Case Study editor...
    </div>
  );
}
