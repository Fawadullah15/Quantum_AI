import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import AccountSettingsClient from './AccountSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/admin/login');

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, tokenVersion: true, updatedAt: true },
  });

  if (!user) redirect('/admin/login');

  return <AccountSettingsClient user={user} />;
}
