import prisma from '@/lib/db'
import TechnologyClient from './client'

export default async function TechnologyPage() {
  const technologies = await prisma.technology.findMany({
    orderBy: { order: 'asc' }
  })
  
  return <TechnologyClient initialData={technologies} />
}
