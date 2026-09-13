import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      where: { published: true },
      include: { metrics: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(caseStudies);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const slug = body.slug || body.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const validMetrics = Array.isArray(body.metrics)
      ? body.metrics.filter((m: any) => m && m.label?.trim() && m.value?.trim()).map((m: any) => ({
          label: m.label.trim(),
          value: m.value.trim(),
          description: m.description || null,
        }))
      : [];

    const galleryString = typeof body.gallery === 'string'
      ? body.gallery
      : JSON.stringify(Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : []);

    const caseStudy = await prisma.caseStudy.create({
      data: {
        title: body.title,
        slug,
        client: body.client || 'Client',
        industry: body.industry || 'Technology',
        problem: body.problem || body.briefDescription || '',
        solution: body.solution || '',
        implementation: body.implementation || '',
        technologies: body.technologies || '',
        results: body.results || '',
        year: parseInt(body.year, 10) || new Date().getFullYear(),
        services: body.services || '',
        heroImage: body.heroImage || null,
        gallery: galleryString,
        externalUrl: body.externalUrl || body.url || null,
        published: body.published === 'true' || body.published === true || body.published === 'on',
        order: parseInt(body.order, 10) || 0,
        ...(validMetrics.length > 0 ? { metrics: { create: validMetrics } } : {}),
      },
      include: { metrics: true },
    });

    revalidatePath('/');
    revalidatePath('/work');
    revalidatePath(`/work/${slug}`);
    revalidatePath('/case-studies');
    revalidatePath(`/case-studies/${slug}`);
    revalidatePath('/admin/case-studies');

    return NextResponse.json(caseStudy, { status: 201 });
  } catch (error: any) {
    console.error('Case study POST error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
