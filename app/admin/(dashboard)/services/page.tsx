import prisma from '@/lib/db';
import ServicesClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Services Management | Quantum Admin',
};

export default async function ServicesPage() {
  const dbServices = await prisma.service.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  }).catch(() => []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
          CORE CAPABILITIES
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
          Services &amp; Solutions
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
          Manage service offerings, capability narratives, categories, and ordering displayed across the public Services page and homepage.
        </p>
      </div>

      <ServicesClient initialData={dbServices} />
    </div>
  );
}
