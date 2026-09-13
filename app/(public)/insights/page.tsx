import prisma from '@/lib/db';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Insights & Technical Perspectives — Quantum AI',
  description: 'Perspectives, technical deep dives, and analysis on artificial intelligence and software systems from the engineers at Quantum AI.',
  path: '/insights',
});

export default async function InsightsPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  }).catch(() => []);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }}>
      <div style={{ maxWidth: 'var(--max-width, 1000px)', margin: '0 auto' }}>
        {/* MASTHEAD */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>SYS.13 / DATABANK</div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em',
            color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0,
          }}>
            INSIGHTS.
          </h1>
        </section>

        {posts.length === 0 ? (
          <section style={{ borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.5rem' }}>
            <p style={{ color: 'var(--color-text-secondary, #94A3B8)', fontSize: '0.95rem', fontFamily: 'var(--font-mono, monospace)' }}>
              NO PUBLISHED ARTICLES YET. CHECK BACK SOON.
            </p>
          </section>
        ) : (
          <>
            {/* FEATURED — first article */}
            {posts[0] && (
              <section style={{ borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                <Link href={`/blog/${posts[0].slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#55D6FF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>FEATURED ARTICLE</div>
                  <h2 style={{ fontSize: 'clamp(1.35rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.025em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    {posts[0].title}
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary, #94A3B8)', maxWidth: '60ch', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    {posts[0].excerpt}
                  </p>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: 'var(--color-text-tertiary, #64748B)', letterSpacing: '0.12em' }}>
                    {posts[0].author} · {posts[0].publishedAt ? new Date(posts[0].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unpublished'} · {posts[0].category}
                  </div>
                </Link>
              </section>
            )}

            {/* REMAINING ARTICLES */}
            <section style={{ borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                {posts.slice(1).map((post: any, idx: number) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', borderBottom: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                      <div>
                        <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', marginBottom: '0.35rem' }}>{String(idx + 2).padStart(2, '0')} / {post.category || 'INTELLIGENCE'}</div>
                        <h3 style={{ fontSize: 'clamp(1.05rem, 2vw, 1.35rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)', letterSpacing: '-0.02em', margin: 0 }}>{post.title}</h3>
                      </div>
                      <div>
                        <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.6, fontSize: '0.875rem', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>{post.excerpt}</p>
                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: 'var(--color-text-tertiary, #64748B)', letterSpacing: '0.12em' }}>
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
    </div>
  );
}
