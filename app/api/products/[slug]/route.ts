import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        features: { orderBy: { order: 'asc' } },
      },
    });
    if (!product) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const body = await request.json();

    const data: any = { ...body };
    if (body.order !== undefined) data.order = parseInt(body.order, 10);
    if (body.published !== undefined) data.published = Boolean(body.published);

    const updated = await prisma.product.update({
      where: { slug },
      data,
      include: {
        features: { orderBy: { order: 'asc' } },
      },
    });

    revalidatePath('/products');
    revalidatePath(`/products/${slug}`);
    revalidatePath(`/products/${updated.slug}`);
    revalidatePath('/');
    revalidatePath('/admin/products');

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    await prisma.product.delete({
      where: { slug },
    });

    revalidatePath('/products');
    revalidatePath(`/products/${slug}`);
    revalidatePath('/');
    revalidatePath('/admin/products');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
