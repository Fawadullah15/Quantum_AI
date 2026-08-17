import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

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

    // Generate publicId: QA-001 format
    const count = await prisma.leadership.count();
    const publicId = `QA-${String(count + 1).padStart(3, '0')}`;

    const member = await prisma.leadership.create({
      data: {
        publicId,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
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
        displayOrder: displayOrder ?? count,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Leadership POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
