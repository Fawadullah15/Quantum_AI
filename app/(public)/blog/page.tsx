import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/db';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: 'Engineering Insights & Research Blog — Quantum AI',
  description: 'Practical guides, architectural blueprints, and deep dives on artificial intelligence, business automation, and custom software systems from Quantum AI.',
  path: '/blog',
});

const FALLBACK_POSTS = [
  {
    id: 'f-1',
    title: 'How Business Process Automation Reduces Repetitive Work & Human Error',
    slug: 'how-business-automation-reduces-repetitive-work',
    excerpt: 'Explore how modern businesses replace manual data entry, disconnected spreadsheets, and delayed status handoffs with event-driven automation pipelines.',
    category: 'Automation',
    publishedAt: new Date('2026-02-15'),
    createdAt: new Date('2026-02-15'),
    author: 'Quantum AI Engineering',
  },
  {
    id: 'f-2',
    title: 'Custom Software vs. Off-the-Shelf SaaS: When Should Your Business Build?',
    slug: 'custom-software-vs-off-the-shelf',
    excerpt: 'A practical framework for business leaders evaluating the trade-offs between subscription SaaS platforms and proprietary custom software architectures.',
    category: 'Custom Software',
    publishedAt: new Date('2026-02-18'),
    createdAt: new Date('2026-02-18'),
    author: 'Quantum AI Engineering',
  },
  {
    id: 'f-3',
    title: 'AI Agents for Business Operations: How Multi-Agent Systems Execute Workflows',
    slug: 'ai-agents-for-business-operations',
    excerpt: 'Beyond simple chatbots: understanding how autonomous multi-agent networks collaborate, retrieve private data, and execute multi-step business decisions.',
    category: 'Artificial Intelligence',
    publishedAt: new Date('2026-02-20'),
    createdAt: new Date('2026-02-20'),
    author: 'Quantum AI Engineering',
  },
  {
    id: 'f-4',
    title: 'How to Unify Disconnected Business Systems with API & Data Integration',
    slug: 'connecting-disconnected-business-systems',
    excerpt: 'A technical guide on building middleware layers, bidirectional database synchronization, and event-driven API connectors across legacy and modern platforms.',
    category: 'Software Integration',
    publishedAt: new Date('2026-02-22'),
    createdAt: new Date('2026-02-22'),
    author: 'Quantum AI Engineering',
  },
];

export default async function BlogPage() {
  const dbPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  }).catch(() => []);

  const posts = dbPosts && dbPosts.length > 0 ? dbPosts : FALLBACK_POSTS;

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))', minHeight: '100vh', background: 'var(--color-void, #030712)' }}>
      <style>{`
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
          width: 100%;
        }
        .blog-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 1.25rem 1.35rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.2s, background-color 0.2s;
          box-sizing: border-box;
        }
        .blog-card:hover {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
        }
        .blog-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          margin-bottom: 0.65rem;
        }
        .blog-card-cat {
          color: #38BDF8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .blog-card-date {
          color: #64748B;
        }
        .blog-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #F8FAFC;
          line-height: 1.35;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
        }
        .blog-card-excerpt {
          color: #94A3B8;
          font-size: 0.86rem;
          line-height: 1.55;
          margin: 0 0 1rem 0;
          font-weight: 300;
        }
        .blog-card-action {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #1677FF;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding-top: 0.65rem;
          border-top: 1px solid rgba(22, 119, 255, 0.12);
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>SYS.09 / ARTICLES & RESEARCH</div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', color: '#F8FAFC', margin: '0 0 0.5rem 0' }}>
            ENGINEERING INSIGHTS & STRATEGY.
          </h1>
          <p style={{ fontSize: 'clamp(0.88rem, 1.3vw, 0.98rem)', color: '#94A3B8', maxWidth: 640, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
            Practical blueprints on artificial intelligence, business automation, and custom software architecture from Quantum AI engineers.
          </p>
        </div>

        <div className="blog-grid">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
              <div>
                <div className="blog-card-meta">
                  <span className="blog-card-cat">{post.category || 'Insights'}</span>
                  <span className="blog-card-date">{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
              </div>
              <div className="blog-card-action">
                READ ARTICLE →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
