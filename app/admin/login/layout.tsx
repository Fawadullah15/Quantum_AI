import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error('[Login Layout] Session check error:', err);
  }

  if (session && (session as any).user && (session as any).user.id) {
    redirect('/admin');
  }

  return <>{children}</>;
}
