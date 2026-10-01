import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// GET: Fetch clients (public returns published only; admin can pass ?all=true)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const getAll = searchParams.get('all') === 'true';

    let whereClause: any = { published: true };

    if (getAll) {
      const session = await getServerSession(authOptions);
      if (session) {
        whereClause = {};
      }
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST: Protected endpoint for creating a new client
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, logo, website, industry, description, featured, published, order } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Client / Organization name is required' }, { status: 400 });
    }

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const newClient = await prisma.client.create({
      data: {
        name: name.trim(),
        slug,
        logo: logo || null,
        website: website || null,
        industry: industry || 'Enterprise',
        description: description || null,
        featured: featured ?? true,
        published: published ?? true,
        order: typeof order === 'number' ? order : 0,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/clients');

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
