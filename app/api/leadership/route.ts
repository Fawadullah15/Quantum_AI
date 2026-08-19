import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const members = await prisma.leadership.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { name, position, department, shortBio, fullBio, photo, email, linkedin, website, location, displayOrder, isActive, slug } = data;

    if (!name || !shortBio) {
      return NextResponse.json({ error: 'Name and shortBio are required' }, { status: 400 });
    }

    // Find the highest numeric suffix in existing publicIds to prevent duplicate key collision
    const allMembers = await prisma.leadership.findMany({
      select: { publicId: true },
    });
    let maxId = 0;
    for (const m of allMembers) {
      const match = m.publicId?.match(/QA-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
    const publicId = `QA-${String(maxId + 1).padStart(3, '0')}`;

    const memberSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const member = await prisma.leadership.create({
      data: {
        publicId,
        slug: memberSlug,
        name,
        position,
        department: department || null,
        shortBio,
        fullBio: fullBio || null,
        photo: photo || null,
        email: email || null,
        linkedin: linkedin || null,
        website: website || null,
        location: location || null,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : maxId,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    revalidatePath('/');
    revalidatePath('/leadership');
    revalidatePath('/team');
    revalidatePath(`/leadership/${memberSlug}`);
    revalidatePath('/admin/leadership');

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Leadership POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
