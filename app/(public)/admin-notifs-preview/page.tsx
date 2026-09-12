'use client';

import React, { useEffect, useState } from 'react';
import { AdminNotifications } from '@/app/admin/(dashboard)/AdminNotifications';

export default function AdminNotifsPreviewPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Intercept /api/admin/notifications for instant deterministic visual testing
    const origFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString();
      if (urlStr.includes('/api/admin/notifications')) {
        if (init?.method === 'PATCH') {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const filter = urlStr.includes('filter=') ? urlStr.split('filter=')[1].split('&')[0] : 'ALL';

        const allItems = [
          {
            id: 'notif-1',
            type: 'CONTACT',
            title: 'New Project Inquiry from Dr. Marcus Sterling',
            subtitle: 'Apex Quantum Dynamics • AI Systems',
            senderName: 'Dr. Marcus Sterling',
            senderEmail: 'm.sterling@apexquantum.org',
            preview: 'We require an autonomous agent swarm integrated with our internal operational databases for enterprise decision-support.',
            referenceId: null,
            link: '/admin/messages/cmtytmb4f0000l204yvceuo1h',
            details: {
              name: 'Dr. Marcus Sterling',
              email: 'm.sterling@apexquantum.org',
              phone: '+1 (555) 234-8901',
              company: 'Apex Quantum Dynamics',
              projectType: 'AI Systems',
              budget: '$50,000 - $100,000',
              message: 'We require an autonomous agent swarm integrated with our internal operational databases for enterprise decision-support.',
            },
            read: false,
            emailStatus: 'SENT',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'notif-2',
            type: 'CAREER',
            title: 'New Career Application: Tariq Mansoor',
            subtitle: 'Staff AI Systems Architect • Senior (Full Time)',
            senderName: 'Tariq Mansoor',
            senderEmail: 'tariq.mansoor@engineers.dev',
            preview: 'Senior systems architect with 8 years designing real-time AI and high-concurrency microservices.',
            referenceId: 'QA-CAR-4459',
            link: '/admin/careers-partnerships/career/car-123',
            details: {
              fullName: 'Tariq Mansoor',
              email: 'tariq.mansoor@engineers.dev',
              phone: '+92 (300) 123-4567',
              currentLocation: 'Islamabad, Pakistan',
              position: 'Staff AI Systems Architect',
              experienceLevel: 'Senior',
              skills: 'PyTorch, Next.js, Rust, Distributed Systems, Three.js',
              workType: 'Full Time',
              portfolioUrl: 'https://tariq-dev.io',
              resumeUrl: 'https://quantumai-snowy.vercel.app/uploads/mock-cv.pdf',
              introduction: 'Senior systems architect with 8 years designing real-time AI and high-concurrency microservices.',
              whyQuantumAI: 'Excited by the intersection of quantum-inspired algorithms and agentic computing.',
            },
            read: false,
            emailStatus: 'SENT',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'notif-3',
            type: 'PARTNERSHIP',
            title: 'New Partnership: Autonomous Multi-Agent Enterprise Integration',
            subtitle: 'Dr. Helena Chen • Cybernetic Neural Labs • Technology Partnership',
            senderName: 'Dr. Helena Chen',
            senderEmail: 'helena.chen@neural-labs.ai',
            preview: 'We would like to explore a co-development partnership utilizing Quantum AI inference pipelines.',
            referenceId: 'QA-PTR-3995',
            link: '/admin/careers-partnerships/partnership/ptr-123',
            details: {
              fullName: 'Dr. Helena Chen',
              company: 'Cybernetic Neural Labs',
              email: 'helena.chen@neural-labs.ai',
              phone: '+1 (415) 890-1234',
              website: 'https://neural-labs.ai',
              country: 'United States',
              partnershipType: 'Technology Partnership',
              subject: 'Autonomous Multi-Agent Enterprise Integration',
              budgetRange: '$100,000+',
              preferredContactMethod: 'Email',
              message: 'We would like to explore a co-development partnership utilizing Quantum AI inference pipelines.',
              attachmentUrl: 'https://quantumai-snowy.vercel.app/uploads/proposal.pdf',
            },
            read: false,
            emailStatus: 'SENT',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: 'notif-4',
            type: 'TESTIMONIAL',
            title: 'New Client Review from Amara Okafor',
            subtitle: 'Vanguard Global Logistics • 5 Stars Rating',
            senderName: 'Amara Okafor',
            senderEmail: 'amara@vanguard-logistics.com',
            preview: 'Quantum AI redesigned our supply-chain predictive telemetry with impeccable precision and engineering discipline.',
            referenceId: null,
            link: '/admin/testimonials',
            details: {
              name: 'Amara Okafor',
              company: 'Vanguard Global Logistics',
              role: 'VP of Technology',
              rating: 5,
              content: 'Quantum AI redesigned our supply-chain predictive telemetry with impeccable precision and engineering discipline.',
            },
            read: true,
            emailStatus: 'SENT',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];

        let filtered = allItems;
        if (filter === 'UNREAD') filtered = allItems.filter(i => !i.read);
        if (filter === 'CONTACT') filtered = allItems.filter(i => i.type === 'CONTACT');
        if (filter === 'CAREERS') filtered = allItems.filter(i => i.type === 'CAREER');
        if (filter === 'PARTNERSHIPS') filtered = allItems.filter(i => i.type === 'PARTNERSHIP');

        return new Response(JSON.stringify({
          unreadCount: allItems.filter(i => !i.read).length,
          totalCount: filtered.length,
          notifications: filtered,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return origFetch(input, init);
    };

    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070B14', color: '#F8FAFC', fontFamily: '-apple-system, sans-serif' }}>
      {/* Simulated Admin Header */}
      <header
        style={{
          height: 60,
          backgroundColor: '#0A0F1D',
          borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.05em' }}>
            QUANTUM ADMIN
          </span>
          <span style={{ color: '#475569' }}>/</span>
          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Notifications Inbox</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace' }}>
            quantumai.cmp@gmail.com
          </div>
          <AdminNotifications />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #1E3A8A, #0284C7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            F
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1200, margin: '3rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Centralized Notifications Inbox Visual Verification
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: 650, lineHeight: 1.6 }}>
          Testing interactive bell badge, unread counters, category filtering (Contact, Careers, Partnerships), mark-as-read controls, and full submission modal inspection.
        </p>
      </main>
    </div>
  );
}
