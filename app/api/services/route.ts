import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const service = await prisma.service.create({
      data: {
        name: body.name,
        category: body.category || 'AI',
        description: body.description || '',
        icon: body.icon || null,
        order: parseInt(body.order, 10) || 0,
        published: body.published === 'true' || body.published === true || body.published === 'on' || body.published === undefined,
      },
    });

    revalidatePath('/services');
    revalidatePath('/systems');
    revalidatePath('/');
    revalidatePath('/admin/services');

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
