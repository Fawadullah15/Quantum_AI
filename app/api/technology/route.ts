import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const tech = await prisma.technology.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(tech);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const slug = body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const tech = await prisma.technology.create({
      data: {
        name: body.name,
        slug,
        shortDescription: body.shortDescription || body.description || '',
        category: body.category || 'AI/ML',
        heroTitle: body.heroTitle || null,
        heroDescription: body.heroDescription || null,
        heroImage: body.heroImage || null,
        content: body.content || null,
        features: typeof body.features === 'string' ? body.features : JSON.stringify(body.features || []),
        useCases: typeof body.useCases === 'string' ? body.useCases : JSON.stringify(body.useCases || []),
        ctaTitle: body.ctaTitle || null,
        ctaDescription: body.ctaDescription || null,
        ctaText: body.ctaText || null,
        ctaLink: body.ctaLink || null,
        usage: body.usage || null,
        projects: body.projects || null,
        icon: body.icon || null,
        order: parseInt(body.order, 10) || 0,
        published: body.published === 'true' || body.published === true || body.published === 'on' || body.published === undefined,
      },
    });

    revalidatePath('/technology');
    revalidatePath(`/technologies/${slug}`);
    revalidatePath('/');
    revalidatePath('/admin/technology');

    return NextResponse.json(tech, { status: 201 });
  } catch (error: any) {
    console.error('Technology POST error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
