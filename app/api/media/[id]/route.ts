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

    const { softDelete } = await import('@/lib/recovery');
    await softDelete({
      entityType: 'MEDIA',
      id,
      adminUser: {
        id: (session.user as any)?.id,
        name: session.user?.name || undefined,
        email: session.user?.email || undefined,
      },
    });

    return NextResponse.json({ success: true, message: 'Media moved to Recently Deleted' });
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    console.error('DELETE /api/media/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
