'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createCaseStudy(data: any) {
  await prisma.caseStudy.create({
    data: {
      title: data.title,
      slug: data.slug,
      client: data.client,
      industry: data.industry,
      problem: data.problem,
      solution: data.solution,
      implementation: data.implementation,
      technologies: data.technologies,
      results: data.results,
      year: parseInt(data.year, 10),
      services: data.services,
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order, 10) || 0,
    }
  })
  revalidatePath('/admin/case-studies')
}

export async function updateCaseStudy(id: string, data: any) {
  await prisma.caseStudy.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      client: data.client,
      industry: data.industry,
      problem: data.problem,
      solution: data.solution,
      implementation: data.implementation,
      technologies: data.technologies,
      results: data.results,
      year: parseInt(data.year, 10),
      services: data.services,
      published: data.published === 'true' || data.published === true,
      order: parseInt(data.order, 10) || 0,
    }
  })
  revalidatePath('/admin/case-studies')
}

export async function deleteCaseStudy(id: string) {
  await prisma.caseStudy.delete({
    where: { id }
  })
  revalidatePath('/admin/case-studies')
}
