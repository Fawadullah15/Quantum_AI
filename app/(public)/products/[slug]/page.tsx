import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } }).catch(() => null);
  if (!product) return { title: 'Not Found' };
  
  return {
    title: product.name,
    description: product.description,
  };
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []);
  return products.map((product: { slug: string }) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { features: { orderBy: { order: 'asc' } } },
  }).catch(() => null);
  
  if (!product) {
    notFound();
  }

  const features = product.features || [];
  const technologies = typeof product.technologies === 'string' ? product.technologies.split(',') : [];

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '64rem', margin: '0 auto' }}>
      <header style={{ marginBottom: '4rem', paddingBottom: '4rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ padding: '0.25rem 0.75rem', background: 'var(--color-border)', fontSize: '0.75rem', fontFamily: 'var(--font-space-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)' }}>
            {product.status?.replace('_', ' ') || 'Active'}
          </span>
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.875rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
            {product.category}
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '1.5rem' }}>{product.name}</h1>
        <p style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', color: 'var(--color-muted)', maxWidth: '48rem', lineHeight: 1.6 }}>
          {product.description}
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
          {product.demoUrl && (
            <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '1rem 2rem', background: 'var(--color-primary)', color: 'var(--color-bg)', fontWeight: 700, textDecoration: 'none' }}>
              VIEW DEMO
            </a>
          )}
          {product.docsUrl && (
            <a href={product.docsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '1rem 2rem', border: '1px solid var(--color-border)', fontWeight: 700, textDecoration: 'none', color: 'inherit' }}>
              DOCUMENTATION
            </a>
          )}
        </div>
      </header>

      {features.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '3rem', textTransform: 'uppercase' }}>Core Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {features.map((feature, i) => (
              <div key={i} style={{ padding: '1.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {technologies.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '3rem', textTransform: 'uppercase' }}>Technology Stack</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {technologies.map((tech: string) => (
              <div key={tech} style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--color-border)', fontFamily: 'var(--font-space-mono)' }}>
                {tech.trim()}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ textAlign: 'center', paddingTop: '6rem', borderTop: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Interested in this product?</h2>
        <Link href="/contact" style={{ display: 'inline-block', padding: '1rem 2rem', background: 'var(--color-primary)', color: 'var(--color-bg)', fontWeight: 700, textDecoration: 'none' }}>
          CONTACT SALES
        </Link>
      </section>
    </div>
  );
}
