'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function createTechnology(data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const slug = data.slug || data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  const tech = await prisma.technology.create({
    data: {
      name: data.name,
      slug,
      shortDescription: data.shortDescription || data.description || '',
      category: data.category || 'AI/ML',
      heroTitle: data.heroTitle || null,
      heroDescription: data.heroDescription || null,
      heroImage: data.heroImage || null,
      content: data.content || null,
      features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
      useCases: typeof data.useCases === 'string' ? data.useCases : JSON.stringify(data.useCases || []),
      ctaTitle: data.ctaTitle || null,
      ctaDescription: data.ctaDescription || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,
      usage: data.usage || null,
      projects: data.projects || null,
      icon: data.icon || null,
      order: parseInt(data.order, 10) || 0,
      published: data.published === 'true' || data.published === true || data.published === 'on',
    }
  })

  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath('/technologies/[slug]')
  revalidatePath('/')
  return tech
}

export async function updateTechnology(id: string, data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const slug = data.slug || (data.name
    ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : undefined)

  const tech = await prisma.technology.update({
    where: { id },
    data: {
      name: data.name,
      ...(slug ? { slug } : {}),
      shortDescription: data.shortDescription || data.description || '',
      category: data.category || 'AI/ML',
      heroTitle: data.heroTitle || null,
      heroDescription: data.heroDescription || null,
      heroImage: data.heroImage || null,
      content: data.content || null,
      features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
      useCases: typeof data.useCases === 'string' ? data.useCases : JSON.stringify(data.useCases || []),
      ctaTitle: data.ctaTitle || null,
      ctaDescription: data.ctaDescription || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,
      usage: data.usage || null,
      projects: data.projects || null,
      icon: data.icon || null,
      order: parseInt(data.order, 10) || 0,
      published: data.published === 'true' || data.published === true || data.published === 'on',
    }
  })

  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath('/technologies/[slug]')
  revalidatePath('/')
  return tech
}

export async function deleteTechnology(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  await prisma.technology.delete({ where: { id } })
  revalidatePath('/admin/technology')
  revalidatePath('/technology')
  revalidatePath('/technologies/[slug]')
  revalidatePath('/')
}
