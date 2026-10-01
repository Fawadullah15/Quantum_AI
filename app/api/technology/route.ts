import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

function cleanString(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

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
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = cleanString(body.slug) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const tech = await prisma.technology.create({
      data: {
        name,
        slug,
        shortDescription: cleanString(body.shortDescription) || cleanString(body.description) || '',
        category: cleanString(body.category) || 'AI/ML',
        heroTitle: cleanString(body.heroTitle),
        heroDescription: cleanString(body.heroDescription),
        heroImage: cleanString(body.heroImage),
        content: cleanString(body.content),
        features: typeof body.features === 'string' ? body.features : JSON.stringify(body.features || []),
        useCases: typeof body.useCases === 'string' ? body.useCases : JSON.stringify(body.useCases || []),
        ctaTitle: cleanString(body.ctaTitle),
        ctaDescription: cleanString(body.ctaDescription),
        ctaText: cleanString(body.ctaText),
        ctaLink: cleanString(body.ctaLink),
        usage: cleanString(body.usage),
        projects: cleanString(body.projects),
        icon: cleanString(body.icon),
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
