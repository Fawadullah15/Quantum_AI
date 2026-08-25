import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [
    leadershipCount,
    productCount,
    caseStudyCount,
    publishedCaseStudyCount,
    blogPostCount,
    publishedBlogCount,
    clientCount,
    serviceCount,
    testimonialCount,
    technologyCount,
    mediaCount,
    unreadMessagesCount,
    totalMessagesCount,
    careerAppsCount,
    newCareerAppsCount,
    partnershipCount,
    newPartnershipCount,
    recentMessages,
    recentPosts,
    recentActivity,
    recentApplications,
  ] = await Promise.all([
    prisma.leadership.count({ where: { isActive: true } }).catch(() => 0),
    prisma.product.count().catch(() => 0),
    prisma.caseStudy.count().catch(() => 0),
    prisma.caseStudy.count({ where: { published: true } }).catch(() => 0),
    prisma.blogPost.count().catch(() => 0),
    prisma.blogPost.count({ where: { published: true } }).catch(() => 0),
    prisma.client.count().catch(() => 0),
    prisma.service.count().catch(() => 0),
    prisma.testimonial.count().catch(() => 0),
    prisma.technology.count().catch(() => 0),
    prisma.media.count().catch(() => 0),
    prisma.contactSubmission.count({ where: { status: 'NEW' } }).catch(() => 0),
    prisma.contactSubmission.count().catch(() => 0),
    prisma.careerApplication.count().catch(() => 0),
    prisma.careerApplication.count({ where: { status: 'NEW' } }).catch(() => 0),
    prisma.partnershipRequest.count().catch(() => 0),
    prisma.partnershipRequest.count({ where: { status: 'NEW' } }).catch(() => 0),
    prisma.contactSubmission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.blogPost.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }).catch(() => []),
    prisma.careerApplication.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Primary KPI Stat Cards
  const statCards = [
    {
      label: 'Contact Inquiries',
      count: unreadMessagesCount,
      total: `${totalMessagesCount} total logged`,
      subtext: unreadMessagesCount > 0 ? `${unreadMessagesCount} unread / new` : 'All inquiries reviewed',
      icon: '💬',
      color: '#38BDF8',
      href: '/admin/messages',
      alert: unreadMessagesCount > 0,
    },
    {
      label: 'Careers & Talent',
      count: newCareerAppsCount,
      total: `${careerAppsCount} total applicants`,
      subtext: `${newCareerAppsCount} new submissions`,
      icon: '🤝',
      color: '#34D399',
      href: '/admin/careers-partnerships',
      alert: newCareerAppsCount > 0,
    },
    {
      label: 'Partnership Requests',
      count: newPartnershipCount,
      total: `${partnershipCount} business inquiries`,
      subtext: `${newPartnershipCount} pending review`,
      icon: '💼',
      color: '#FBBF24',
      href: '/admin/careers-partnerships',
      alert: newPartnershipCount > 0,
    },
    {
      label: 'Case Studies / Works',
      count: caseStudyCount,
      total: `${publishedCaseStudyCount} published live`,
      subtext: 'Portfolio deployments',
      icon: '📁',
      color: '#60A5FA',
      href: '/admin/case-studies',
    },
    {
      label: 'Products & Platforms',
      count: productCount,
      total: 'Intelligent AI software',
      subtext: 'Core software systems',
      icon: '📦',
      color: '#A78BFA',
      href: '/admin/products',
    },
    {
      label: 'Services & Solutions',
      count: serviceCount,
      total: 'Engineering capabilities',
      subtext: 'Client offerings',
      icon: '⚡',
      color: '#F472B6',
      href: '/admin/services',
    },
    {
      label: 'Technology Stack',
      count: technologyCount,
      total: 'Frameworks & ML models',
      subtext: 'Active tech items',
      icon: '💻',
      color: '#38BDF8',
      href: '/admin/technology',
    },
    {
      label: 'Clients & Worked With',
      count: clientCount,
      total: 'Partner logos',
      subtext: 'Featured brands',
      icon: '🏢',
      color: '#818CF8',
      href: '/admin/clients',
    },
    {
      label: 'Leadership & Team',
      count: leadershipCount,
      total: 'Active leadership profiles',
      subtext: 'Founders & team',
      icon: '👥',
      color: '#F59E0B',
      href: '/admin/leadership',
    },
    {
      label: 'Blog & Articles',
      count: blogPostCount,
      total: `${publishedBlogCount} published / ${blogPostCount - publishedBlogCount} draft`,
      subtext: 'Technical insights',
      icon: '📝',
      color: '#EC4899',
      href: '/admin/blog',
    },
    {
      label: 'Client Testimonials',
      count: testimonialCount,
      total: 'Verified reviews',
      subtext: 'Endorsements',
      icon: '⭐',
      color: '#FBBF24',
      href: '/admin/testimonials',
    },
    {
      label: 'Media Library Assets',
      count: mediaCount,
      total: 'Images, icons & docs',
      subtext: 'Uploaded assets',
      icon: '🖼️',
      color: '#2DD4BF',
      href: '/admin/media',
    },
  ];

  // Quick Actions
  const quickActions = [
    { label: '💬 Inquiries', href: '/admin/messages', variant: 'primary' },
    { label: '🤝 Careers / Partnerships', href: '/admin/careers-partnerships', variant: 'secondary' },
    { label: '+ Add Leader', href: '/admin/leadership/new', variant: 'secondary' },
    { label: '+ New Case Study', href: '/admin/case-studies/new', variant: 'secondary' },
    { label: '+ New Product', href: '/admin/products/new', variant: 'secondary' },
    { label: '+ New Service', href: '/admin/services/new', variant: 'secondary' },
    { label: '+ Write Article', href: '/admin/blog/new', variant: 'secondary' },
    { label: '+ Add Tech', href: '/admin/technology/new', variant: 'secondary' },
    { label: '🖼️ Media Library', href: '/admin/media', variant: 'secondary' },
    { label: '⚙️ Settings', href: '/admin/settings', variant: 'secondary' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ─── Top Header & Quick Actions Bar ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.12)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              color: '#1677FF',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
              fontWeight: 600,
            }}
          >
            QUANTUM AI // CENTRAL COMMAND
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
            Dashboard &amp; Operations
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
            Real-time operations, client communications, and live content metrics for Quantum AI.
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              style={{
                padding: '0.45rem 0.85rem',
                backgroundColor: action.variant === 'primary' ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                border: action.variant === 'primary' ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.22)',
                borderRadius: 6,
                color: action.variant === 'primary' ? '#FFFFFF' : '#38BDF8',
                fontSize: '0.78rem',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'var(--font-mono, monospace)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: action.variant === 'primary' ? '0 4px 12px rgba(22, 119, 255, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Real Database KPI Stats Grid (12 Cards) ─── */}
      <div>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 600 }}>
          Live System Metrics
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
            width: '100%',
          }}
        >
          {statCards.map((stat, idx) => (
            <Link
              key={idx}
              href={stat.href}
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.75)',
                border: '1px solid rgba(22, 119, 255, 0.18)',
                borderRadius: 10,
                padding: '1.15rem 1.25rem',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.65rem',
                transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                borderLeft: stat.alert ? '3px solid #EF4444' : `3px solid ${stat.color}`,
                boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {stat.label}
                </span>
                <span style={{ fontSize: '1.15rem' }}>{stat.icon}</span>
              </div>

              <div>
                <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>
                  {stat.count}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '0.35rem', fontFamily: 'var(--font-mono, monospace)' }}>
                  {stat.total}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.15rem' }}>
                  {stat.subtext}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── 2-Column Split: Recent Inquiries & Recent Applications ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
        
        {/* Recent Inquiries Section */}
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.75)',
            borderRadius: 12,
            border: '1px solid rgba(22, 119, 255, 0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              padding: '0.95rem 1.25rem',
              borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem' }}>💬</span>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Contact Inquiries</h2>
            </div>
            <Link
              href="/admin/messages"
              style={{
                color: '#38BDF8',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              View All ({totalMessagesCount}) →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentMessages.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                No client inquiries submitted yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentMessages.map((msg) => (
                  <Link
                    key={msg.id}
                    href={`/admin/messages/${msg.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                      textDecoration: 'none',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.88rem' }}>{msg.name}</span>
                        {msg.status === 'NEW' && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38BDF8', display: 'inline-block' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.email}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                        {msg.projectType || 'General Inquiry'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '0.18rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono, monospace)',
                          letterSpacing: '0.04em',
                          backgroundColor: msg.status === 'NEW' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: msg.status === 'NEW' ? '#38BDF8' : '#94A3B8',
                          border: msg.status === 'NEW' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                        }}
                      >
                        {msg.status}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Career & Talent Applications Section */}
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.75)',
            borderRadius: 12,
            border: '1px solid rgba(22, 119, 255, 0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              padding: '0.95rem 1.25rem',
              borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem' }}>🤝</span>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Career Applications</h2>
            </div>
            <Link
              href="/admin/careers-partnerships"
              style={{
                color: '#38BDF8',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              View All ({careerAppsCount}) →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentApplications.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                No career applications received yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentApplications.map((app) => (
                  <Link
                    key={app.id}
                    href={`/admin/careers-partnerships/career/${app.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                      textDecoration: 'none',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.88rem' }}>{app.fullName}</span>
                        {app.status === 'NEW' && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.position} ({app.workType})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.15rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        Ref: {app.referenceId}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '0.18rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono, monospace)',
                          letterSpacing: '0.04em',
                          backgroundColor: app.status === 'NEW' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: app.status === 'NEW' ? '#34D399' : '#94A3B8',
                          border: app.status === 'NEW' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                        }}
                      >
                        {app.status}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── 2-Column Split: System Activity Audit Log & Recent Articles ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
        
        {/* System Activity Log */}
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.75)',
            borderRadius: 12,
            border: '1px solid rgba(22, 119, 255, 0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              padding: '0.95rem 1.25rem',
              borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem' }}>🛡️</span>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>System Activity Audit Trail</h2>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
              Real-time Logs
            </span>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
                No administrative activity logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: 4,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono, monospace)',
                            backgroundColor: 'rgba(22, 119, 255, 0.15)',
                            color: '#38BDF8',
                            border: '1px solid rgba(22, 119, 255, 0.3)',
                          }}
                        >
                          {log.action}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                          by {log.user?.name || 'Admin'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#E2E8F0', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details || log.entity}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#64748B', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        {formatDate(log.createdAt)}
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        {formatTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Posts Section */}
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.75)',
            borderRadius: 12,
            border: '1px solid rgba(22, 119, 255, 0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              padding: '0.95rem 1.25rem',
              borderBottom: '1px solid rgba(22, 119, 255, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem' }}>📝</span>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Articles &amp; Insights</h2>
            </div>
            <Link
              href="/admin/blog"
              style={{
                color: '#38BDF8',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              View All ({blogPostCount}) →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentPosts.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                No blog articles published yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href="/admin/blog"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                      textDecoration: 'none',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#F1F5F9', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.title}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', marginTop: '0.15rem' }}>
                        {formatDate(post.createdAt)}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '0.18rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        letterSpacing: '0.04em',
                        backgroundColor: post.published ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                        color: post.published ? '#34D399' : '#FBBF24',
                        border: post.published ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                        flexShrink: 0,
                      }}
                    >
                      {post.published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
