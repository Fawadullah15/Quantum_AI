'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

function cleanString(val: any): string | null {
  if (val === undefined || val === null) return null
  const s = String(val).trim()
  return s.length > 0 ? s : null
}

export async function createTechnology(data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const slug = cleanString(data.slug) || (data.name
    ? String(data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'tech-' + Date.now())

  const tech = await prisma.technology.create({
    data: {
      name: String(data.name || '').trim(),
      slug,
      shortDescription: cleanString(data.shortDescription) || cleanString(data.description) || '',
      category: cleanString(data.category) || 'AI/ML',
      heroTitle: cleanString(data.heroTitle),
      heroDescription: cleanString(data.heroDescription),
      heroImage: cleanString(data.heroImage),
      content: cleanString(data.content),
      features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
      useCases: typeof data.useCases === 'string' ? data.useCases : JSON.stringify(data.useCases || []),
      ctaTitle: cleanString(data.ctaTitle),
      ctaDescription: cleanString(data.ctaDescription),
      ctaText: cleanString(data.ctaText),
      ctaLink: cleanString(data.ctaLink),
      usage: cleanString(data.usage),
      projects: cleanString(data.projects),
      icon: cleanString(data.icon),
      order: parseInt(data.order, 10) || 0,
      published: data.published === 'true' || data.published === true || data.published === 'on' || data.published === undefined,
    }
  })

  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath(`/technologies/${slug}`)
  revalidatePath('/')
  return tech
}

export async function updateTechnology(id: string, data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const existing = await prisma.technology.findUnique({ where: { id } })
  if (!existing) throw new Error('Technology not found')

  const slug = cleanString(data.slug) || (data.name
    ? String(data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : existing.slug)

  const tech = await prisma.technology.update({
    where: { id },
    data: {
      name: data.name !== undefined ? String(data.name).trim() : existing.name,
      slug,
      shortDescription: data.shortDescription !== undefined ? (cleanString(data.shortDescription) || '') : existing.shortDescription,
      category: cleanString(data.category) || existing.category,
      heroTitle: cleanString(data.heroTitle),
      heroDescription: cleanString(data.heroDescription),
      heroImage: cleanString(data.heroImage),
      content: cleanString(data.content),
      features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
      useCases: typeof data.useCases === 'string' ? data.useCases : JSON.stringify(data.useCases || []),
      ctaTitle: cleanString(data.ctaTitle),
      ctaDescription: cleanString(data.ctaDescription),
      ctaText: cleanString(data.ctaText),
      ctaLink: cleanString(data.ctaLink),
      usage: cleanString(data.usage),
      projects: cleanString(data.projects),
      icon: cleanString(data.icon),
      order: parseInt(data.order, 10) || 0,
      published: data.published === 'true' || data.published === true || data.published === 'on',
    }
  })

  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath(`/technologies/${tech.slug}`)
  revalidatePath(`/technologies/${existing.slug}`)
  revalidatePath('/')
  return tech
}

export async function deleteTechnology(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const tech = await prisma.technology.delete({ where: { id } })
  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath(`/technologies/${tech.slug}`)
  revalidatePath('/')
  return { success: true }
}
