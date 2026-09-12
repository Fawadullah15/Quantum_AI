'use client';

import React from 'react';
import { AdminShell } from '@/app/admin/(dashboard)/AdminShell';
import { AdminToastProvider } from '@/components/admin/AdminToast';
import { AdminConfirmProvider } from '@/components/admin/ConfirmDialog';
import RecentlyDeletedClient from '@/app/admin/(dashboard)/recently-deleted/client';

export default function PreviewRecentlyDeletedPage() {
  const initialData = {
    items: [
      {
        id: 'rd-1',
        entityType: 'CASE_STUDY',
        originalId: 'cs-8491',
        title: 'Autonomous Quantitative Trading Platform',
        subtitle: 'Goldman Sachs • /work/autonomous-quant-trading',
        section: 'Works & Case Studies',
        deletedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        deletedBy: 'Admin User',
        deletedByEmail: 'admin@company.com',
        metadata: {
          client: 'Goldman Sachs',
          slug: 'autonomous-quant-trading',
          metricsCount: 3,
        },
        data: {
          id: 'cs-8491',
          title: 'Autonomous Quantitative Trading Platform',
          slug: 'autonomous-quant-trading',
          client: 'Goldman Sachs',
          category: 'Quantitative Finance',
          summary: 'High-frequency algorithmic execution pipeline powered by distributed quantum annealing heuristics.',
          challenge: 'Handling sub-microsecond arbitrage anomalies across multi-venue liquidity pools without slippage.',
          solution: 'Engineered custom low-latency FPGA kernels interfaced with deep reinforcement learning trading agents.',
          results: 'Achieved 42% reduction in latency jitter and processed $4.2B in volume with 99.99% operational uptime.',
          featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
          published: true,
          metrics: [
            { id: 'm-1', label: 'Trading Volume', value: '$4.2B' },
            { id: 'm-2', label: 'Latency Reduction', value: '42%' },
            { id: 'm-3', label: 'Uptime', value: '99.99%' },
          ],
        },
        mediaUrls: [
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
        ],
        childRelationsCount: 3,
        conflictWarning: null,
      },
      {
        id: 'rd-2',
        entityType: 'PRODUCT',
        originalId: 'prod-4412',
        title: 'Nexus Neural Core v4',
        subtitle: 'AI Infrastructure • /products/nexus-neural-core-v4',
        section: 'Products',
        deletedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        deletedBy: 'Sarah Connor',
        deletedByEmail: 'sarah@company.com',
        metadata: {
          category: 'AI Infrastructure',
          slug: 'nexus-neural-core-v4',
          featuresCount: 4,
        },
        data: {
          id: 'prod-4412',
          name: 'Nexus Neural Core v4',
          slug: 'nexus-neural-core-v4',
          category: 'AI Infrastructure',
          headline: 'Next-Gen Autonomous Agent Orchestration Framework',
          description: 'A sovereign computing architecture for multi-model autonomous decision intelligence at hyperscale.',
          demoUrl: 'https://demo.quantumai.dev/nexus',
          documentationUrl: 'https://docs.quantumai.dev/nexus/v4',
          heroImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
          features: [
            { id: 'f-1', title: 'Zero-Latency Inference Bus', description: 'Under 1.2ms batch throughput across edge nodes.' },
            { id: 'f-2', title: 'Self-Healing Routing Mesh', description: 'Dynamically shifts load during node degradation.' },
            { id: 'f-3', title: 'Quantum Entropy Seeding', description: 'Cryptographically certified stochastic exploration.' },
            { id: 'f-4', title: 'Enterprise RBAC & SOC2', description: 'Strict compliance logging and tenant isolation.' },
          ],
        },
        mediaUrls: [
          'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        ],
        childRelationsCount: 4,
        conflictWarning: null,
      },
      {
        id: 'rd-3',
        entityType: 'LEADERSHIP',
        originalId: 'lead-9102',
        title: 'Dr. Sarah Chen, Ph.D.',
        subtitle: 'VP of Autonomous Research • /leadership/dr-sarah-chen',
        section: 'Leadership & Team',
        deletedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        deletedBy: 'Admin User',
        deletedByEmail: 'admin@company.com',
        metadata: {
          position: 'VP of Autonomous Research',
          publicId: 'LEAD-009',
        },
        data: {
          id: 'lead-9102',
          name: 'Dr. Sarah Chen, Ph.D.',
          slug: 'dr-sarah-chen',
          position: 'VP of Autonomous Research',
          publicId: 'LEAD-009',
          bio: 'Former principal scientist at DeepMind leading transformer interpretability and symbolic grounding for autonomous systems.',
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
          featured: true,
          published: true,
        },
        mediaUrls: [
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
        ],
        childRelationsCount: 0,
        conflictWarning: null,
      },
      {
        id: 'rd-4',
        entityType: 'CAREER_APPLICATION',
        originalId: 'app-5012',
        title: 'Alex Rivera',
        subtitle: 'Senior Quantum Algorithm Researcher • Ref: QA-CAR-9081',
        section: 'Careers & Applications',
        deletedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        deletedBy: 'HR Manager',
        deletedByEmail: 'hr@company.com',
        metadata: {
          position: 'Senior Quantum Algorithm Researcher',
          referenceId: 'QA-CAR-9081',
          notesCount: 2,
        },
        data: {
          id: 'app-5012',
          fullName: 'Alex Rivera',
          email: 'alex.rivera@mit.edu',
          phone: '+1 (617) 555-0199',
          position: 'Senior Quantum Algorithm Researcher',
          experienceLevel: 'Staff / Principal',
          status: 'REVIEWING',
          referenceId: 'QA-CAR-9081',
          notes: [
            { id: 'n-1', authorName: 'Dr. Marcus Sterling', content: 'Top tier candidate. Published 3 papers at QIP 2025.' },
            { id: 'n-2', authorName: 'HR Team', content: 'Completed initial phone screening. Highly enthusiastic.' },
          ],
        },
        mediaUrls: [],
        childRelationsCount: 2,
        conflictWarning: null,
      },
      {
        id: 'rd-5',
        entityType: 'CONTACT_SUBMISSION',
        originalId: 'msg-3310',
        title: 'Vikram Patel (Apex Dynamics)',
        subtitle: 'vikram@apexdynamics.tech • Enterprise Inquiry',
        section: 'Contact Messages',
        deletedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
        deletedBy: 'Admin User',
        deletedByEmail: 'admin@company.com',
        metadata: {
          email: 'vikram@apexdynamics.tech',
          company: 'Apex Dynamics',
        },
        data: {
          id: 'msg-3310',
          name: 'Vikram Patel',
          email: 'vikram@apexdynamics.tech',
          company: 'Apex Dynamics',
          projectType: 'Autonomous Agent Infrastructure',
          message: 'We are seeking an enterprise partnership to deploy Quantum AI predictive nodes across our APAC data centers.',
          status: 'CONTACTED',
        },
        mediaUrls: [],
        childRelationsCount: 0,
        conflictWarning: null,
      },
      {
        id: 'rd-6',
        entityType: 'MEDIA',
        originalId: 'med-7721',
        title: 'quantum-annealing-hero-visual.png',
        subtitle: 'image/png • 1.4 MB',
        section: 'Media Library',
        deletedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        deletedBy: 'Admin User',
        deletedByEmail: 'admin@company.com',
        metadata: {
          type: 'image/png',
          size: 1468000,
        },
        data: {
          id: 'med-7721',
          filename: 'quantum-annealing-hero-visual.png',
          url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
          type: 'image/png',
          size: 1468000,
        },
        mediaUrls: [
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        ],
        childRelationsCount: 0,
        conflictWarning: null,
      },
    ],
    totalCount: 6,
    categoryCounts: {
      ALL: 6,
      PROJECTS: 1,
      PRODUCTS: 1,
      LEADERSHIP: 1,
      TESTIMONIALS: 0,
      SERVICES: 0,
      TECHNOLOGY: 0,
      BLOG: 0,
      CLIENTS: 0,
      APPLICATIONS: 1,
      CONTACTS: 1,
      MEDIA: 1,
      NOTIFICATIONS: 0,
    },
    stats: {
      total: 6,
      recoverable: 6,
      mediaOnHold: 1,
      newestDeletedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  };

  const initialAuditLogs = [
    {
      id: 'log-1',
      action: 'SOFT_DELETE',
      entity: 'CASE_STUDY',
      entityId: 'cs-8491',
      entityName: 'Autonomous Quantitative Trading Platform',
      adminName: 'Admin User',
      adminEmail: 'admin@company.com',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      details: { reason: 'Moved to bin from case studies manager' },
    },
    {
      id: 'log-2',
      action: 'SOFT_DELETE',
      entity: 'PRODUCT',
      entityId: 'prod-4412',
      entityName: 'Nexus Neural Core v4',
      adminName: 'Sarah Connor',
      adminEmail: 'sarah@company.com',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      details: { reason: 'Moved to bin from products catalog' },
    },
    {
      id: 'log-3',
      action: 'RESTORE',
      entity: 'TESTIMONIAL',
      entityId: 't-101',
      entityName: 'Dr. Robert Oppenheimer (Quantum Research)',
      adminName: 'Admin User',
      adminEmail: 'admin@company.com',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      details: { restoredTo: 'Testimonials' },
    },
    {
      id: 'log-4',
      action: 'PERMANENT_DELETE',
      entity: 'BLOG_POST',
      entityId: 'b-990',
      entityName: 'Draft: Quantum Cryptography Spec 2024',
      adminName: 'Admin User',
      adminEmail: 'admin@company.com',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      details: { reason: 'Permanently deleted by admin' },
    },
  ];

  return (
    <AdminToastProvider>
      <AdminConfirmProvider>
        <AdminShell userName="System Administrator" userRole="SUPER ADMIN">
          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#06B6D4', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
                DATA PROTECTION &amp; RECOVERY VAULT
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
                Recently Deleted
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
                Centralized CMS recovery hub. Any record deleted across the website is safely held here with its complete relational graph, media links, and metadata, ready to be restored.
              </p>
            </div>

            <RecentlyDeletedClient initialData={initialData} initialAuditLogs={initialAuditLogs} />
          </div>
        </AdminShell>
      </AdminConfirmProvider>
    </AdminToastProvider>
  );
}
