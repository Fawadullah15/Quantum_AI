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
      take: 5,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.blogPost.findMany({
      take: 5,
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
    { label: 'Unread Messages', count: unreadMessagesCount, icon: '💬', color: '#38BDF8', href: '/admin/messages', alert: unreadMessagesCount > 0 },
    { label: 'Leadership / Team', count: leadershipCount, icon: '👥', color: '#818CF8', href: '/admin/leadership' },
    { label: 'Products', count: productCount, icon: '📦', color: '#34D399', href: '/admin/products' },
    { label: 'Case Studies', count: caseStudyCount, icon: '📁', color: '#FBBF24', href: '/admin/case-studies' },
    { label: 'Blog Posts', count: blogPostCount, icon: '📝', color: '#F472B6', href: '/admin/blog' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Dashboard Overview</h1>
          <p style={{ color: '#64748B', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            Welcome to the Quantum AI administration control panel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href="/admin/leadership/new"
            style={{
              padding: '0.45rem 0.875rem',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 6,
              color: '#38BDF8',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            + Add Leader
          </Link>
          <Link
            href="/admin/case-studies/new"
            style={{
              padding: '0.45rem 0.875rem',
              backgroundColor: '#2563EB',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
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
              backgroundColor: '#0B111E',
              border: '1px solid #1E293B',
              borderRadius: 10,
              padding: '1rem 1.25rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'border-color 0.15s, transform 0.15s',
              borderLeft: stat.alert ? '3px solid #EF4444' : `3px solid ${stat.color}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
        
        {/* Recent Messages Section */}
        <div style={{ backgroundColor: '#0B111E', borderRadius: 10, border: '1px solid #1E293B', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090E1A' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Inquiries</h2>
            <Link href="/admin/messages" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 500 }}>
              View All →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentMessages.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                No inquiries submitted yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#64748B', borderBottom: '1px solid #1E293B' }}>
                    <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Sender</th>
                    <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Project</th>
                    <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((msg) => (
                    <tr key={msg.id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{msg.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{msg.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94A3B8' }}>{msg.projectType || 'General'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(msg.createdAt)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          backgroundColor: msg.status === 'NEW' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: msg.status === 'NEW' ? '#38BDF8' : '#94A3B8',
                        }}>
                          {msg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Posts Section */}
        <div style={{ backgroundColor: '#0B111E', borderRadius: 10, border: '1px solid #1E293B', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090E1A' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#F8FAFC' }}>Recent Blog Posts</h2>
            <Link href="/admin/blog" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 500 }}>
              View All →
            </Link>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            {recentPosts.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                No blog posts created yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#64748B', borderBottom: '1px solid #1E293B' }}>
                    <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Title</th>
                    <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPosts.map((post) => (
                    <tr key={post.id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#F1F5F9' }}>
                        {post.title}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          backgroundColor: post.published ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          color: post.published ? '#34D399' : '#FBBF24',
                        }}>
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatDate(post.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
