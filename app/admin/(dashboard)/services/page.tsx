import prisma from '@/lib/db'
import ServicesClient from './client'

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { order: 'asc' }
  })
  
  return <ServicesClient initialData={services} />
}
