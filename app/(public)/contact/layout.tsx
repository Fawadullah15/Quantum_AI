import type { Metadata } from 'next';
import React from 'react';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Contact Quantum AI — Project Inquiries & Consultations',
  description: 'Initiate a new software project, AI system architecture, or enterprise partnership with Quantum AI engineering.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
