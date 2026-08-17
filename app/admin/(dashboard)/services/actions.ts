'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createService(data: any) {
  await prisma.service.create({ data })
  revalidatePath('/admin/services')
}

export async function updateService(id: string, data: any) {
  await prisma.service.update({ where: { id }, data })
  revalidatePath('/admin/services')
}

export async function deleteService(id: string) {
  await prisma.service.delete({ where: { id } })
  revalidatePath('/admin/services')
}
