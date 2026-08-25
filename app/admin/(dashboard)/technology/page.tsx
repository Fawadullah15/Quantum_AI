import prisma from '@/lib/db';
import TechnologyClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Technology Stack | Quantum Admin',
};

export default async function TechnologyPage() {
  const technologies = await prisma.technology.findMany({
    orderBy: [{ order: 'asc' }, { category: 'asc' }],
  }).catch(() => []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
          ENGINEERING ARCHITECTURE
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
          Technology Stack &amp; Frameworks
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
          Manage core engineering stacks, machine learning frameworks, data architectures, and public technology detail pages.
        </p>
      </div>

      <TechnologyClient initialData={technologies} />
    </div>
  );
}
