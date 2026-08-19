'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function createService(data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const service = await prisma.service.create({
    data: {
      name: data.name,
      category: data.category || 'AI',
      description: data.description || '',
      icon: data.icon || null,
      order: parseInt(data.order, 10) || 0,
      published: data.published === 'true' || data.published === true || data.published === 'on' || data.published === undefined,
    }
  })

  revalidatePath('/admin/services')
  revalidatePath('/services')
  revalidatePath('/systems')
  revalidatePath('/')
  return service
}

export async function updateService(id: string, data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const updateData: any = { ...data }
  if (data.order !== undefined) updateData.order = parseInt(data.order, 10)
  if (data.published !== undefined) updateData.published = Boolean(data.published)

  const service = await prisma.service.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/admin/services')
  revalidatePath('/services')
  revalidatePath('/systems')
  revalidatePath('/')
  return service
}

export async function deleteService(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  await prisma.service.delete({ where: { id } })
  revalidatePath('/admin/services')
  revalidatePath('/services')
  revalidatePath('/systems')
  revalidatePath('/')
}
