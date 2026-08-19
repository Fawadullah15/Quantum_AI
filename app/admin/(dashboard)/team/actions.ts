"use server"

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

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

  await prisma.teamMember.delete({ where: { id } })
  revalidatePath('/admin/team')
  revalidatePath('/team')
  revalidatePath('/leadership')
  revalidatePath('/')
}
