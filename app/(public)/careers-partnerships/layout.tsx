import type { Metadata } from 'next';
import React from 'react';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Careers & Strategic Business Partnerships — Quantum AI',
  description: 'Apply for open engineering roles or submit enterprise technology and business partnership proposals to Quantum AI.',
  path: '/careers-partnerships',
});

export default function CareersPartnershipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
