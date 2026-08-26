import prisma from '@/lib/db';
import LeadershipClient from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Leadership & Team Management | Quantum Admin',
};

export default async function LeadershipPage() {
  const members = await prisma.leadership.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  }).catch(() => []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
          ORGANIZATIONAL STRUCTURE
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
          Leadership &amp; Engineering Team
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
          Manage executive leadership, software architects, AI researchers, and engineering profiles displayed on the public Leadership &amp; About directories.
        </p>
      </div>

      <LeadershipClient initialMembers={members} />
    </div>
  );
}