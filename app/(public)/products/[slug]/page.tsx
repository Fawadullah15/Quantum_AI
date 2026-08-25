import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { createPageMetadata, getProductSchema } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } }).catch(() => null);
  if (!product || !product.published) return { title: 'Product Not Found | Quantum AI' };

  return createPageMetadata({
    title: `${product.name} — Software Product & Systems | Quantum AI`,
    description: product.description
      ? product.description.slice(0, 160)
      : `Detailed architecture specifications and feature breakdown for ${product.name}.`,
    path: `/products/${slug}`,
    image: product.heroImage || undefined,
  });
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { published: true },
    select: { slug: true },
  }).catch(() => []);
  return products.map((product: { slug: string }) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      features: { orderBy: { order: 'asc' } },
    },
  }).catch(() => null);

  if (!product || !product.published) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      published: true,
      slug: { not: slug },
    },
    take: 3,
    orderBy: { order: 'asc' },
  }).catch(() => []);

  const features = product.features || [];
  const technologies = typeof product.technologies === 'string'
    ? product.technologies.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const schemaJson = getProductSchema(product);

  const statusClass =
    product.status === 'LIVE'
      ? 'status-live'
      : product.status === 'BETA'
      ? 'status-beta'
      : 'status-dev';

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '5rem', paddingInline: 'clamp(1.25rem, 5vw, 4rem)', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', background: 'var(--color-void, #030712)' }}>
      <style>{`
        .status-live {
          color: #38BDF8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .status-beta {
          color: #1677FF;
          background: rgba(22, 119, 255, 0.12);
          border: 1px solid rgba(22, 119, 255, 0.3);
        }
        .status-dev {
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .action-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 1.5rem;
          background: linear-gradient(135deg, #1677FF, #0050B3);
          color: #FFFFFF;
          font-weight: 600;
          font-family: var(--font-mono, monospace);
          font-size: 0.8125rem;
          border-radius: 6px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 16px -2px rgba(22, 119, 255, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .action-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -4px rgba(22, 119, 255, 0.6);
        }
        .action-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 1.5rem;
          border: 1px solid rgba(56, 189, 248, 0.35);
          background: rgba(56, 189, 248, 0.08);
          font-weight: 600;
          font-family: var(--font-mono, monospace);
          font-size: 0.8125rem;
          border-radius: 6px;
          text-decoration: none;
          color: #38BDF8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: background-color 0.2s, border-color 0.2s;
        }
        .action-btn-secondary:hover {
          background: rgba(56, 189, 248, 0.16);
          border-color: rgba(56, 189, 248, 0.5);
        }
      `}</style>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      {/* Breadcrumb back link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/products"
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.72rem',
            color: '#38BDF8',
            textDecoration: 'none',
            letterSpacing: '0.1em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          ← Back to Software Systems
        </Link>
      </div>

      {/* Header */}
      <header style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '4px', fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }} className={statusClass}>
            {product.status?.replace(/_/g, ' ') || 'LIVE'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {product.category || 'AI Software'}
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1rem', color: '#F8FAFC' }}>
          {product.name}
        </h1>

        <p style={{ fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: '#94A3B8', maxWidth: '800px', lineHeight: 1.65, margin: '0 0 1.75rem 0', fontWeight: 300 }}>
          {product.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {product.demoUrl ? (
            <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" className="action-btn-primary">
              VIEW LIVE DEMO ↗
            </a>
          ) : (
            <Link href="/contact" className="action-btn-primary">
              REQUEST ARCHITECTURE DEMO →
            </Link>
          )}

          {product.docsUrl && (
            <a href={product.docsUrl} target="_blank" rel="noopener noreferrer" className="action-btn-secondary">
              DOCUMENTATION ↗
            </a>
          )}
        </div>
      </header>

      {/* Hero Image if present */}
      {product.heroImage && (
        <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#020714', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '3rem', overflow: 'hidden', boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.heroImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Core Features */}
      {features.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
            01 // CAPABILITIES
          </div>
          <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
            System Features &amp; Modules
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {features.map((feature, i) => (
              <div key={i} style={{ padding: '1.35rem', border: '1px solid rgba(22, 119, 255, 0.16)', background: 'rgba(6, 21, 43, 0.65)', borderRadius: '10px' }}>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#38BDF8', letterSpacing: '0.1em', marginBottom: '0.5rem', fontWeight: 600 }}>
                  FEATURE {String(i + 1).padStart(2, '0')}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: '#F8FAFC', lineHeight: 1.3 }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.86rem', margin: 0, fontWeight: 300 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technology Stack */}
      {technologies.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
            02 // ARCHITECTURE
          </div>
          <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', fontWeight: 700, marginBottom: '1.25rem', textTransform: 'uppercase', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
            Engineered Technology Stack
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {technologies.map((tech: string) => (
              <div key={tech} style={{ padding: '0.35rem 0.85rem', border: '1px solid rgba(22, 119, 255, 0.18)', background: 'rgba(6, 21, 43, 0.6)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.78rem', color: '#F8FAFC', borderRadius: '4px' }}>
                {tech}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{ marginBottom: '4rem', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
            EXPLORE PLATFORMS
          </div>
          <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Other Quantum AI Systems
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {relatedProducts.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                style={{
                  backgroundColor: 'rgba(6, 21, 43, 0.65)',
                  border: '1px solid rgba(22, 119, 255, 0.16)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s, border-color 0.2s, transform 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                    {item.category || 'AI Software'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>
                    {item.status || 'LIVE'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', color: '#F8FAFC', fontWeight: 600, margin: '0.2rem 0', lineHeight: 1.3 }}>
                  {item.name}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.45, margin: 0, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>
                <span style={{ marginTop: 'auto', paddingTop: '0.5rem', color: '#38BDF8', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  SYSTEM DETAILS →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Box */}
      <section style={{ textAlign: 'center', paddingTop: '3.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)', marginTop: '2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 600 }}>
          DEPLOYMENT &amp; INTEGRATION
        </div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.35rem)', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Interested in Deploying {product.name}?
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.6, fontWeight: 300 }}>
          Connect with our engineering leads to discuss custom enterprise integration, data connectivity, and cloud architecture.
        </p>
        <Link
          href="/contact"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.8rem 2rem',
            background: 'linear-gradient(135deg, #1677FF, #0050B3)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            letterSpacing: '0.1em',
            borderRadius: '8px',
            textDecoration: 'none',
            boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
            textTransform: 'uppercase',
          }}
        >
          REQUEST DEPLOYMENT ARCHITECTURE →
        </Link>
      </section>
    </div>
  );
}
