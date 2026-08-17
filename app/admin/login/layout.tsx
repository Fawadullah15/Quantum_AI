import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/admin')
  }
  return <>{children}</>
}
