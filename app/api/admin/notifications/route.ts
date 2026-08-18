import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [unreadCount, recentSubmissions] = await Promise.all([
      prisma.contactSubmission.count({ where: { status: 'NEW' } }).catch(() => 0),
      prisma.contactSubmission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    return NextResponse.json({
      unreadCount,
      notifications: recentSubmissions.map(sub => ({
        id: sub.id,
        title: `New Inquiry from ${sub.name}`,
        subtitle: sub.projectType || sub.email,
        snippet: sub.message.length > 80 ? sub.message.slice(0, 80) + '...' : sub.message,
        createdAt: sub.createdAt,
        status: sub.status,
        link: `/admin/messages/${sub.id}`,
      })),
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ unreadCount: 0, notifications: [] });
  }
}
