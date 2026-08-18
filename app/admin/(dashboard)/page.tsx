import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Fetch statistics and recent data concurrently
  const [
    teamMemberCount,
    productCount,
    caseStudyCount,
    blogPostCount,
    unreadMessagesCount,
    recentMessages,
    recentPosts,
  ] = await Promise.all([
    prisma.teamMember.count().catch(() => 0),
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

  return (
    <div style={{ backgroundColor: '#111827', color: '#ffffff', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Dashboard Overview</h1>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Welcome to the admin control panel.</p>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Unread Messages Card */}
        <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151', borderLeft: '4px solid #1677FF' }}>
          <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.5rem' }}>Unread Messages</h2>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{unreadMessagesCount}</div>
        </div>

        {/* Blog Posts Card */}
        <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
          <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.5rem' }}>Blog Posts</h2>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{blogPostCount}</div>
        </div>

        {/* Products Card */}
        <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
          <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.5rem' }}>Products</h2>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{productCount}</div>
        </div>

        {/* Case Studies Card */}
        <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
          <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.5rem' }}>Case Studies</h2>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{caseStudyCount}</div>
        </div>

        {/* Team Members Card */}
        <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
          <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.5rem' }}>Team Members</h2>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{teamMemberCount}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Recent Messages */}
        <section style={{ backgroundColor: '#1f2937', borderRadius: '0.5rem', border: '1px solid #374151', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Recent Messages</h2>
            <Link href="/admin/messages" style={{ color: '#1677FF', textDecoration: 'none', fontSize: '0.875rem' }}>View All</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#111827', color: '#9ca3af', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>Name</th>
                  <th style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>Email</th>
                  <th style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>Date</th>
                  <th style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMessages.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af' }}>No recent messages.</td>
                  </tr>
                ) : (
                  recentMessages.map((msg) => (
                    <tr key={msg.id} style={{ borderBottom: '1px solid #374151' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>{msg.name}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#9ca3af' }}>{msg.email}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#9ca3af' }}>{formatDate(msg.createdAt)}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          backgroundColor: msg.status === 'NEW' ? 'rgba(22, 119, 255, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                          color: msg.status === 'NEW' ? '#1677FF' : '#9ca3af'
                        }}>
                          {msg.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Blog Posts */}
        <section style={{ backgroundColor: '#1f2937', borderRadius: '0.5rem', border: '1px solid #374151', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Recent Blog Posts</h2>
            <Link href="/admin/blog" style={{ color: '#1677FF', textDecoration: 'none', fontSize: '0.875rem' }}>View All</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#111827', color: '#9ca3af', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>Title</th>
                  <th style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af' }}>No recent blog posts.</td>
                  </tr>
                ) : (
                  recentPosts.map((post) => (
                    <tr key={post.id} style={{ borderBottom: '1px solid #374151' }}>
                      <td style={{ padding: '1rem 1.5rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.title}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          backgroundColor: post.published ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: post.published ? '#10b981' : '#f59e0b'
                        }}>
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#9ca3af' }}>{formatDate(post.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
