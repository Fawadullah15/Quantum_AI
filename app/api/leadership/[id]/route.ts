import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await prisma.leadership.findUnique({
      where: { id },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.position !== undefined) data.position = body.position;
    if (body.department !== undefined) data.department = body.department || null;
    if (body.shortBio !== undefined) data.shortBio = body.shortBio;
    if (body.fullBio !== undefined) data.fullBio = body.fullBio || null;
    if (body.photo !== undefined) data.photo = body.photo || null;
    if (body.email !== undefined) data.email = body.email || null;
    if (body.linkedin !== undefined) data.linkedin = body.linkedin || null;
    if (body.website !== undefined) data.website = body.website || null;
    if (body.location !== undefined) data.location = body.location || null;
    if (body.displayOrder !== undefined) data.displayOrder = parseInt(body.displayOrder, 10) || 0;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const updated = await prisma.leadership.update({
      where: { id },
      data,
    });

    revalidatePath('/');
    revalidatePath('/leadership');
    revalidatePath('/team');
    if (updated.slug) {
      revalidatePath(`/leadership/${updated.slug}`);
    }
    revalidatePath('/admin/leadership');

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating leadership member:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.leadership.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/leadership');
    revalidatePath('/team');
    revalidatePath('/admin/leadership');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
