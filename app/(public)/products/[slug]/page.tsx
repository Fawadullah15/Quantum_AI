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
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '60rem', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--color-border, rgba(30,58,138,0.22))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ padding: '0.2rem 0.65rem', background: 'rgba(22, 119, 255, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38BDF8' }}>
            {product.status?.replace('_', ' ') || 'Active'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase' }}>
            {product.category}
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.85rem, 4.5vw, 3rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem', color: '#F8FAFC' }}>{product.name}</h1>
        <p style={{ fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: '#94A3B8', maxWidth: '48rem', lineHeight: 1.6 }}>
          {product.description}
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
          {product.demoUrl && (
            <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.7rem 1.75rem', background: 'linear-gradient(135deg, #1677FF, #0050B3)', color: '#FFFFFF', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '6px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              VIEW DEMO
            </a>
          )}
          {product.docsUrl && (
            <a href={product.docsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.7rem 1.75rem', border: '1px solid rgba(56, 189, 248, 0.35)', background: 'rgba(56, 189, 248, 0.08)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '6px', textDecoration: 'none', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              DOCUMENTATION
            </a>
          )}
        </div>
      </header>

      {features.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: '#F8FAFC' }}>Core Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {features.map((feature, i) => (
              <div key={i} style={{ padding: '1.25rem', border: '1px solid rgba(30,58,138,0.22)', background: 'rgba(6, 21, 43, 0.65)', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: '#F8FAFC' }}>{feature.title}</h3>
                <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.875rem', margin: 0 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {technologies.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: '#F8FAFC' }}>Technology Stack</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {technologies.map((tech: string) => (
              <div key={tech} style={{ padding: '0.45rem 1rem', border: '1px solid rgba(30,58,138,0.22)', background: 'rgba(6, 21, 43, 0.5)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem', color: '#F8FAFC', borderRadius: '4px' }}>
                {tech.trim()}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ textAlign: 'center', paddingTop: '3.5rem', borderTop: '1px solid rgba(30,58,138,0.22)' }}>
        <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', fontWeight: 700, marginBottom: '1.25rem', color: '#F8FAFC' }}>Interested in this product?</h2>
        <Link href="/contact" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #1677FF, #0050B3)', color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem', borderRadius: '6px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          CONTACT SALES
        </Link>
      </section>
    </div>
  );
}
