import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import AccountSettingsClient from './AccountSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/admin/login');

  const userId = (session.user as any)?.id;
  const userEmail = session.user?.email;

  let user = null;

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, tokenVersion: true, updatedAt: true },
    }).catch(() => null);
  }

  if (!user && userEmail) {
    user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true, role: true, tokenVersion: true, updatedAt: true },
    }).catch(() => null);
  }

  // Fallback: if single admin account
  if (!user) {
    user = await prisma.user.findFirst({
      select: { id: true, name: true, email: true, role: true, tokenVersion: true, updatedAt: true },
    }).catch(() => null);
  }

  if (!user) redirect('/admin/login');

  return (
    <AccountSettingsClient
      user={{
        id: user.id,
        name: user.name || 'Administrator',
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 1,
      }}
    />
  );
}
