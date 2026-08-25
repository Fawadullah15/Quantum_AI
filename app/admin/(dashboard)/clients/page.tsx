import prisma from '@/lib/db';
import ClientsManagerClient from './client';

export const metadata = {
  title: 'Clients & Organizations Worked With | Admin Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function ClientsAdminPage() {
  const clients = await prisma.client.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  }).catch(() => []);

  return (
    <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
          CONTENT MANAGEMENT
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
          With Whom We Have Worked With
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#94A3B8', maxWidth: '650px', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
          Manage client organizations, institutions, and platforms displayed in the &quot;With Whom We Have Worked With&quot; landing page section.
        </p>
      </div>

      <ClientsManagerClient clients={clients} />
    </div>
  );
}
