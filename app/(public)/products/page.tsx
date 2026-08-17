import prisma from '@/lib/db'
import Link from 'next/link'

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  })

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div className="tech-label">SYS.03 / PRODUCTS</div>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          SOFTWARE<br />SYSTEMS.
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-48)' }}>
        {products.map((product, index) => (
          <div key={product.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-12)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 'clamp(4rem, 10vw, 10rem)', fontWeight: 700, color: 'var(--color-border-2)', lineHeight: 0.8, letterSpacing: '-0.05em', fontFamily: 'var(--font-mono)' }}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="eyebrow">{product.category}</div>
                <div className="eyebrow" style={{ color: product.status === 'LIVE' ? 'var(--color-core)' : 'var(--color-text-tertiary)' }}>{product.status}</div>
              </div>
            </div>

            <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', textTransform: 'uppercase', marginBottom: 'var(--space-6)', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-core)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}>
                {product.name}
              </h2>
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-12)' }}>
              <div>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
                  {product.description}
                </p>
                <div style={{ marginTop: 'var(--space-6)' }}>
                   <Link href={`/products/${product.slug}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                      letterSpacing: '0.2em', color: 'var(--color-text-primary)',
                      textDecoration: 'none', borderBottom: '1px solid var(--color-border-2)', paddingBottom: '0.25rem',
                      transition: 'border-color 0.2s',
                    }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-core)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-2)'}>
                      SYSTEM DETAILS ↗
                    </Link>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-6)' }}>
                 <div className="eyebrow">CORE TECHNOLOGIES</div>
                 <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                   {product.technologies.split(',').map(t => <div key={t}>{t.trim()}</div>)}
                 </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
