import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    leadershipCount,
    productCount,
    caseStudyCount,
    blogPostCount,
    unreadMessagesCount,
    recentMessages,
    recentPosts,
  ] = await Promise.all([
    prisma.leadership.count({ where: { isActive: true } }).catch(() => 0),
    prisma.product.count().catch(() => 0),
    prisma.caseStudy.count().catch(() => 0),
    prisma.blogPost.count().catch(() => 0),
    prisma.contactSubmission.count({ where: { status: 'NEW' } }).catch(() => 0),
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
    { label: 'Unread Inquiries', count: unreadMessagesCount, icon: '💬', color: '#38BDF8', href: '/admin/messages', alert: unreadMessagesCount > 0 },
    { label: 'Leadership / Team', count: leadershipCount, icon: '👥', color: '#818CF8', href: '/admin/leadership' },
    { label: 'Products', count: productCount, icon: '📦', color: '#34D399', href: '/admin/products' },
    { label: 'Case Studies', count: caseStudyCount, icon: '📁', color: '#FBBF24', href: '/admin/case-studies' },
    { label: 'Blog Posts', count: blogPostCount, icon: '📝', color: '#F472B6', href: '/admin/blog' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
            ADMINISTRATION CONTROL
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Dashboard Overview</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginTop: '0.25rem', fontWeight: 300 }}>
            Welcome to the Quantum AI administration and communications hub.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href="/admin/messages"
            style={{
              padding: '0.48rem 0.95rem',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 6,
              color: '#38BDF8',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            💬 View All Inquiries
          </Link>
          <Link
            href="/admin/case-studies/new"
            style={{
              padding: '0.48rem 0.95rem',
              backgroundColor: '#1677FF',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)',
            }}
          >
            + New Case Study
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid - 5 concise cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {statCards.map((stat, idx) => (
          <Link
            key={idx}
            href={stat.href}
            style={{
              backgroundColor: 'rgba(6, 21, 43, 0.75)',
              border: '1px solid rgba(22, 119, 255, 0.18)',
              borderRadius: 10,
              padding: '1rem 1.25rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'border-color 0.15s, transform 0.15s',
              borderLeft: stat.alert ? '3px solid #EF4444' : `3px solid ${stat.color}`,
              boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono, monospace)' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: '1.1rem' }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>
              {stat.count}
            </div>
          </Link>
        ))}
      </div>

      {/* 2-Column Split: Recent Messages & Recent Blog Posts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Recent Inquiries Section */}
        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', borderRadius: 12, border: '1px solid rgba(22, 119, 255, 0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '0.95rem 1.25rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(3, 7, 18, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem' }}>💬</span>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Inquiries</h2>
            </div>
            <Link href="/admin/messages" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
              View All →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentMessages.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                No inquiries submitted yet.
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
        <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.75)', borderRadius: 12, border: '1px solid rgba(22, 119, 255, 0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '0.95rem 1.25rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(3, 7, 18, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem' }}>📝</span>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Blog Posts</h2>
            </div>
            <Link href="/admin/blog" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
              View All →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentPosts.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                No blog posts created yet.
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
