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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tech = await prisma.technology.findUnique({
      where: { id },
    });
    if (!tech) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(tech);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.technology.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    const slug = cleanString(body.slug) || (body.name
      ? String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : existing.slug);

    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.slug !== undefined || body.name !== undefined) data.slug = slug;
    if (body.shortDescription !== undefined || body.description !== undefined) {
      data.shortDescription = cleanString(body.shortDescription) || cleanString(body.description) || '';
    }
    if (body.category !== undefined) data.category = cleanString(body.category) || existing.category;
    if (body.heroTitle !== undefined) data.heroTitle = cleanString(body.heroTitle);
    if (body.heroDescription !== undefined) data.heroDescription = cleanString(body.heroDescription);
    if (body.heroImage !== undefined) data.heroImage = cleanString(body.heroImage);
    if (body.content !== undefined) data.content = cleanString(body.content);
    if (body.features !== undefined) {
      data.features = typeof body.features === 'string' ? body.features : JSON.stringify(body.features || []);
    }
    if (body.useCases !== undefined) {
      data.useCases = typeof body.useCases === 'string' ? body.useCases : JSON.stringify(body.useCases || []);
    }
    if (body.ctaTitle !== undefined) data.ctaTitle = cleanString(body.ctaTitle);
    if (body.ctaDescription !== undefined) data.ctaDescription = cleanString(body.ctaDescription);
    if (body.ctaText !== undefined) data.ctaText = cleanString(body.ctaText);
    if (body.ctaLink !== undefined) data.ctaLink = cleanString(body.ctaLink);
    if (body.usage !== undefined) data.usage = cleanString(body.usage);
    if (body.projects !== undefined) data.projects = cleanString(body.projects);
    if (body.icon !== undefined) data.icon = cleanString(body.icon);
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    if (body.published !== undefined) {
      data.published = body.published === 'true' || body.published === true || body.published === 'on';
    }

    const updated = await prisma.technology.update({
      where: { id },
      data,
    });

    revalidatePath('/technology');
    revalidatePath(`/technologies/${updated.slug}`);
    revalidatePath(`/technologies/${existing.slug}`);
    revalidatePath('/');
    revalidatePath('/admin/technology');

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const tech = await prisma.technology.delete({
      where: { id },
    });

    revalidatePath('/technology');
    revalidatePath(`/technologies/${tech.slug}`);
    revalidatePath('/');
    revalidatePath('/admin/technology');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
