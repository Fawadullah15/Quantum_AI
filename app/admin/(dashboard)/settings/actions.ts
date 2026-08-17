'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateSiteSettings(data: { key: string; value: string }[]) {
  for (const item of data) {
    await prisma.siteSettings.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: { key: item.key, value: item.value }
    })
  }
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
}
