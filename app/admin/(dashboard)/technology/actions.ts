'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTechnology(data: any) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  await prisma.technology.create({
    data: {
      ...data,
      slug,
      features: data.features || '[]',
      useCases: data.useCases || '[]',
    }
  })
  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath('/technologies/[slug]')
}

export async function updateTechnology(id: string, data: any) {
  const updateData: any = { ...data }
  
  if (data.name && !data.slug) {
    updateData.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  
  updateData.features = data.features || '[]'
  updateData.useCases = data.useCases || '[]'
  
  await prisma.technology.update({ where: { id }, data: updateData })
  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath('/technologies/[slug]')
}

export async function deleteTechnology(id: string) {
  await prisma.technology.delete({ where: { id } })
  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath('/technologies/[slug]')
}
