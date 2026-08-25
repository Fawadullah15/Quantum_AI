import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    leadershipCount,
    productCount,
    caseStudyCount,
    blogPostCount,
    clientCount,
    serviceCount,
    testimonialCount,
    unreadMessagesCount,
    totalMessagesCount,
    recentMessages,
    recentPosts,
  ] = await Promise.all([
    prisma.leadership.count({ where: { isActive: true } }).catch(() => 0),
    prisma.product.count().catch(() => 0),
    prisma.caseStudy.count().catch(() => 0),
    prisma.blogPost.count().catch(() => 0),
    prisma.client.count().catch(() => 0),
    prisma.service.count().catch(() => 0),
    prisma.testimonial.count().catch(() => 0),
    prisma.contactSubmission.count({ where: { status: 'NEW' } }).catch(() => 0),
    prisma.contactSubmission.count().catch(() => 0),
    prisma.contactSubmission.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.blogPost.findMany({
      take: 6,
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

  const statCards = [
    {
      label: 'Unread Inquiries',
      count: unreadMessagesCount,
      total: `${totalMessagesCount} total`,
      icon: '💬',
      color: '#38BDF8',
      href: '/admin/messages',
      alert: unreadMessagesCount > 0,
    },
    {
      label: 'Clients & Partners',
      count: clientCount,
      total: 'Active logos',
      icon: '🏢',
      color: '#60A5FA',
      href: '/admin/clients',
    },
    {
      label: 'Case Studies',
      count: caseStudyCount,
      total: 'Portfolio items',
      icon: '📁',
      color: '#FBBF24',
      href: '/admin/case-studies',
    },
    {
      label: 'Services',
      count: serviceCount,
      total: 'Solutions',
      icon: '⚡',
      color: '#A78BFA',
      href: '/admin/services',
    },
    {
      label: 'Products',
      count: productCount,
      total: 'AI Systems',
      icon: '📦',
      color: '#34D399',
      href: '/admin/products',
    },
    {
      label: 'Testimonials',
      count: testimonialCount,
      total: 'Client reviews',
      icon: '⭐',
      color: '#F59E0B',
      href: '/admin/testimonials',
    },
    {
      label: 'Leadership / Team',
      count: leadershipCount,
      total: 'Active leaders',
      icon: '👥',
      color: '#818CF8',
      href: '/admin/leadership',
    },
    {
      label: 'Blog Articles',
      count: blogPostCount,
      total: 'Published posts',
      icon: '📝',
      color: '#F472B6',
      href: '/admin/blog',
    },
  ];

  const quickActions = [
    { label: '💬 Inquiries', href: '/admin/messages', variant: 'primary' },
    { label: '+ Add Leader', href: '/admin/leadership/new', variant: 'secondary' },
    { label: '+ New Case Study', href: '/admin/case-studies/new', variant: 'secondary' },
    { label: '+ Write Article', href: '/admin/blog/new', variant: 'secondary' },
    { label: '+ Client Logo', href: '/admin/clients', variant: 'secondary' },
    { label: '+ Testimonial', href: '/admin/testimonials', variant: 'secondary' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Header & Quick Actions */}
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
            ADMINISTRATION CONTROL
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
            Dashboard Overview
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
            Real-time operations, client communications, and live content metrics for Quantum AI.
          </p>
        </div>

        {/* Quick Action Buttons */}
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

      {/* Stats Cards Grid - 8 Real Database KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              transition: 'border-color 0.15s, transform 0.15s',
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
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.35rem', fontFamily: 'var(--font-mono, monospace)' }}>
                {stat.total}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 2-Column Split: Recent Inquiries & Recent Blog Posts */}
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
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Inquiries</h2>
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
                      transition: 'background-color 0.15s ease',
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
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Blog Posts</h2>
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
