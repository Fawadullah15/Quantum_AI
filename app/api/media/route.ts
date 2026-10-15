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

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const isValidToken = token && !token.includes('your-blob-token') && token.trim().length > 10;

    if (isValidToken) {
      try {
        const blobPromise = put(fileName, file, { access: 'public', token });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Vercel Blob upload timeout')), 8000)
        );
        const blob = (await Promise.race([blobPromise, timeoutPromise])) as any;
        url = blob.url;
      } catch (blobErr) {
        console.warn('[Media Upload] Vercel Blob failed, falling back:', blobErr);
      }
    }

    // If Blob wasn't used or failed, try local file write
    if (!url) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const publicDir = join(process.cwd(), 'public', 'uploads');

        if (!existsSync(publicDir)) {
          await mkdir(publicDir, { recursive: true });
        }

        const path = join(publicDir, fileName);
        await writeFile(path, buffer);
        url = `/uploads/${fileName}`;
      } catch (fsErr) {
        // Local file system is read-only (e.g. Vercel Serverless environment without Blob store)
        console.warn('[Media Upload] Filesystem write failed, falling back to data URL:', fsErr);

        if (file.size <= 4 * 1024 * 1024) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          url = `data:${file.type};base64,${base64}`;
        } else {
          return NextResponse.json(
            { error: 'Storage provider unavailable and file exceeds 4MB inline limit. Please configure BLOB_READ_WRITE_TOKEN or paste an image URL.' },
            { status: 413 }
          );
        }
      }
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