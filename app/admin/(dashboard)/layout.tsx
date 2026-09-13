import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import '../admin-tailwind.css';
import { AdminShell } from './AdminShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error('[Admin Layout] Session retrieval error:', err);
  }

  if (!session || !session.user || !(session.user as any).id) {
    redirect('/admin/login');
  }

  const user = session.user as { name?: string; email?: string; role?: string };

  return (
    <AdminShell
      userName={user?.name ?? 'Admin'}
      userRole={user?.role ?? 'SUPER ADMIN'}
    >
      {children}
    </AdminShell>
  );
}
