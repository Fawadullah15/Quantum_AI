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
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container">
      <div style={{ maxWidth: 'var(--max-width, 1000px)', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>SYS.03 / PRODUCTS</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            SOFTWARE SYSTEMS.
          </h1>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed rgba(30,58,138,0.3)', borderRadius: 8, color: '#94A3B8' }}>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>PRODUCTS COMING SOON</p>
            <Link href="/contact" style={{ display: 'inline-block', padding: '0.6rem 1.25rem', backgroundColor: '#1677FF', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>CONTACT US</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {products.map((product, index) => {
              const techList = (product.technologies || '').split(',').map(t => t.trim()).filter(Boolean);
              return (
                <div key={product.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingTop: '1.75rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'rgba(56, 189, 248, 0.35)', lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono, monospace)' }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#64748B' }}>{product.category}</div>
                      <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: product.status === 'LIVE' ? '#55D6FF' : '#94A3B8' }}>{product.status}</div>
                    </div>
                  </div>

                  <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.025em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0, transition: 'color 0.2s' }}>
                      {product.name}
                    </h2>
                  </Link>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.6, maxWidth: '560px', margin: '0 0 1.25rem' }}>
                        {product.description}
                      </p>
                      <div>
                        <Link href={`/products/${product.slug}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem',
                            letterSpacing: '0.12em', color: '#1677FF',
                            textDecoration: 'none', borderBottom: '1px solid rgba(22, 119, 255, 0.4)', paddingBottom: '0.2rem',
                            transition: 'border-color 0.2s',
                          }}>
                            SYSTEM DETAILS ↗
                          </Link>
                      </div>
                    </div>
                    
                    {techList.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '1px solid var(--color-border, rgba(30,58,138,0.22))', paddingLeft: '1.25rem' }}>
                        <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.62rem', color: '#64748B', letterSpacing: '0.15em' }}>CORE TECHNOLOGIES</div>
                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem', color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.7 }}>
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
