import prisma from '@/lib/db';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Software Products - Quantum AI',
  description: 'Explore software products, internal business tools, and AI-powered platforms built by Quantum AI.',
  path: '/products',
});

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { published: true },
    include: {
      features: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  }).catch(() => []);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '5rem', minHeight: '100vh', paddingInline: 'clamp(1rem, 4vw, 3rem)', background: 'transparent' }}>
      <style>{`
        .products-page-container {
          max-width: 1160px;
          margin: 0 auto;
        }
        .products-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        .product-card {
          background-color: rgba(6, 21, 43, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.16);
          border-left: 3px solid #1677FF;
          border-radius: 12px;
          padding: 1.35rem clamp(1rem, 2.5vw, 1.85rem);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          text-decoration: none;
          outline: none;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s, background-color 0.25s;
          box-sizing: border-box;
          width: 100%;
        }
        .product-card:hover {
          background-color: rgba(8, 28, 58, 0.9);
          border-color: rgba(56, 189, 248, 0.5);
          border-left-color: #38BDF8;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.7), 0 0 20px -6px rgba(56, 189, 248, 0.25);
        }
        .product-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4);
        }
        .product-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(56, 189, 248, 0.12);
          padding-bottom: 0.75rem;
        }
        .product-num {
          font-family: var(--font-d-din);
          font-size: 1.15rem;
          font-weight: 700;
          color: #38BDF8;
        }
        .product-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .product-category-badge {
          font-family: var(--font-d-din);
          font-size: 0.68rem;
          color: #38BDF8;
          background-color: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .product-status-badge {
          font-family: var(--font-d-din);
          font-size: 0.65rem;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.08em;
        }
        .status-live {
          color: #34D399;
          background: rgba(52, 211, 153, 0.12);
          border: 1px solid rgba(52, 211, 153, 0.35);
        }
        .status-beta {
          color: #38BDF8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.35);
        }
        .status-dev {
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .product-title {
          font-size: clamp(1.2rem, 2.2vw, 1.45rem);
          font-weight: 700;
          color: #F8FAFC;
          letter-spacing: -0.015em;
          text-transform: uppercase;
          margin: 0;
          transition: color 0.2s;
        }
        .product-card:hover .product-title {
          color: #38BDF8;
        }
        .product-desc {
          color: #CBD5E1;
          font-size: 0.88rem;
          line-height: 1.6;
          max-width: 860px;
          margin: 0;
          font-weight: 300;
        }
        .product-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.35rem;
          font-family: var(--font-d-din);
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .product-tech-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .product-tech-tag {
          font-size: 0.72rem;
          font-family: var(--font-d-din);
          padding: 0.2rem 0.55rem;
          background-color: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 4px;
          color: #E2E8F0;
        }
        .product-action-text {
          font-size: 0.75rem;
          color: #38BDF8;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: color 0.2s, transform 0.2s;
          margin-left: auto;
        }
        .product-card:hover .product-action-text {
          color: #FFFFFF;
          transform: translateX(4px);
        }

        @media (max-width: 767px) {
          .product-card {
            padding: 1rem;
            gap: 0.65rem;
            border-radius: 10px;
          }
          .product-title {
            font-size: 1.05rem !important;
          }
          .product-desc {
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .product-tech-tag {
            font-size: 0.65rem !important;
            padding: 0.15rem 0.45rem !important;
          }
        }
      `}</style>

      <div className="products-page-container">
        {/* Header */}
        <div style={{ marginBottom: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>
          <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', letterSpacing: '0.25em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
            [04 — PRODUCTS]
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            SOFTWARE PRODUCTS &amp; PLATFORMS.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#FFFFFF', maxWidth: 640, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
            Software products and AI-powered platforms built by Quantum AI.
          </p>
        </div>

        {products.length === 0 ? (
          <div style={{
            background: 'rgba(6, 21, 43, 0.4)',
            border: '1px dashed rgba(22, 119, 255, 0.25)',
            borderRadius: 14,
            padding: '4rem 2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.7rem', letterSpacing: '0.2em', color: '#FFFFFF', marginBottom: '0.75rem', fontWeight: 600 }}>
              PRODUCTS IN PRODUCTION
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Software Catalog Under Deployment
            </h2>
            <p style={{ color: '#FFFFFF', maxWidth: 440, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Our software products are being prepared for public documentation. Contact our team for more information.
            </p>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                padding: '0.65rem 1.5rem',
                backgroundColor: '#1677FF',
                borderRadius: 6,
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-d-din)',
              }}
            >
              DISCUSS CUSTOM SOFTWARE →
            </Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product, index) => {
              const techList = (product.technologies || '')
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);

              const statusClass =
                product.status === 'LIVE'
                  ? 'status-live'
                  : product.status === 'BETA'
                  ? 'status-beta'
                  : 'status-dev';

              return (
                <Link key={product.id} href={`/products/${product.slug}`} className="product-card">
                  <div className="product-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="product-num">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="product-category-badge">
                        {product.category || 'AI Software'}
                      </span>
                    </div>

                    <div className="product-meta">
                      <span className={`product-status-badge ${statusClass}`}>
                        {product.status?.replace(/_/g, ' ') || 'LIVE'}
                      </span>
                    </div>
                  </div>

                  <h2 className="product-title">
                    {product.name}
                  </h2>

                  <p className="product-desc">
                    {product.description}
                  </p>

                  <div className="product-action-row">
                    {techList.length > 0 ? (
                      <div className="product-tech-list">
                        {techList.slice(0, 4).map((t) => (
                          <span key={t} className="product-tech-tag">
                            {t}
                          </span>
                        ))}
                        {techList.length > 4 && (
                          <span className="product-tech-tag">+{techList.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <div />
                    )}

                    <span className="product-action-text">
                      VIEW PRODUCT →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
