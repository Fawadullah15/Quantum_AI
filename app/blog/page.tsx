import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/db';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights on AI, software engineering, and the future of technology.',
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.025em', color: 'var(--color-primary)', marginBottom: '4rem' }}>INSIGHTS.</h1>
      
      {posts.length === 0 ? (
        <div style={{ padding: '6rem 0', textAlign: 'center', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontFamily: 'var(--font-space-mono)' }}>
          <p>No articles published yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', textDecoration: 'none', color: 'inherit' }}>
              {post.coverImage ? (
                <div style={{ aspectRatio: '16/9', width: '100%', background: '#000', position: 'relative', borderBottom: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ aspectRatio: '16/9', width: '100%', background: 'var(--color-bg)', position: 'relative', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space-mono)', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  {post.category || 'Article'}
                </div>
              )}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-space-mono)', fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
                  <span style={{ textTransform: 'uppercase', color: 'var(--color-primary)' }}>{post.category}</span>
                  <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{post.title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  {post.excerpt}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)' }}>
                  Read Article &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
