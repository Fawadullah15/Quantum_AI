import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { slug },
      include: { metrics: true },
    });
    if (!caseStudy) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(caseStudy);
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

    const galleryString = typeof body.gallery === 'string'
      ? body.gallery
      : (Array.isArray(body.gallery) ? JSON.stringify(body.gallery.filter(Boolean)) : undefined);

    const data: any = { ...body };
    if (galleryString !== undefined) data.gallery = galleryString;
    if (body.year !== undefined) data.year = parseInt(body.year, 10);
    if (body.order !== undefined) data.order = parseInt(body.order, 10);
    if (body.published !== undefined) data.published = Boolean(body.published);

    const updated = await prisma.caseStudy.update({
      where: { slug },
      data,
      include: { metrics: true },
    });

    revalidatePath('/');
    revalidatePath('/work');
    revalidatePath(`/work/${slug}`);
    revalidatePath(`/work/${updated.slug}`);
    revalidatePath('/case-studies');
    revalidatePath(`/case-studies/${slug}`);
    revalidatePath(`/case-studies/${updated.slug}`);
    revalidatePath('/admin/case-studies');

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
    await prisma.caseStudy.delete({
      where: { slug },
    });

    revalidatePath('/');
    revalidatePath('/work');
    revalidatePath(`/work/${slug}`);
    revalidatePath('/case-studies');
    revalidatePath(`/case-studies/${slug}`);
    revalidatePath('/admin/case-studies');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
