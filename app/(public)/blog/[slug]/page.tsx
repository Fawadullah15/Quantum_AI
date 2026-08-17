import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/db';

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
  if (!post) return { title: 'Not Found' };
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: post.coverImage ? [post.coverImage] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
  
  if (!post) {
    notFound();
  }

  return (
    <article style={{ paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '48rem', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', fontFamily: 'var(--font-space-mono)', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
          {post.category && <span>{post.category}</span>}
          {post.category && <span>&bull;</span>}
          <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '1.5rem' }}>{post.title}</h1>
        {post.author && (
          <div style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-space-mono)', fontSize: '0.875rem' }}>
            By {post.author}
          </div>
        )}
      </header>

      {post.coverImage && (
        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', marginBottom: '4rem', border: '1px solid var(--color-border)' }}>
          <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} />
        </div>
      )}

      <div 
        style={{ fontSize: '1.125rem', lineHeight: 1.8, color: 'var(--color-muted)' }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags && (
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(JSON.parse(post.tags) as string[]).map((tag: string) => (
            <span key={tag} style={{ padding: '0.25rem 0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-space-mono)', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: '6rem', textAlign: 'center' }}>
        <Link href="/blog" style={{ display: 'inline-block', padding: '1rem 2rem', border: '1px solid var(--color-border)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem', color: 'inherit', textDecoration: 'none' }}>
          &larr; Back to all articles
        </Link>
      </div>
    </article>
  );
}
