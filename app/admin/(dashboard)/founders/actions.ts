'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { softDelete } from '@/lib/recovery'

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
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  await softDelete({
    entityType: 'FOUNDER',
    id,
    adminUser: { id: user?.id, name: user?.name, email: user?.email },
  })

  revalidatePath('/admin/founders')
}
