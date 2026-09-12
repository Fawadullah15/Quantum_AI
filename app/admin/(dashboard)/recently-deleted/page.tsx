import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getRecentlyDeletedItems, getRecoveryAuditLogs } from '@/lib/recovery';
import RecentlyDeletedClient from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Recently Deleted & Recovery | Quantum Admin',
};

export default async function RecentlyDeletedPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/admin/login');
  }

  const [data, auditLogs] = await Promise.all([
    getRecentlyDeletedItems({ limit: 100 }),
    getRecoveryAuditLogs(30),
  ]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#06B6D4', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
          DATA PROTECTION &amp; RECOVERY VAULT
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
          Recently Deleted
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
          Centralized CMS recovery hub. Any record deleted across the website is safely held here with its complete relational graph, media links, and metadata, ready to be restored.
        </p>
      </div>

      <RecentlyDeletedClient initialData={data} initialAuditLogs={auditLogs} />
    </div>
  );
}
