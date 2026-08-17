'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createFounder(data: {
  name: string
  role: string
  bio: string
  photo?: string | null
  linkedin?: string | null
  twitter?: string | null
  github?: string | null
  order?: number
  published?: boolean
}) {
  await prisma.founder.create({
    data: {
      ...data,
      order: data.order ?? 0,
      published: data.published ?? true,
    },
  })
  revalidatePath('/admin/founders')
}

export async function updateFounder(id: string, data: {
  name: string
  role: string
  bio: string
  photo?: string | null
  linkedin?: string | null
  twitter?: string | null
  github?: string | null
  order?: number
  published?: boolean
}) {
  await prisma.founder.update({
    where: { id },
    data,
  })
  revalidatePath('/admin/founders')
}

export async function deleteFounder(id: string) {
  await prisma.founder.delete({
    where: { id },
  })
  revalidatePath('/admin/founders')
}
