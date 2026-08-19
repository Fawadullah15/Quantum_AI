import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Products & Systems — Quantum AI',
  description: 'Intelligent software platforms, custom engines, and digital products engineered by Quantum AI.',
};

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => []);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) * 2)', paddingBottom: 'var(--space-48, 6rem)', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-32, 4rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>SYS.03 / PRODUCTS</div>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            SOFTWARE<br />SYSTEMS.
          </h1>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, color: '#94A3B8' }}>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>PRODUCTS COMING SOON</p>
            <Link href="/contact" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#1677FF', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>CONTACT US</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-48, 4rem)' }}>
            {products.map((product, index) => {
              const techList = (product.technologies || '').split(',').map(t => t.trim()).filter(Boolean);
              return (
                <div key={product.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6, 1.5rem)', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-12, 2.5rem)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 'clamp(4rem, 10vw, 10rem)', fontWeight: 700, color: 'var(--color-border-2, rgba(255,255,255,0.15))', lineHeight: 0.8, letterSpacing: '-0.05em', fontFamily: 'var(--font-mono, monospace)' }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#64748B' }}>{product.category}</div>
                      <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: product.status === 'LIVE' ? '#55D6FF' : '#94A3B8' }}>{product.status}</div>
                    </div>
                  </div>

                  <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0, transition: 'color 0.2s' }}>
                      {product.name}
                    </h2>
                  </Link>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-12, 2.5rem)' }}>
                    <div>
                      <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.6, maxWidth: '600px', margin: '0 0 1.5rem' }}>
                        {product.description}
                      </p>
                      <div>
                        <Link href={`/products/${product.slug}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem',
                            letterSpacing: '0.2em', color: '#1677FF',
                            textDecoration: 'none', borderBottom: '1px solid rgba(22, 119, 255, 0.4)', paddingBottom: '0.25rem',
                            transition: 'border-color 0.2s',
                          }}>
                            SYSTEM DETAILS ↗
                          </Link>
                      </div>
                    </div>
                    
                    {techList.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingLeft: 'var(--space-6, 1.5rem)' }}>
                        <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em' }}>CORE TECHNOLOGIES</div>
                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem', color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.8 }}>
                          {techList.map(t => <div key={t}>{t}</div>)}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
