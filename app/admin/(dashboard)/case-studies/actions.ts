'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function createCaseStudy(data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  const validMetrics = Array.isArray(data.metrics)
    ? data.metrics.filter((m: any) => m && m.label?.trim() && m.value?.trim()).map((m: any) => ({
        label: m.label.trim(),
        value: m.value.trim(),
        description: m.description || null,
      }))
    : []

  const galleryString = typeof data.gallery === 'string'
    ? data.gallery
    : JSON.stringify(Array.isArray(data.gallery) ? data.gallery.filter(Boolean) : [])

  const study = await prisma.caseStudy.create({
    data: {
      title: data.title,
      slug,
      client: data.client || 'Client',
      industry: data.industry || 'Technology',
      problem: data.problem || data.briefDescription || '',
      solution: data.solution || '',
      implementation: data.implementation || '',
      technologies: data.technologies || '',
      results: data.results || '',
      year: parseInt(data.year, 10) || new Date().getFullYear(),
      services: data.services || '',
      heroImage: data.heroImage || null,
      gallery: galleryString,
      externalUrl: data.externalUrl || data.url || null,
      published: data.published === 'true' || data.published === true || data.published === 'on',
      order: parseInt(data.order, 10) || 0,
      ...(validMetrics.length > 0 ? { metrics: { create: validMetrics } } : {}),
    }
  })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath(`/work/${slug}`)
  revalidatePath('/case-studies')
  revalidatePath(`/case-studies/${slug}`)
  revalidatePath('/api/case-studies')
  revalidatePath('/admin/case-studies')
  return study
}

export async function updateCaseStudy(id: string, data: any) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const galleryString = typeof data.gallery === 'string'
    ? data.gallery
    : (Array.isArray(data.gallery) ? JSON.stringify(data.gallery.filter(Boolean)) : undefined)

  const study = await prisma.caseStudy.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      client: data.client,
      industry: data.industry,
      problem: data.problem || data.briefDescription,
      solution: data.solution,
      implementation: data.implementation,
      technologies: data.technologies,
      results: data.results,
      year: parseInt(data.year, 10) || new Date().getFullYear(),
      services: data.services,
      heroImage: data.heroImage !== undefined ? (data.heroImage || null) : undefined,
      ...(galleryString !== undefined ? { gallery: galleryString } : {}),
      externalUrl: data.externalUrl || data.url || null,
      published: data.published === 'true' || data.published === true || data.published === 'on',
      order: parseInt(data.order, 10) || 0,
    }
  })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath(`/work/${slug}`)
  revalidatePath('/case-studies')
  revalidatePath(`/case-studies/${slug}`)
  revalidatePath('/api/case-studies')
  revalidatePath('/admin/case-studies')
  return study
}

export async function deleteCaseStudy(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  await prisma.caseStudy.delete({
    where: { id }
  })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath('/case-studies')
  revalidatePath('/api/case-studies')
  revalidatePath('/admin/case-studies')
}
