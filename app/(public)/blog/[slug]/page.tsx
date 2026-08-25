import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/db';
import { createPageMetadata, getArticleSchema } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
  if (!post) return { title: 'Article Not Found' };
  
  return createPageMetadata({
    title: `${post.title} — Insights & Engineering | Quantum AI`,
    description: post.excerpt || `Read ${post.title} by ${post.author || 'Quantum AI Team'}.`,
    path: `/blog/${slug}`,
    image: post.coverImage || undefined,
    type: 'article',
    publishedTime: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    authors: post.author ? [post.author] : ['Quantum AI Team'],
  });
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []);
  return posts.map((post: { slug: string }) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
  
  if (!post) {
    notFound();
  }

  const articleSchema = getArticleSchema(post);

  return (
    <article style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '44rem', margin: '0 auto' }}>
      {/* Schema.org Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#38BDF8', marginBottom: '1rem' }}>
          {post.category && <span>{post.category}</span>}
          {post.category && <span>&bull;</span>}
          <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem', color: '#F8FAFC' }}>{post.title}</h1>
        {post.author && (
          <div style={{ color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem' }}>
            By {post.author}
          </div>
        )}
      </header>

      {post.coverImage && (
        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', marginBottom: '2.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(30,58,138,0.22)' }}>
          <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} />
        </div>
      )}

      <div 
        style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#CBD5E1' }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {(() => {
        let tags: string[] = [];
        if (post.tags) {
          try {
            const parsed = JSON.parse(post.tags);
            tags = Array.isArray(parsed) ? parsed : [String(parsed)];
          } catch {
            tags = post.tags.split(',').map(t => t.trim()).filter(Boolean);
          }
        }
        if (tags.length === 0) return null;
        return (
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(30,58,138,0.22)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {tags.map((tag: string) => (
              <span key={tag} style={{ padding: '0.2rem 0.65rem', background: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(30,58,138,0.22)', borderRadius: '4px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#94A3B8' }}>
                #{tag.trim()}
              </span>
            ))}
          </div>
        );
      })()}

      <div style={{ marginTop: '3.5rem', textAlign: 'center' }}>
        <Link href="/blog" style={{ display: 'inline-block', padding: '0.7rem 1.75rem', border: '1px solid rgba(56, 189, 248, 0.35)', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8125rem', color: '#38BDF8', textDecoration: 'none' }}>
          &larr; Back to all articles
        </Link>
      </div>
    </article>
  );
}
