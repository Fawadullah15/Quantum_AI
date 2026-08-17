"use server"

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTeamMember(data: any) {
  await prisma.teamMember.create({ data })
  revalidatePath('/admin/team')
}

export async function updateTeamMember(id: string, data: any) {
  await prisma.teamMember.update({ where: { id }, data })
  revalidatePath('/admin/team')
}

export async function deleteTeamMember(id: string) {
  await prisma.teamMember.delete({ where: { id } })
  revalidatePath('/admin/team')
}
