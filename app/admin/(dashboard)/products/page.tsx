import prisma from '@/lib/db';
import ProductsClient from './client';

export const metadata = {
  title: 'Admin - Products',
};

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: '#111827', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Products Management</h1>
      <ProductsClient products={products} />
    </div>
  );
}
