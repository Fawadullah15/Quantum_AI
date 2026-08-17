'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTechnology(data: any) {
  await prisma.technology.create({ data })
  revalidatePath('/admin/technology')
}

export async function updateTechnology(id: string, data: any) {
  await prisma.technology.update({ where: { id }, data })
  revalidatePath('/admin/technology')
}

export async function deleteTechnology(id: string) {
  await prisma.technology.delete({ where: { id } })
  revalidatePath('/admin/technology')
}
