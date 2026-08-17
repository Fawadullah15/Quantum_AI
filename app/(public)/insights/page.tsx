import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)', paddingBottom: 'var(--space-32)' }}>
      {/* MASTHEAD */}
      <section className="container" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="tech-label">SYS.13 / DATABANK</div>
        <h1 style={{
          fontSize: 'clamp(3rem, 10vw, 10rem)',
          fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em',
          color: 'var(--color-text-primary)', textTransform: 'uppercase', marginTop: 'var(--space-8)',
        }}>
          INSIGHTS.
        </h1>
      </section>

      {posts.length === 0 ? (
        <section className="container" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
            NO PUBLISHED ARTICLES YET. CHECK BACK SOON.
          </p>
        </section>
      ) : (
        <>
          {/* FEATURED — first article */}
          {posts[0] && (
            <section className="container" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)', marginBottom: 'var(--space-16)' }}>
              <Link href={`/blog/${posts[0].slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div className="tech-label" style={{ marginBottom: 'var(--space-4)' }}>FEATURED ARTICLE</div>
                <h2 style={{ fontSize: 'clamp(2rem, 5vw, 5rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.04em', color: 'var(--color-text-primary)', textTransform: 'uppercase', marginBottom: 'var(--space-6)' }}>
                  {posts[0].title}
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', maxWidth: '60ch', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
                  {posts[0].excerpt}
                </p>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.15em' }}>
                  {posts[0].author} · {posts[0].publishedAt ? new Date(posts[0].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unpublished'} · {posts[0].category}
                </div>
              </Link>
            </section>
          )}

          {/* REMAINING ARTICLES */}
          <section className="container" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
              {posts.slice(1).map((post, idx) => (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', borderBottom: '1px solid var(--color-border)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-8)', alignItems: 'start' }}>
                    <div>
                      <div className="tech-label" style={{ marginBottom: 'var(--space-3)' }}>{String(idx + 2).padStart(2, '0')} / {post.category || 'INTELLIGENCE'}</div>
                      <h3 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{post.title}</h3>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>{post.excerpt}</p>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.12em' }}>
                        {post.author} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
