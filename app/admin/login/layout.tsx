import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  try {
    const session = await getServerSession(authOptions);
    if (session) {
      redirect('/admin');
    }
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    // Ignore session errors and gracefully display the login page
  }
  return <>{children}</>;
}
