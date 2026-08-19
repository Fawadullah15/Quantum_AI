import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Insights & Databank — Quantum AI',
  description: 'Perspectives, technical deep dives, and analysis from the engineers at Quantum AI.',
};

export default async function InsightsPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  }).catch(() => []);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) * 2)', paddingBottom: 'var(--space-32, 6rem)', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }}>
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        {/* MASTHEAD */}
        <section style={{ marginBottom: 'var(--space-24, 3rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>SYS.13 / DATABANK</div>
          <h1 style={{
            fontSize: 'clamp(3rem, 10vw, 8rem)',
            fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em',
            color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0,
          }}>
            INSIGHTS.
          </h1>
        </section>

        {posts.length === 0 ? (
          <section style={{ borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-16, 2rem)' }}>
            <p style={{ color: 'var(--color-text-secondary, #94A3B8)', fontSize: '1.2rem', fontFamily: 'var(--font-mono, monospace)' }}>
              NO PUBLISHED ARTICLES YET. CHECK BACK SOON.
            </p>
          </section>
        ) : (
          <>
            {/* FEATURED — first article */}
            {posts[0] && (
              <section style={{ borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-16, 2rem)', marginBottom: 'var(--space-16, 2rem)' }}>
                <Link href={`/blog/${posts[0].slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#55D6FF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>FEATURED ARTICLE</div>
                  <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {posts[0].title}
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary, #94A3B8)', maxWidth: '60ch', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {posts[0].excerpt}
                  </p>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: 'var(--color-text-tertiary, #64748B)', letterSpacing: '0.15em' }}>
                    {posts[0].author} · {posts[0].publishedAt ? new Date(posts[0].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unpublished'} · {posts[0].category}
                  </div>
                </Link>
              </section>
            )}

            {/* REMAINING ARTICLES */}
            <section style={{ borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-16, 2rem)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                {posts.slice(1).map((post: any, idx: number) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-8, 1.5rem)', paddingBottom: 'var(--space-8, 1.5rem)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-8, 1.5rem)', alignItems: 'start' }}>
                      <div>
                        <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>{String(idx + 2).padStart(2, '0')} / {post.category || 'INTELLIGENCE'}</div>
                        <h3 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)', letterSpacing: '-0.02em', margin: 0 }}>{post.title}</h3>
                      </div>
                      <div>
                        <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.6, marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>{post.excerpt}</p>
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
