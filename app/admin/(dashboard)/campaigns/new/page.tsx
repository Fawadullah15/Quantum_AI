'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCampaignPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/campaigns?create=1');
  }, [router]);

  return (
    <div
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        color: '#FFFFFF',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '0.85rem',
      }}
    >
      Opening campaign editor…
    </div>
  );
}
