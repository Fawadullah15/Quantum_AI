import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const where: any = { published: true };
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      include: {
        features: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const slug = body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const technologies = typeof body.technologies === 'string'
      ? body.technologies
      : (Array.isArray(body.technologies) ? body.technologies.join(', ') : '');

    const validFeatures = Array.isArray(body.features)
      ? body.features.filter((f: any) => f && f.title?.trim()).map((f: any, idx: number) => ({
          title: f.title.trim(),
          description: f.description || '',
          order: idx,
        }))
      : [];

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        description: body.description || '',
        category: body.category || 'AI Software',
        status: body.status || 'LIVE',
        heroImage: body.heroImage || null,
        demoUrl: body.demoUrl || null,
        docsUrl: body.docsUrl || null,
        technologies,
        published: body.published === 'true' || body.published === true || body.published === 'on',
        order: parseInt(body.order, 10) || 0,
        ...(validFeatures.length > 0 ? { features: { create: validFeatures } } : {}),
      },
      include: {
        features: true,
      },
    });

    revalidatePath('/products');
    revalidatePath(`/products/${slug}`);
    revalidatePath('/');
    revalidatePath('/admin/products');

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Product POST error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
