import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const media = await prisma.media.findUnique({
      where: { id: (await params).id },
    });

    if (!media) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // Try to remove from disk
    const fileName = media.url.replace('/uploads/', '');
    const path = join(process.cwd(), 'public', 'uploads', fileName);
    try {
      await unlink(path);
    } catch (err) {
      console.error('Failed to delete file from disk:', err);
      // Proceed to delete from DB even if disk deletion fails
    }

    await prisma.media.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
