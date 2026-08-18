import prisma from '@/lib/db';
import ProductsClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Products Management | Quantum Admin',
};

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { order: 'asc' },
  }).catch(() => []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Products</h1>
        <p style={{ color: '#64748B', fontSize: '0.825rem', marginTop: '0.25rem' }}>
          Manage software products, tools, and SaaS offerings built by Quantum AI.
        </p>
      </div>
      <ProductsClient products={products} />
    </div>
  );
}
