import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import MessageDetailClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Message Details | Admin Dashboard',
};

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const message = await prisma.contactSubmission.findUnique({
    where: { id },
  });

  if (!message) {
    notFound();
  }

  return (
    <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <MessageDetailClient message={message as any} />
    </div>
  );
}
