import prisma from '@/lib/db';
import MessagesListClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contact Inquiries & Messages | Admin Dashboard',
};

export default async function MessagesPage() {
  const messages = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  return (
    <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
          COMMUNICATIONS
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
          Contact Inquiries & Submissions
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#94A3B8', maxWidth: '650px', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
          Manage client project inquiries, technical requests, and direct communications submitted through the website.
        </p>
      </div>

      <MessagesListClient messages={messages as any} />
    </div>
  );
}
