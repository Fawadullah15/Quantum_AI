import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { del } from '@vercel/blob';

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

    const media = await prisma.media.findUnique({ where: { id } });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Attempt to delete from Vercel Blob if the URL is hosted there
    if (media.url.includes('public.blob.vercel-storage.com')) {
      try {
          const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
        await del(media.url, { token });
      } catch (blobErr) {
        console.error('Error deleting from Vercel Blob:', blobErr);
      }
    }

    await prisma.media.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    console.error('DELETE /api/media/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
