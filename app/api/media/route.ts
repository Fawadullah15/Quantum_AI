import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    let url = '';

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;

    if (token) {
      // Use Vercel Blob if token is available
      const blob = await put(fileName, file, { access: 'public', token });
      url = blob.url;
    } else {
      // Fallback to local fs for local development
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const publicDir = join(process.cwd(), 'public', 'uploads');
      
      if (!existsSync(publicDir)) {
         await mkdir(publicDir, { recursive: true });
      }
      
      const path = join(publicDir, fileName);
      await writeFile(path, buffer);
      url = `/uploads/${fileName}`;
    }

    const media = await prisma.media.create({
      data: {
        filename: file.name,
        url,
        type: file.type,
        size: file.size,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}