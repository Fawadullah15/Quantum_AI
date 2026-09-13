import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import '../admin-tailwind.css';
import { AdminShell } from './AdminShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;

  return (
    <AdminShell
      userName={user?.name ?? 'Admin'}
      userRole={user?.role ?? 'SUPER ADMIN'}
    >
      {children}
    </AdminShell>
  );
}
