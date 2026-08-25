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
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '75rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', marginBottom: '2.5rem' }}>INSIGHTS.</h1>
      
      {posts.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', border: '1px solid var(--color-border, rgba(30,58,138,0.22))', color: 'var(--color-text-secondary, #94A3B8)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem' }}>
          <p>No articles published yet.</p>
        </div>
      ) : (
        <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--color-border, rgba(30,58,138,0.22))', background: 'var(--color-surface, #0A2347)', textDecoration: 'none', color: 'inherit', borderRadius: 4, overflow: 'hidden' }}>
              {post.coverImage ? (
                <div style={{ aspectRatio: '16/9', width: '100%', background: '#000', position: 'relative', borderBottom: '1px solid var(--color-border, rgba(30,58,138,0.22))', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ aspectRatio: '16/9', width: '100%', background: 'var(--color-void, #030712)', position: 'relative', borderBottom: '1px solid var(--color-border, rgba(30,58,138,0.22))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-secondary, #94A3B8)', fontSize: '0.8rem' }}>
                  {post.category || 'Article'}
                </div>
              )}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: 'var(--color-text-secondary, #94A3B8)', marginBottom: '0.75rem' }}>
                  <span style={{ textTransform: 'uppercase', color: '#38BDF8' }}>{post.category}</span>
                  <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.35, color: '#F8FAFC' }}>{post.title}</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                  {post.excerpt}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(30,58,138,0.22)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38BDF8' }}>
                 	Read Article &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .blog-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1024px) {
          .blog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .blog-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
