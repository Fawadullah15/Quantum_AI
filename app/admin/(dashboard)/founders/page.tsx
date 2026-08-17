import prisma from '@/lib/db'
import FoundersClient from './client'

export const metadata = {
  title: 'Manage Founders | Admin Dashboard',
}

export default async function FoundersPage() {
  const founders = await prisma.founder.findMany({
    orderBy: {
      order: 'asc',
    },
  })

  return <FoundersClient initialFounders={founders} />
}
