import BackupClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Database Backup & Restore | Quantum Admin',
};

export default function BackupPage() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
          SYSTEM PRESERVATION
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
          Database Backup &amp; Restore
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
          Create complete snapshots of the website's database, review previous backups, and safely restore the system to a previous state. Media files are stored externally and are not part of these text-based database backups.
        </p>
      </div>

      <BackupClient />
    </div>
  );
}
