"use server"

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { softDelete } from '@/lib/recovery'

export async function createTeamMember(data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const member = await prisma.teamMember.create({ data })
  revalidatePath('/admin/team')
  revalidatePath('/team')
  revalidatePath('/leadership')
  revalidatePath('/')
  return member
}

export async function updateTeamMember(id: string, data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const member = await prisma.teamMember.update({ where: { id }, data })
  revalidatePath('/admin/team')
  revalidatePath('/team')
  revalidatePath('/leadership')
  revalidatePath('/')
  return member
}

export async function deleteTeamMember(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const user = session.user as any
  await softDelete({
    entityType: 'TEAM_MEMBER',
    id,
    adminUser: { id: user?.id, name: user?.name, email: user?.email },
  })

  return { success: true }
}
