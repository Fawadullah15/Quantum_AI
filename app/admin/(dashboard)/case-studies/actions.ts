'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createCaseStudy(data: any) {
  const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  await prisma.caseStudy.create({
    data: {
      title: data.title,
      slug,
      client: data.client || 'Client',
      industry: data.industry || 'Technology',
      problem: data.problem || '',
      solution: data.solution || '',
      implementation: data.implementation || '',
      technologies: data.technologies || '',
      results: data.results || '',
      year: parseInt(data.year, 10) || new Date().getFullYear(),
      services: data.services || '',
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order, 10) || 0,
    }
  })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath('/case-studies')
  revalidatePath('/api/case-studies')
  revalidatePath('/admin/case-studies')
}

export async function updateCaseStudy(id: string, data: any) {
  const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  await prisma.caseStudy.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      client: data.client,
      industry: data.industry,
      problem: data.problem,
      solution: data.solution,
      implementation: data.implementation,
      technologies: data.technologies,
      results: data.results,
      year: parseInt(data.year, 10) || new Date().getFullYear(),
      services: data.services,
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order, 10) || 0,
    }
  })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath('/case-studies')
  revalidatePath(`/work/${slug}`)
  revalidatePath(`/case-studies/${slug}`)
  revalidatePath('/api/case-studies')
  revalidatePath('/admin/case-studies')
}

export async function deleteCaseStudy(id: string) {
  await prisma.caseStudy.delete({
    where: { id }
  })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath('/case-studies')
  revalidatePath('/api/case-studies')
  revalidatePath('/admin/case-studies')
}
